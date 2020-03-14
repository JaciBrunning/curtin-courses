FROM jaci/rails-base:5.2.3-alpine

RUN apk add --no-cache sqlite-dev

# Copy all dependency files over before the main stuff
# The reason for this is that it reduces the number of layers that
# require rebuilding. If we copied all the files here, the bundle install
# layer would require rebuilding every time, which is both time and space
# expensive.
COPY ./build/depslayer /app

RUN bundle install

COPY . /app

RUN bundle install

RUN rake assets:precompile RAILS_ENV=production SECRET_KEY_BASE=`rake secret` RAILS_MASTER_KEY=`rake secret`

ENTRYPOINT ["sh", "/app/entrypoint.sh"]