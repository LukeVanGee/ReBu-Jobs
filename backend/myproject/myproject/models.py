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
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

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
