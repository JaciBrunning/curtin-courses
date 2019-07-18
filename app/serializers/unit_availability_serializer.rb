class UnitAvailabilitySerializer < ActiveModel::Serializer
  type :unit_availability
  attributes :year, :period, :location
end