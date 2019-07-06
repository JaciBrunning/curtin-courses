module ApplicationHelper
  def serialize relation, options={}
    ActiveModelSerializers::SerializableResource.new(relation, options)
  end
end
