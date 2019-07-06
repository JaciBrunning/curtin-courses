class CoursesController < ApplicationController
  def show
    @course = Course.find_by_code(params[:code])
  end
end
