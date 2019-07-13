FROM jaci/rails-base:5.2.3-alpine

RUN apk add --no-cache sqlite-dev

# Bundle install Gemfile first to take advantage of caching
COPY ./Gemfile /app/Gemfile
COPY ./Gemfile.lock /app/Gemfile.lock

RUN bundle install

COPY . /app

RUN bundle install

RUN rake assets:precompile RAILS_ENV=production SECRET_KEY_BASE=`rake secret` RAILS_MASTER_KEY=`rake secret`

ENTRYPOINT ["sh", "/app/entrypoint.sh"]