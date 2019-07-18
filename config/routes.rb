require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq"

  root 'home#index'
  get 'legend', to: 'home#legend'
  get 'info', to: 'home#info'

  get 'course/:code', to: 'courses#show', as: 'course'
  get 'unit/:code', to: 'units#show', as: 'unit'
  get 'unit/:code/courses', to: 'units#courses', as: 'unit_courses'

  namespace 'api' do
    get 'search', to: 'search#all'
    get 'search/units', to: 'search#units'
    get 'search/courses', to: 'search#courses'

    resources :courses, only: [:index, :show], param: :code do
      member do
        get :streams
      end
    end
    
    resources :units, only: [:index, :show], param: :code do
      member do
        get :courses
      end
    end

    get 'availability/unit/schema', to: 'units#availability_schema'
  end
end
