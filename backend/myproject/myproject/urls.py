from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/',         views.login),
    path('api/auth/signup/',        views.signup),         # Step 1: send code
    path('api/auth/verify-signup/', views.verify_signup),  # Step 2: confirm code

    # Jobs
    path('api/jobs/',                        views.list_jobs),
    path('api/jobs/create/',                 views.create_job),
    path('api/jobs/mine/',                   views.my_jobs),
    path('api/jobs/<int:job_id>/request/',   views.request_job),
    path('api/jobs/<int:job_id>/approve/',   views.approve_job),
    path('api/jobs/<int:job_id>/decline/',   views.decline_job),
    path('api/jobs/<int:job_id>/complete/',  views.complete_job),
    path('api/jobs/<int:job_id>/drop/',      views.drop_job),

    # Messaging
    path('api/conversations/',                          views.list_conversations),
    path('api/conversations/start/',                    views.start_conversation),
    path('api/conversations/<int:convo_id>/messages/',  views.conversation_messages),
]
