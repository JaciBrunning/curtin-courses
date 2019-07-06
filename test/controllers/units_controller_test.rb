require 'test_helper'

class UnitsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get units_index_url
    assert_response :success
  end

end
