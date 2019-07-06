require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq"

  namespace 'api' do
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
