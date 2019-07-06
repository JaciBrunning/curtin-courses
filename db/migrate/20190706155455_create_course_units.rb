class CreateCourseUnits < ActiveRecord::Migration[5.2]
  def change
    create_table :course_units do |t|
      t.references :course, foreign_key: true
      t.references :unit, foreign_key: true
      t.string :optional, null: true

      t.timestamps
    end
    add_index :course_units, [:course_id, :unit_id], unique: true
  end
end
