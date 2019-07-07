class Unit < ActiveRecord::Migration[5.2]
  def change
    add_column :units, :error, :string, null: true
  end
end
