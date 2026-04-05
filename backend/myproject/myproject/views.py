from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Conversation, Job, Message, PendingSignup
import random
import string


# ══════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════

def _generate_code(length=6):
    return ''.join(random.choices(string.digits, k=length))


@api_view(['POST'])
def signup(request):
    """
    Step 1 — validate fields, store a PendingSignup, send the verification email.
    Does NOT create a User yet.
    """
    email    = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    name     = request.data.get('name', '').strip()
    role     = request.data.get('role', 'customer')

    # Basic validation
    if not all([email, password, name, role]):
        return Response({'error': 'All fields are required.'}, status=400)
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=400)
    if role not in ('customer', 'worker'):
        return Response({'error': 'Invalid role.'}, status=400)

    if User.objects.filter(username=email).exists():
        return Response({'error': 'Email already registered.'}, status=400)

    # Upsert PendingSignup so a retry gets a fresh code
    code = _generate_code()
    PendingSignup.objects.update_or_create(
        email=email,
        defaults={'password': password, 'name': name, 'role': role, 'code': code, 'attempts': 0},
    )

    send_mail(
        subject='Your Rebu verification code',
        message=(
            f"Hi {name},\n\n"
            f"Your Rebu sign-up verification code is:\n\n"
            f"    {code}\n\n"
            f"It expires in 15 minutes. If you didn't request this, you can ignore this email.\n\n"
            f"— The Rebu Team"
        ),
        from_email='no-reply@rebu.app',
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({'message': 'Verification code sent. Please check your email.'}, status=200)


@api_view(['POST'])
def verify_signup(request):
    """
    Step 2 — user submits the 6-digit code.
    On success: create the User, delete the PendingSignup, return a JWT.
    """
    email = request.data.get('email', '').strip().lower()
    code  = request.data.get('code', '').strip()

    if not email or not code:
        return Response({'error': 'Email and code are required.'}, status=400)

    try:
        pending = PendingSignup.objects.get(email=email)
    except PendingSignup.DoesNotExist:
        return Response({'error': 'No pending sign-up for this email.'}, status=404)

    if pending.is_expired():
        pending.delete()
        return Response({'error': 'Code has expired. Please sign up again.'}, status=400)

    MAX_ATTEMPTS = 5
    if pending.attempts >= MAX_ATTEMPTS:
        pending.delete()
        return Response({'error': 'Too many incorrect attempts. Please sign up again.'}, status=400)

    if pending.code != code:
        pending.attempts += 1
        pending.save(update_fields=['attempts'])
        remaining = MAX_ATTEMPTS - pending.attempts
        return Response({'error': f'Incorrect code. {remaining} attempt(s) remaining.'}, status=400)

    # Code is correct — create the real user
    if User.objects.filter(username=email).exists():
        pending.delete()
        return Response({'error': 'Email already registered.'}, status=400)

    user = User.objects.create_user(
        username=email, email=email,
        password=pending.password, first_name=pending.name,
    )
    user.profile.role = pending.role
    user.profile.save()
    pending.delete()

    refresh = RefreshToken.for_user(user)
    return Response({
        'id':    user.id,
        'token': str(refresh.access_token),
        'name':  pending.name,
        'role':  pending.role,
        'rating': 0, 'reviewCount': 0,
        'stats': _default_stats(pending.role),
    }, status=201)


@api_view(['POST'])
def login(request):
    from django.contrib.auth import authenticate
    user = authenticate(username=request.data.get('email'), password=request.data.get('password'))
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'id':    user.id,
            'token': str(refresh.access_token),
            'name':  user.first_name,
            'role':  user.profile.role,
            'rating': user.profile.rating,
            'reviewCount': user.profile.review_count,
            'stats': _default_stats(user.profile.role),
        })
    return Response({'error': 'Invalid credentials'}, status=400)


def _default_stats(role):
    if role == 'customer':
        return {'jobsPosted': 0, 'avgPay': 'N/A', 'avgDuration': 'N/A'}
    return {'jobsDone': 0, 'qualityRating': 'N/A', 'avgPayReceived': 'N/A'}


# ══════════════════════════════════════════════════════════════════
# JOBS
# ══════════════════════════════════════════════════════════════════

def _serialize_job(job):
    return {
        'id':             job.id,
        'title':          job.title,
        'description':    job.description,
        'category':       job.category,
        'rate':           job.rate,
        'location':       job.location,
        'date_needed':    str(job.date_needed),
        'status':         job.status,
        'posted_by_id':   job.posted_by_id,
        'posted_by_name': job.posted_by.first_name or job.posted_by.username,
        'assigned_to_id': job.assigned_to_id,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_jobs(request):
    jobs = Job.objects.select_related('posted_by').order_by('-created_at')
    return Response([_serialize_job(j) for j in jobs])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_job(request):
    try:
        job = Job.objects.create(
            posted_by   = request.user,
            title       = request.data.get('title'),
            description = request.data.get('description'),
            category    = request.data.get('category'),
            rate        = request.data.get('rate'),
            location    = request.data.get('location'),
            date_needed = request.data.get('date_needed'),
        )
        return Response({'id': job.id, 'message': 'Job created successfully'}, status=201)
    except Exception as ex:
        return Response({'error': str(ex)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_jobs(request):
    jobs = Job.objects.filter(assigned_to=request.user).select_related('posted_by')
    return Response([_serialize_job(j) for j in jobs])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_job(request, job_id):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'worker':
        return Response({'error': 'Only workers can request jobs.'}, status=403)

    try:
        job = Job.objects.select_related('posted_by').get(id=job_id)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=404)

    if job.status != 'open':
        return Response({'error': 'This job is no longer available.'}, status=400)
    if job.posted_by == request.user:
        return Response({'error': 'You cannot request your own job.'}, status=400)

    job.assigned_to = request.user
    job.status      = 'pending'
    job.save()

    u1, u2 = (
        (job.posted_by, request.user)
        if job.posted_by.id < request.user.id
        else (request.user, job.posted_by)
    )
    convo, _ = Conversation.objects.get_or_create(user_one=u1, user_two=u2, job=job)

    worker_name = request.user.first_name or request.user.username
    Message.objects.create(
        conversation=convo, sender=request.user, msg_type='job_request',
        text=f"{worker_name} has requested to take your job: \"{job.title}\". Accept or decline below.",
    )
    convo.save()
    return Response({'status': 'pending', 'conversation_id': convo.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_job(request, job_id):
    try:
        job = Job.objects.select_related('assigned_to').get(id=job_id, posted_by=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found or not yours.'}, status=404)

    if job.status != 'pending':
        return Response({'error': 'Job is not awaiting approval.'}, status=400)

    job.status = 'taken'
    job.save()

    convo = Conversation.objects.filter(job=job).first()
    if convo:
        Message.objects.create(
            conversation=convo, sender=request.user, msg_type='job_accepted',
            text=(f"Great news! {request.user.first_name or request.user.username} "
                  f"accepted your request for \"{job.title}\". The job is now yours."),
        )
        convo.save()
    return Response({'status': 'taken', 'job_id': job.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_job(request, job_id):
    try:
        job = Job.objects.select_related('assigned_to').get(id=job_id, posted_by=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found or not yours.'}, status=404)

    if job.status != 'pending':
        return Response({'error': 'Job is not awaiting approval.'}, status=400)

    convo = Conversation.objects.filter(job=job).first()
    if convo:
        Message.objects.create(
            conversation=convo, sender=request.user, msg_type='job_declined',
            text=(f"Sorry, {request.user.first_name or request.user.username} "
                  f"has declined your request for \"{job.title}\". The job is back on the board."),
        )
        convo.save()

    job.assigned_to = None
    job.status      = 'open'
    job.save()
    return Response({'status': 'open', 'job_id': job.id})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_job(request, job_id):
    try:
        job = Job.objects.select_related('posted_by').get(id=job_id, assigned_to=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=404)

    job.status = 'done'
    job.save()

    convo = Conversation.objects.filter(job=job).first()
    if convo:
        worker_name = request.user.first_name or request.user.username
        Message.objects.create(
            conversation=convo, sender=request.user, msg_type='job_completed',
            text=(f"{worker_name} has marked \"{job.title}\" as complete. "
                  f"Please review the work and leave a rating."),
        )
        convo.save()
    return Response({'success': True})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def drop_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id, assigned_to=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=404)
    job.assigned_to = None
    job.status      = 'open'
    job.save()
    return Response({'success': True})


# ══════════════════════════════════════════════════════════════════
# CONVERSATIONS & MESSAGES
# ══════════════════════════════════════════════════════════════════

def _serialize_convo(convo, requesting_user):
    other = convo.user_two if convo.user_one == requesting_user else convo.user_one
    last  = convo.messages.order_by('-created_at').first()
    return {
        'id':              convo.id,
        'other_user_id':   other.id,
        'other_user_name': other.first_name or other.username,
        'last_message':    last.text if last else '',
        'last_message_at': str(last.created_at) if last else str(convo.created_at),
        'updated_at':      str(convo.updated_at),
        'job_id':          convo.job_id,
        'job_title':       convo.job.title if convo.job else None,
    }


def _serialize_message(msg):
    return {
        'id':          msg.id,
        'sender_id':   msg.sender_id,
        'sender_name': msg.sender.first_name or msg.sender.username,
        'text':        msg.text,
        'msg_type':    msg.msg_type,
        'created_at':  str(msg.created_at),
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    convos = Conversation.objects.filter(
        Q(user_one=request.user) | Q(user_two=request.user)
    ).select_related('user_one', 'user_two', 'job').order_by('-updated_at')
    return Response([_serialize_convo(c, request.user) for c in convos])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    other_id = request.data.get('user_id')
    if not other_id:
        return Response({'error': 'user_id is required'}, status=400)
    try:
        other = User.objects.get(id=other_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    if other == request.user:
        return Response({'error': 'Cannot message yourself'}, status=400)

    u1, u2 = (request.user, other) if request.user.id < other.id else (other, request.user)
    convo, created = Conversation.objects.get_or_create(user_one=u1, user_two=u2, job=None)
    return Response({**_serialize_convo(convo, request.user), 'created': created},
                    status=201 if created else 200)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, convo_id):
    try:
        convo = Conversation.objects.get(
            Q(id=convo_id),
            Q(user_one=request.user) | Q(user_two=request.user),
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

    if request.method == 'GET':
        msgs = convo.messages.select_related('sender').all()
        return Response([_serialize_message(m) for m in msgs])

    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Message text is required'}, status=400)

    msg = Message.objects.create(conversation=convo, sender=request.user, text=text)
    convo.save()
    return Response(_serialize_message(msg), status=201)
