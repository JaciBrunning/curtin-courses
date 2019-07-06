require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq"

  root 'home#index'

  get 'course/:code', to: 'courses#show', as: 'course'
  get 'unit/:code', to: 'units#show', as: 'unit'

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
  end
end
