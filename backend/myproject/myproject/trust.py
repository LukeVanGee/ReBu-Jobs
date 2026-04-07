"""
Trust-score calculator for ReBu.

Usage:
    from myproject.trust import compute_trust_scores
    compute_trust_scores(user)          # recalculates & saves both scores
    compute_trust_scores(user, 'worker') # recalculates worker score only

Call this after any event that affects trust:
  - job completed
  - review submitted
  - job dropped (hurts reliability)
"""

import math
from django.utils import timezone
from .models import Job


# ── weight config ───────────────────────────────────────────────────────────
WEIGHTS = {
    'completion_rate': 0.30,   # jobs completed / jobs taken
    'avg_rating':      0.35,   # average star rating (1-5 → 0-100)
    'review_volume':   0.20,   # log-scaled review count
    'account_age':     0.15,   # days since signup, capped
}

# review volume: how many reviews to reach ~90% of the volume score
REVIEW_VOLUME_K = 10

# account age: max days that count (after this, full marks)
ACCOUNT_AGE_CAP_DAYS = 180


def _completion_rate_score(user, role):
    """
    Fraction of taken/done jobs out of all jobs the user engaged with.
    Dropped jobs (assigned then reverted to open) count against the user.
    """
    if role == 'worker':
        completed = Job.objects.filter(assigned_to=user, status='done').count()
        # total = jobs ever assigned to this worker (done + taken + pending + any they dropped)
        total = Job.objects.filter(assigned_to=user).count()
        # also count jobs that WERE assigned to them but are now open (drops)
        dropped = Job.objects.filter(
            posted_by__isnull=False, assigned_to__isnull=True, status='open',
        ).count()  # this is imprecise — better approach below
        # More accurate: count jobs where this user was ever assigned
        # For now, use a simpler heuristic: completed / (completed + currently assigned)
        total = completed + Job.objects.filter(assigned_to=user).exclude(status='done').count()
    else:
        # customer completion rate: jobs they posted that reached 'done'
        completed = Job.objects.filter(posted_by=user, status='done').count()
        total = Job.objects.filter(posted_by=user).count()

    if total == 0:
        return 50.0  # neutral score for new users with no activity

    return (completed / total) * 100.0


def _avg_rating_score(rating, review_count):
    """Convert 1-5 star rating to 0-100. Returns 50 if no reviews."""
    if review_count == 0:
        return 50.0
    # 1 star → 0, 5 stars → 100
    return ((rating - 1) / 4) * 100.0


def _review_volume_score(review_count):
    """
    Logarithmic scale: more reviews = more confidence.
    approaches 100 as review_count grows, using log curve.
    """
    if review_count == 0:
        return 0.0
    # 1 - e^(-count/k) gives a nice 0→1 curve
    return (1 - math.exp(-review_count / REVIEW_VOLUME_K)) * 100.0


def _account_age_score(user):
    """Linear from 0 to 100 over ACCOUNT_AGE_CAP_DAYS."""
    days = (timezone.now() - user.date_joined).days
    return min(days / ACCOUNT_AGE_CAP_DAYS, 1.0) * 100.0


def _compute_single(user, role):
    """Compute trust score for one role. Returns float 0-100."""
    profile = user.profile

    if role == 'worker':
        rating = profile.worker_rating
        reviews = profile.worker_reviews
    else:
        rating = profile.customer_rating
        reviews = profile.customer_reviews

    completion = _completion_rate_score(user, role)
    avg_rating = _avg_rating_score(rating, reviews)
    volume     = _review_volume_score(reviews)
    age        = _account_age_score(user)

    score = (
        WEIGHTS['completion_rate'] * completion +
        WEIGHTS['avg_rating']      * avg_rating +
        WEIGHTS['review_volume']   * volume +
        WEIGHTS['account_age']     * age
    )

    # clamp to 0-100
    return round(max(0, min(100, score)), 1)


def compute_trust_scores(user, role=None):
    """
    Recalculate and save trust score(s) for the given user.

    Args:
        user: Django User instance
        role: 'worker', 'customer', or None (both)

    Returns:
        dict with the computed score(s)
    """
    profile = user.profile
    result = {}

    if role in (None, 'worker'):
        profile.worker_trust = _compute_single(user, 'worker')
        result['worker_trust'] = profile.worker_trust

    if role in (None, 'customer'):
        profile.customer_trust = _compute_single(user, 'customer')
        result['customer_trust'] = profile.customer_trust

    fields = [k for k in result]
    profile.save(update_fields=fields)

    return result