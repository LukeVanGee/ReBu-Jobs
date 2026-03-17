from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login),
    path('auth/signup/', views.signup),
    path('jobs/create/', views.create_job),
    path('jobs/',                views.list_jobs),        # ← NEW
    path('jobs/<int:job_id>/accept/', views.accept_job), # ← NEW
]
