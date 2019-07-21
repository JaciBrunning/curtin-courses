module Api
  class UnitsController < ApplicationController
    def index
      cache_render "units_index", Unit.where.not(freeform: true), brief: true
    end

    def show
      render json: Unit.where(code: params[:code].split(','))
    end

    def courses
      render json: Unit.find_by_code(params[:code]), courses: true
    end

    # Availabilities

    def availability_schema
      dist = UnitAvailability.distinct
      render json: {
        years: dist.pluck(:year).sort,
        periods: dist.pluck(:period).sort,
        locations: dist.pluck(:location).sort
      }
    end
  end
end