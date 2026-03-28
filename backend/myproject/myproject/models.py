from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
#Imports Woo

#Profile Class that is attached to any account, it containss th users role (customer or worker)
#As well as their rating average and number of reviews


class Profile(models.Model):
    ROLE_CHOICES = [('customer', 'Customer'), ('worker', 'Worker')]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    rating = models.FloatField(default=0)
    review_count = models.IntegerField(default=0)

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

class Job(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('taken', 'Taken')]  # renamed 'closed' → 'taken'
    posted_by    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    assigned_to  = models.ForeignKey(User, on_delete=models.SET_NULL,   # ← NEW
                                     null=True, blank=True,
                                     related_name='accepted_jobs')
    title        = models.CharField(max_length=200)
    description  = models.TextField()
    category     = models.CharField(max_length=100)
    rate         = models.FloatField()
    location     = models.CharField(max_length=200)
    date_needed  = models.DateField()
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    created_at   = models.DateTimeField(auto_now_add=True)

# ──────────────────────────────────────────────
# Add these two classes to the BOTTOM of myproject/models.py
# (below your existing Profile and Job models)
# ──────────────────────────────────────────────

class Conversation(models.Model):
    """One conversation thread between two users. Always exactly 2 participants."""
    user_one    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_one')
    user_two    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='convos_as_two')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)  # bumped on every new message

    class Meta:
        # prevent duplicate threads between the same pair
        constraints = [
            models.UniqueConstraint(fields=['user_one', 'user_two'], name='unique_conversation')
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation({self.user_one} <-> {self.user_two})"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text         = models.TextField()
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']  # oldest first — natural chat order

    def __str__(self):
        return f"Message from {self.sender} at {self.created_at}"