from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/',  views.login),
    path('api/auth/signup/', views.signup),

    # Jobs
    path('api/jobs/',                       views.list_jobs),
    path('api/jobs/create/',                views.create_job),
    path('api/jobs/mine/',                  views.my_jobs),
    path('api/jobs/<int:job_id>/accept/',   views.accept_job),
    path('api/jobs/<int:job_id>/complete/', views.complete_job),
    path('api/jobs/<int:job_id>/drop/',     views.drop_job),

    # Messaging
    path('api/conversations/',                         views.list_conversations),
    path('api/conversations/start/',                   views.start_conversation),
    path('api/conversations/<int:convo_id>/messages/',  views.conversation_messages),
]