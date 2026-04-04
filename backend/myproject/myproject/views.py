from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Conversation, Job, Message


# ══════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════

@api_view(['POST'])
def signup(request):
    email    = request.data.get('email')
    password = request.data.get('password')
    name     = request.data.get('name')
    role     = request.data.get('role')

    if User.objects.filter(username=email).exists():
        return Response({'error': 'Email already registered'}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    user.profile.role = role
    user.profile.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'id':    user.id,
        'token': str(refresh.access_token),
        'name':  name,
        'role':  role,
        'rating': 0, 'reviewCount': 0,
        'stats': _default_stats(role),
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


# ── POST /api/jobs/<id>/request/ ─────────────────────────────────
# Worker requests a job → locks it to 'pending', opens a conversation,
# and drops a job_request message into the customer's inbox.
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

    # Lock the job
    job.assigned_to = request.user
    job.status      = 'pending'
    job.save()

    # Always store lower-id user as user_one for consistency
    u1, u2 = (
        (job.posted_by, request.user)
        if job.posted_by.id < request.user.id
        else (request.user, job.posted_by)
    )
    convo, _ = Conversation.objects.get_or_create(
        user_one=u1, user_two=u2, job=job
    )

    worker_name = request.user.first_name or request.user.username
    Message.objects.create(
        conversation = convo,
        sender       = request.user,
        msg_type     = 'job_request',
        text         = (
            f"{worker_name} has requested to take your job: \"{job.title}\". "
            f"Accept or decline below."
        ),
    )
    convo.save()  # bumps updated_at → floats to top of sidebar

    return Response({'status': 'pending', 'conversation_id': convo.id})


# ── POST /api/jobs/<id>/approve/ ─────────────────────────────────
# Customer approves the pending worker → job becomes 'taken'.
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

    # Post a confirmation message back into the same conversation
    convo = Conversation.objects.filter(job=job).first()
    if convo:
        Message.objects.create(
            conversation = convo,
            sender       = request.user,
            msg_type     = 'job_accepted',
            text         = (
                f"Great news! {request.user.first_name or request.user.username} "
                f"accepted your request for \"{job.title}\". The job is now yours."
            ),
        )
        convo.save()

    return Response({'status': 'taken', 'job_id': job.id})


# ── POST /api/jobs/<id>/decline/ ─────────────────────────────────
# Customer declines → job reverts to 'open', worker is notified.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_job(request, job_id):
    try:
        job = Job.objects.select_related('assigned_to').get(id=job_id, posted_by=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found or not yours.'}, status=404)

    if job.status != 'pending':
        return Response({'error': 'Job is not awaiting approval.'}, status=400)

    # Post the decline message before clearing assigned_to
    convo = Conversation.objects.filter(job=job).first()
    if convo:
        Message.objects.create(
            conversation = convo,
            sender       = request.user,
            msg_type     = 'job_declined',
            text         = (
                f"Sorry, {request.user.first_name or request.user.username} "
                f"has declined your request for \"{job.title}\". "
                f"The job is back on the board."
            ),
        )
        convo.save()

    # Reopen the job
    job.assigned_to = None
    job.status      = 'open'
    job.save()

    return Response({'status': 'open', 'job_id': job.id})


# ── PATCH /api/jobs/<id>/complete/ ───────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_job(request, job_id):
    try:
        job = Job.objects.select_related('posted_by').get(id=job_id, assigned_to=request.user)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=404)
    job.status = 'done'
    job.save()

    # Notify the customer via the job's conversation
    convo = Conversation.objects.filter(job=job).first()
    if convo:
        worker_name = request.user.first_name or request.user.username
        Message.objects.create(
            conversation=convo,
            sender=request.user,
            msg_type='job_completed',
            text=(
                f"{worker_name} has marked \"{job.title}\" as complete. "
                f"Please review the work and leave a rating."
            ),
        )
        convo.save()  # bumps updated_at → floats to top of sidebar

    return Response({'success': True})


# ── PATCH /api/jobs/<id>/drop/ ───────────────────────────────────
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


# GET /api/conversations/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    convos = Conversation.objects.filter(
        Q(user_one=request.user) | Q(user_two=request.user)
    ).select_related('user_one', 'user_two', 'job').order_by('-updated_at')
    return Response([_serialize_convo(c, request.user) for c in convos])


# POST /api/conversations/start/   body: { user_id }
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


# GET / POST /api/conversations/<id>/messages/
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
