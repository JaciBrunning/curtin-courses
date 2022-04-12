source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '2.6.0'

gem 'rails', '~> 5.2.3'
gem 'pg', '>= 0.18', '< 2.0'
gem 'puma', '~> 3.12'
gem 'sass-rails', '~> 5.0'
gem 'uglifier', '3.0.0'

gem 'turbolinks', '~> 5'
gem 'jbuilder', '~> 2.5'

gem 'sidekiq', '5.2.6'
gem 'sidekiq-enqueuer', '2.1.1'

gem "google-cloud-storage", require: false

gem 'bootsnap', '>= 1.1.0', require: false

gem 'prometheus-client'

gem 'nokogiri', '~> 1.13.4'
gem 'active_model_serializers', '~> 0.10.9'
gem 'goldiloader', '~> 3.1.1'

gem 'webpacker'
gem 'react-rails'
gem 'rails-fontawesome5'

group :development, :test do
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
end

group :development do
  gem 'web-console', '>= 3.3.0'
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'

  gem 'foreman'

  gem 'sqlite3'
end

group :test do
  gem 'capybara', '>= 2.15'
  gem 'selenium-webdriver'
  gem 'chromedriver-helper'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
