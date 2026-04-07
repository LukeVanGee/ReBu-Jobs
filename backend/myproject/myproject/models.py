from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
import datetime


class Profile(models.Model):
    user              = models.OneToOneField(User, on_delete=models.CASCADE)
    # Customer-side rating (received as a job poster)
    customer_rating   = models.FloatField(default=0)
    customer_reviews  = models.IntegerField(default=0)
    # Worker-side rating (received as a job doer)
    worker_rating     = models.FloatField(default=0)
    worker_reviews    = models.IntegerField(default=0)
    # Trust scores (0–100, recalculated by compute_trust_scores())
    customer_trust = models.FloatField(default=0)
    worker_trust   = models.FloatField(default=0)

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


class PendingSignup(models.Model):
    """
    Temporarily holds signup data while the user verifies their email.
    Expires after 15 minutes. Cleaned up on successful verification or expiry.
    """
    email      = models.EmailField(unique=True)
    password   = models.CharField(max_length=128)
    name       = models.CharField(max_length=150)
    code       = models.CharField(max_length=6)
    attempts   = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + datetime.timedelta(minutes=15)

    def __str__(self):
        return f"PendingSignup({self.email})"


class Job(models.Model):
    STATUS_CHOICES = [
        ('open',    'Open'),
        ('pending', 'Pending Approval'),
        ('taken',   'Taken'),
        ('done',    'Done'),
    ]
    posted_by   = models.ForeignKey(User, on_delete=models.CASCADE,  related_name='posted_jobs')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='assigned_jobs', null=True, blank=True)
    title       = models.CharField(max_length=200)
    description = models.TextField()
    category    = models.CharField(max_length=100)
    rate        = models.FloatField()
    location    = models.CharField(max_length=200)
    date_needed = models.DateField()
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at  = models.DateTimeField(auto_now_add=True)


class Conversation(models.Model):
    user_one    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_one')
    user_two    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_two')
    job         = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user_one', 'user_two', 'job'], name='unique_conversation_per_job')
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation({self.user_one} <-> {self.user_two}, job={self.job_id})"


class Message(models.Model):
    MSG_TYPE_CHOICES = [
        ('text',         'Text'),
        ('job_request',  'Job Request'),
        ('job_accepted', 'Job Accepted'),
        ('job_declined',   'Job Declined'),
        ('job_completed',  'Job Completed'),
    ]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text         = models.TextField()
    msg_type     = models.CharField(max_length=20, choices=MSG_TYPE_CHOICES, default='text')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message({self.msg_type}) from {self.sender} at {self.created_at}"
