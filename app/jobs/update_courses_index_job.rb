require 'open-uri'
require 'nokogiri'

class UpdateCoursesIndexJob < ApplicationJob
  queue_as :default

  def perform(force=false, listing_url=nil)
    puts "Polling course index..."
    @force = force

    if listing_url.nil?
      get_alphabet_entries.each { |url| process_listing url }
    else
      process_listing listing_url
    end
  end

  def get_alphabet_entries
    url = "http://handbook.curtin.edu.au/courseList.html"
    doc = Nokogiri::HTML(open(url))
    doc.css("div#content p a").map do |course_listing|
      URI::join(url, course_listing['href']).to_s
    end
  end

  def process_listing url
    doc = Nokogiri::HTML(open(url))
    doc.css("div#content ul li a").each do |course_a|
      course_url = URI::join(url, course_a['href']).to_s
      if Rails.env.development?
        UpdateSingleCourseJob.perform_now course_url, @force
      else
        UpdateSingleCourseJob.perform_later course_url, @force
      end
    end
  end
end