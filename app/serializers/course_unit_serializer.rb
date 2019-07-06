class CourseUnitSerializer < ActiveModel::Serializer
  type :course_unit
  attribute :optional, if: -> { object.optional }

  has_one :unit
end