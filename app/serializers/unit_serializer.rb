class UnitSerializer < ActiveModel::Serializer
  type :unit
  attributes :code, :name, :url, :credits
  attribute :prereqs, unless: :brief? do
    JSON.parse object.prereqs
  end

  has_many :courses, if: :show_courses?

  def show_courses?
    @instance_options[:courses]
  end

  def brief?
    @instance_options[:brief]
  end
end
