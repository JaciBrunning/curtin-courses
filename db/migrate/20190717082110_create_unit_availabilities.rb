class CreateUnitAvailabilities < ActiveRecord::Migration[5.2]
  def change
    create_table :unit_availabilities do |t|
      t.references :unit, foreign_key: true
      t.string :year
      t.string :period
      t.string :location

      t.timestamps
    end
    add_index :unit_availabilities, [:unit_id, :year, :period, :location], unique: true, name: 'unit_avails_idx'
  end
end
