class CreateCourses < ActiveRecord::Migration[5.2]
  def change
    create_table :courses do |t|
      t.string :code
      t.string :name
      t.string :url

      t.timestamps
    end
    add_index :courses, :code, unique: true
    add_reference :courses, :stream_parent, index: true, null: true
  end
end
