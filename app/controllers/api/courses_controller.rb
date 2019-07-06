module Api
  class CoursesController < ApplicationController
    def index
      cache_render "courses_index", Course.all
    end

    def show
      render json: Course.find_by_code(params[:code]), include: '**', units: true
    end

    def streams
      render json: Course.find_by_code(params[:code]), streams: true
    end
  end
end