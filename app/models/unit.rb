class Unit < ApplicationRecord
  has_many :course_units
  has_many :courses, through: :course_units

  scope :search, -> (name) { where("lower(code) like ?", "%#{name.downcase}%").or(where("lower(name) like ?", "%#{name.downcase}%")) }
end
