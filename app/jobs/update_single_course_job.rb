require 'open-uri'
require 'nokogiri'

class UpdateSingleCourseJob < ApplicationJob
  queue_as :default

  OPTIONAL_REGEX = /Optional.Units.to.Select.from.in.(.+)/
  UNIT_TITLE_REGEX = /([A-Z0-9-]{6,10}).\([a-zA-Z\.0-9]+\).(.+)/
  UNIT_MODIFICATION_BOUND = 1.day

  def perform(url, parent=nil)
    puts "Update Course: #{url}"

    doc = Nokogiri::HTML(open(url))
    title = parse_course_title doc

    # Insert course record

    course = Course.find_or_initialize_by(code: title[:code])
    course.name = title[:name]
    course.url = url
    course.stream_parent = Course.find_by(code: parent) if parent
    course.save

    # Get list of units / streams

    parse_organisation(url, doc).each do |entry|
      org_url = entry[:url]
      if org_url.include? "courses"
        # Is a stream, update the course and add a binding
        UpdateSingleCourseJob.perform_now org_url, course.code
      else
        # Is a unit - do the work in (avoid loading more jobs)
        update_unit org_url, course, entry[:optional]
        # UpdateSingleUnitJob.perform_now org_url, course.id, entry[:optional]
      end
    end
  end

  def parse_course_title doc
    title = doc.css("div#content h1").first.text.strip.split("\n").map(&:strip).reject(&:empty?)
    { code: title[0].split(' ')[0], name: title[1] }
  end

  def parse_organisation url, doc
    title = nil
    opt = nil
    entries = []

    doc.css("div#content table.fullwidth tr").each do |tr|
      them = tr.css("th em")
      tda = tr.css("td a")
      if them.count == 1
        # Parse title - could be describing a set of optionals
        title = them.text.strip
        if title =~ OPTIONAL_REGEX
          opt = $1
        else
          opt = nil
        end
      elsif tda.count == 1
        # Parse href, it's a link to a unit or stream
        entries << { title: title, optional: opt, url: URI::join(url, tda.first['href']).to_s }
      end
    end
    entries
  end

  # -- UNITS --

  def update_unit url, course, opt
    unit = Unit.find_by(url: url)
    # Update the unit if sufficiently old
    if (unit.nil? || (Date.today - unit.updated_at.to_date) < UNIT_MODIFICATION_BOUND)
      # New unit - doesn't exist
      doc = Nokogiri::HTML(open(url))
      title = parse_unit_title doc

      # Insert unit record

      unit_details = parse_unit_details doc

      unit ||= Unit.new
      unit.code = title[:code]
      unit.name = title[:name]
      unit.url = url
      unit.credits = unit_details[:credits]
      unit.prereqs = unit_details[:prereq].to_json
      unit.save
    end

    # Bind the unit to a course

    bind = CourseUnit.find_or_initialize_by(course: course, unit: unit)
    bind.optional = opt
    bind.save
  end

  def parse_unit_title doc
    title = doc.css("div#content h1").first.text.strip
    if title =~ UNIT_TITLE_REGEX
      { code: $1, name: $2 }
    else
      raise "Invalid Unit Title: #{title}"
    end
  end

  def parse_unit_details doc
    h = {}
    doc.css("div#content table tr").each do |entry|
      th = entry.css("th").first
      td = entry.css("td").first
      if th && td
        h[:credits] = td.text.to_f if th.text == "Credits:"

        if th.text == "Prerequisite(s):"
          h[:prereq] = prereqs_to_postfix td.inner_html
        end
      end
    end
    h
  end

  def prereqs_to_postfix html
    # Build the postfix prerequisites expression
    prec = { '(': 1, OR: 2, AND: 2 }
    postfix = []
    stack = []
    cur_level = -1

    html.split("<br>").map do |text|
      # Strip the (shitty) HTML formatting nonsense and make it look like it does on the page
      final_str = text.split("\n").map(&:strip).reject(&:empty?).join(" ")
      # Tokenize the prerequisite condition. Can be one of:
      #    AND, OR (reduction)
      #    Unit
      #    Admission into course (we ignore this for the most part)
      tokens = final_str.scan(/^([[:space:]]*)(AND|OR|([a-zA-Z]{4}?\d{4,6}\s\(v\.\d+\))|Admission)/).flatten
      unless tokens.empty?
        type = tokens[2].nil? ? (tokens[1] == "Admission" ? :admission : :reduction) : :unit
        level = tokens[0].length
        name = tokens[1].split(" ").first

        level_match = (level - cur_level).abs <= 2

        unless level_match
          if level > cur_level
            # Add an open bracket
            stack.push '('
          elsif level < cur_level
            # Add a closed bracket (backtrack until the last open bracket)
            top = stack.pop
            while top != '('
              postfix << top
              top = stack.pop
            end
          end
          cur_level = level
        end

        unless type == :reduction
          # postfix << [type, name]
          postfix << { type: type, name: name }
        else
          # Push any reduction operators
          while !stack.empty? && prec[stack.last.to_sym] >= prec[name.to_sym]
            postfix << stack.pop
          end
          stack.push(name)
        end
      end
    end

    # Clear any remaining items on the stack, not including open brackets
    while !stack.empty?
      x = stack.pop
      postfix << x unless x == '('
    end

    # Remove all old unit codes and admission requirements - assume they've been met
    stack = []
    postfix.each do |token|
      if token.is_a?(Array) || token.is_a?(Hash)
        stack.push token
      else
        operands = [stack.pop, stack.pop]
        const_operands = operands.map { |x| x.is_a?(Hash) && (x[:type] == :admission || (x[:type] == :unit && x[:name] =~ /^\d{4,6}$/)) }

        if const_operands[0] 
          stack.push(operands[1])
        elsif const_operands[1]
          stack.push(operands[0])
        else
          stack.push(operands + [token])
        end
      end
    end

    # Flatten into the final postfix expression
    postfix = stack.flatten.map do |x| 
      if x.is_a?(Hash)
        x[:name]
      elsif x == "AND"
        "&"
      elsif x == "OR"
        "|"
      else
        "?"
      end
    end

    postfix
  end
end
