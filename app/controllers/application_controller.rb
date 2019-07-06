class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session

  def serialize relation, options={} 
    ActiveModelSerializers::SerializableResource.new(relation, options)
  end

  # We don't want to cache _every_ response, so we're only caching the stuff we need
  # to. For example, we don't need to cache every serialized render, just the large ones.
  def cache_render key, relation, options={}
    cache = Rails.cache.fetch("curtin_courses_#{key}") do
      serialize(relation, options).as_json
    end
    render json: cache
  end
end
