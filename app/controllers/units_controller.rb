class UnitsController < ApplicationController
  def show
    @unit = Unit.find_by_code(params[:code])
  end

  def courses
    @unit = Unit.find_by_code(params[:code])
  end
end
