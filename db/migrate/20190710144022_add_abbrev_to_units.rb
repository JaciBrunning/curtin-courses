class AddAbbrevToUnits < ActiveRecord::Migration[5.2]
  def change
    add_column :units, :abbrev, :string, null: true
  end
end
