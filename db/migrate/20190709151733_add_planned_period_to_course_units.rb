class AddPlannedPeriodToCourseUnits < ActiveRecord::Migration[5.2]
  def change
    add_column :course_units, :planned_period, :string, null: true
    add_column :course_units, :planned_level, :integer, default: 0
    reversible do |change|
      change.up do
        change_column :course_units, :optional, :boolean
      end

      change.down do
        change_column :course_units, :optional, :string
      end
    end
  end
end
