class CourseSerializer < ActiveModel::Serializer
  type :course
  attributes :code, :name, :url

  has_many :course_units, if: :show_units?
  has_one :stream_parent, key: :stream_of, if: :show_stream_parent?
  has_many :streams, if: :show_stream_children?

  def show_stream_parent?
    object.stream_parent_id
  end

  def show_stream_children?
    @instance_options[:streams]
  end

  def show_units?
    @instance_options[:units]
  end
end
