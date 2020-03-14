require 'fileutils'

DOCKER_TAG=ENV.fetch('DOCKER_TAG') {"#{`git rev-parse --short HEAD`.strip}#{`git diff HEAD --quiet || echo -dirty`.strip}"}
DOCKER_REPO=ENV.fetch('DOCKER_REPO') {"gcr.io/imjacinta/jaci/curtincourses"}

DOCKER_IMG="#{DOCKER_REPO}:#{DOCKER_TAG}"

def copy_deps
  FileUtils.mkdir_p 'build/depslayer'
  Dir.glob(['**/Gemfile', '**/Gemfile.lock', '**/*.gemspec']).each do |file|
    next if file.include?('build/depslayer')
    
    dest = "build/depslayer/#{file}"
    FileUtils.mkdir_p(File.dirname(dest))
    
    if !File.exist?(dest) || File.read(file) != File.read(dest)
      puts "Update: #{file} -> #{dest}"
      FileUtils.cp(file, dest) 
    end
  end
end

def docker_build
  copy_deps
  system "docker build -t #{DOCKER_IMG} ."
end

def docker_push
  docker_build
  system "docker push #{DOCKER_IMG}"
end

if __FILE__ == $0
  act = ARGV[0]
  if act == 'build'
    docker_build
  elsif act == 'push'
    docker_push
  elsif act == 'get_tag'
    puts DOCKER_TAG
  elsif act == 'get_img'
    puts DOCKER_IMG
  elsif act == 'get_repo'
    puts DOCKER_REPO
  end
end