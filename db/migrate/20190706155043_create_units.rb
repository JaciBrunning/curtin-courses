class CreateUnits < ActiveRecord::Migration[5.2]
  def change
    create_table :units do |t|
      t.string :code
      t.string :name
      t.string :url
      t.string :prereqs
      t.float :credits

      t.timestamps
    end
    add_index :units, :code, unique: true
  end
end
