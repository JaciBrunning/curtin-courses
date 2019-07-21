class FixCourseUnitOptionals < ActiveRecord::Migration[5.2]
  def up
    remove_index :course_units, name: :index_course_units_on_course_id_and_unit_id
    add_index :course_units, [:course_id, :unit_id, :planned_period], unique: true, name: :index_course_units_uniq
  end

  def down
    add_index :course_units, [:course_id, :unit_id], unique: true
    remove_index :course_units, name: :index_course_units_uniq
  end
end
