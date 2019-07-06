module Api
  class UnitsController < ApplicationController
    def index
      cache_render "units_index", Unit.all, brief: true
    end

    def show
      render json: Unit.find_by_code(params[:code])
    end

    def courses
      render json: Unit.find_by_code(params[:code]), courses: true
    end
  end
end