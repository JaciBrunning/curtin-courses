module Api
  class SearchController < ApplicationController
    def all
      courses = Course.search(params[:query]).limit(6)
      units = Unit.search(params[:query]).limit(6)

      courses = (serialize(courses).serializable_hash[:courses] || []).map { |x| x[:type] = :course; x }
      units = (serialize(units).serializable_hash[:units] || []).map { |x| x[:type] = :unit; x }

      render json: { results: (courses + units) }
    end

    def courses
      render json: Course.search(params[:query]).limit(10), root: 'results'
    end

    def units
      render json: Unit.search(params[:query]).limit(10), root: 'results'
    end
  end
end