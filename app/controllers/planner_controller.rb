class PlannerController < ApplicationController
  def index
  end

  def show
    @course = Course.find_by_code(params[:course_code])
  end
end
