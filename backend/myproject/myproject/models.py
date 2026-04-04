from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    ROLE_CHOICES = [('customer', 'Customer'), ('worker', 'Worker')]
    user         = models.OneToOneField(User, on_delete=models.CASCADE)
    role         = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    rating       = models.FloatField(default=0)
    review_count = models.IntegerField(default=0)

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


class Job(models.Model):
    STATUS_CHOICES = [
        ('open',    'Open'),
        ('pending', 'Pending Approval'),  # worker requested, awaiting customer accept
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
    """
    One conversation thread between two users.
    job_request tracks which job triggered the conversation (nullable
    so general messages are still possible in the future).
    """
    user_one    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_one')
    user_two    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_two')
    # Soft link to the job that started this thread — null for non-job conversations
    job         = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        # A pair of users can only have one active conversation per job
        constraints = [
            models.UniqueConstraint(fields=['user_one', 'user_two', 'job'], name='unique_conversation_per_job')
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation({self.user_one} <-> {self.user_two}, job={self.job_id})"


class Message(models.Model):
    MSG_TYPE_CHOICES = [
        ('text',         'Text'),
        ('job_request',  'Job Request'),   # system card — worker requesting the job
        ('job_accepted', 'Job Accepted'),  # system card — customer approved
        ('job_declined',   'Job Declined'),   # system card — customer declined
        ('job_completed',  'Job Completed'),  # system card — worker marked done
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
