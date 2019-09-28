class CleanDbJob < ApplicationJob
  queue_as :default

  def perform()
    puts "Cleaning DB"
    CourseUnit.delete_all
    UnitAvailability.delete_all
    Unit.delete_all
    Course.delete_all
  end
end