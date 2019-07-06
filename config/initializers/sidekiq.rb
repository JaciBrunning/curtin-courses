require 'sidekiq/web'

Sidekiq.configure_server do |cfg|
  cfg.redis = { url: 'redis://redis:6379/0' }  
end

Sidekiq.configure_client do |cfg|
  cfg.redis = { url: 'redis://redis:6379/0' }
end

Sidekiq::Web.use(Rack::Auth::Basic) do |user, pass|
  user == Rails.application.credentials.dig(:sidekiq_user)
  pass == Rails.application.credentials.dig(:sidekiq_pass)
end