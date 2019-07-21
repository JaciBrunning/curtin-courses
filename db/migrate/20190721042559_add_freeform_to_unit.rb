class AddFreeformToUnit < ActiveRecord::Migration[5.2]
  def change
    add_column :units, :freeform, :boolean, default: false
    add_column :units, :freeform_period, :string, null: true
  end
end
