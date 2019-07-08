FROM ruby:2.6.0

RUN apt-get update -qq && apt-get install -y vim build-essential curl libpq-dev software-properties-common
RUN (curl -sL https://deb.nodesource.com/setup_11.x | bash -) && apt-get update -qq && apt-get install -y nodejs && npm install -g yarn

RUN gem install bundler

RUN mkdir /app
COPY . /app
WORKDIR /app

RUN bundle install

RUN rake assets:precompile RAILS_ENV=production SECRET_KEY_BASE=`rake secret` RAILS_MASTER_KEY=`rake secret`

ENTRYPOINT ["sh", "/app/entrypoint.sh"]