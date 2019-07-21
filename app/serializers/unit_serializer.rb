class UnitSerializer < ActiveModel::Serializer
  type :unit
  attributes :code, :credits
  attribute :name, unless: :freeform?
  attribute :url, unless: :freeform?
  attribute :abbrev, if: -> { object.abbrev }
  attribute :prereqs, if: :show_prereqs? do
    JSON.parse object.prereqs
  end
  attribute :error, if: :has_error?

  attribute :freeform, if: :freeform? do
    object.freeform_period ? :optional : :elective
  end
  attribute :freeform_period, if: -> { freeform? && object.freeform_period }

  has_many :courses, if: :show_courses?
  has_many :unit_availabilities, unless: :brief?

  def freeform?
    object.freeform
  end

  def show_prereqs?
    !brief? && !freeform?
  end

  def show_courses?
    @instance_options[:courses]
  end

  def brief?
    @instance_options[:brief]
  end

  def has_error?
    !object.error.nil?
  end
end
