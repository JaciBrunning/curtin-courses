class Unit < ApplicationRecord
  has_many :course_units
  has_many :courses, through: :course_units

  has_many :unit_availabilities

  scope :search, -> (name) { 
    where("lower(code) like ?", "%#{name.downcase}%")
    .or(where("lower(name) like ?", "%#{name.downcase}%"))
    .or(where(abbrev: name.upcase))
  }
end
