class CourseUnitSerializer < ActiveModel::Serializer
  type :course_unit
  attribute :optional, if: -> { object.optional }
  attribute :planned_period, if: -> { object.planned_period }
  attribute :planned_level, if: -> { object.planned_level > 0 }

  has_one :unit
end