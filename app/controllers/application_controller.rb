class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  # We don't want to cache _every_ response, so we're only caching the stuff we need
  # to. For example, we don't need to cache every serialized render, just the large ones.
  def cache_render key, relation, options={}
    cache = Rails.cache.fetch("curtin_courses_#{key}") do
      ActiveModelSerializers::SerializableResource.new(relation, options).as_json
    end
    render json: cache
  end
end
