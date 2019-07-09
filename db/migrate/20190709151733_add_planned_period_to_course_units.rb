class AddPlannedPeriodToCourseUnits < ActiveRecord::Migration[5.2]
  def change
    add_column :course_units, :planned_period, :string, null: true
    add_column :course_units, :planned_level, :integer, default: 0
    remove_column :course_units, :optional
    add_column :course_units, :optional, :boolean, default: false
  end
end
