class Course < ApplicationRecord
  has_many :streams, class_name: "Course", foreign_key: :stream_parent
  belongs_to :stream_parent, class_name: "Course", optional: true

  has_many :course_units
  has_many :units, through: :course_units
end
