from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Conversation, Message
from .models import Job


@api_view(['POST'])
def signup(request):
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name')
    role = request.data.get('role')

    if User.objects.filter(username=email).exists():
        return Response({'error': 'Email already registered'}, status=400)

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    user.profile.role = role
    user.profile.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'id': user.id,
        'token': str(refresh.access_token),
        'name': name,
        'role': role,
        'rating': 0,
        'reviewCount': 0,
        'stats': {'jobsPosted': 0, 'avgPay': 'N/A', 'avgDuration': 'N/A'} if role == 'customer'
                 else {'jobsDone': 0, 'qualityRating': 'N/A', 'avgPayReceived': 'N/A'}
    }, status=201)


@api_view(['POST'])
def login(request):
    from django.contrib.auth import authenticate
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(username=email, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'id': user.id,
            'token': str(refresh.access_token),
            'name': user.first_name,
            'role': user.profile.role,
            'rating': user.profile.rating,
            'reviewCount': user.profile.review_count,
            'stats': {'jobsPosted': 0, 'avgPay': 'N/A', 'avgDuration': 'N/A'} if user.profile.role == 'customer'
                     else {'jobsDone': 0, 'qualityRating': 'N/A', 'avgPayReceived': 'N/A'}
        })
    return Response({'error': 'Invalid credentials'}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_job(request):
    try:
        job = Job.objects.create(
            posted_by=request.user,
            title=request.data.get('title'),
            description=request.data.get('description'),
            category=request.data.get('category'),
            rate=request.data.get('rate'),
            location=request.data.get('location'),
            date_needed=request.data.get('date_needed'),
        )
        return Response({'id': job.id, 'message': 'Job created successfully'}, status=201)
    except Exception as ex:
        return Response({'error': str(ex)}, status=400)


# GET /api/jobs/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_jobs(request):
    jobs = Job.objects.select_related('posted_by').order_by('-created_at')
    data = [
        {
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
        for job in jobs
    ]
    return Response(data)


# POST /api/jobs/<id>/accept/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_job(request, job_id):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'worker':
        return Response({'error': 'Only workers can accept jobs.'}, status=403)

    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=404)

    if job.status != 'open':
        return Response({'error': 'This job has already been taken.'}, status=400)

    if job.posted_by == request.user:
        return Response({'error': 'You cannot accept your own job.'}, status=400)

    job.assigned_to = request.user
    job.status = 'taken'
    job.save()

    return Response({'success': True, 'job_id': job.id})
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def complete_job(request, job_id):
    job = Job.objects.get(id=job_id, assigned_to=request.user)
    job.status = 'done'   # also add 'done' to STATUS_CHOICES in models.py
    job.save()
    return Response({'success': True})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def drop_job(request, job_id):
    job = Job.objects.get(id=job_id, assigned_to=request.user)
    job.assigned_to = None
    job.status = 'open'
    job.save()
    return Response({'success': True})

# GET /api/jobs/mine/ — optional optimization to avoid client-side filtering
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_jobs(request):
    jobs = Job.objects.filter(assigned_to=request.user).select_related('posted_by')
    # serialize same shape as list_jobs
    ...

# ──────────────────────────────────────────────
# Add these views to the BOTTOM of myproject/views.py
# Make sure these imports are at the top of the file
# (skip any you already have):
#
#   from django.db.models import Q
#   from .models import Conversation, Message
# ──────────────────────────────────────────────


# GET /api/conversations/
# Returns all conversations for the logged-in user, sorted by most recent message
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    convos = Conversation.objects.filter(
        Q(user_one=request.user) | Q(user_two=request.user)
    ).select_related('user_one', 'user_two')

    data = []
    for c in convos:
        # figure out who the "other" person is
        other = c.user_two if c.user_one == request.user else c.user_one
        # grab the last message for preview text
        last_msg = c.messages.order_by('-created_at').first()
        data.append({
            'id':               c.id,
            'other_user_id':    other.id,
            'other_user_name':  other.first_name or other.username,
            'last_message':     last_msg.text if last_msg else '',
            'last_message_at':  str(last_msg.created_at) if last_msg else str(c.created_at),
            'updated_at':       str(c.updated_at),
        })
    return Response(data)


# POST /api/conversations/start/
# Body: { "user_id": <int> }
# Gets or creates a conversation with the given user. Returns the conversation id.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    other_id = request.data.get('user_id')
    if not other_id:
        return Response({'error': 'user_id is required'}, status=400)

    try:
        other_user = User.objects.get(id=other_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if other_user == request.user:
        return Response({'error': 'Cannot message yourself'}, status=400)

    # always store the lower id as user_one for consistent uniqueness
    u1, u2 = (request.user, other_user) if request.user.id < other_user.id else (other_user, request.user)

    convo, created = Conversation.objects.get_or_create(user_one=u1, user_two=u2)
    return Response({
        'id':              convo.id,
        'other_user_id':   other_user.id,
        'other_user_name': other_user.first_name or other_user.username,
        'created':         created,
    }, status=201 if created else 200)


# GET  /api/conversations/<id>/messages/         — fetch messages
# POST /api/conversations/<id>/messages/         — send a message
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, convo_id):
    try:
        convo = Conversation.objects.get(
            Q(id=convo_id),
            Q(user_one=request.user) | Q(user_two=request.user)
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=404)

    # ── GET: return all messages ──
    if request.method == 'GET':
        msgs = convo.messages.select_related('sender').all()
        data = [
            {
                'id':         m.id,
                'sender_id':  m.sender_id,
                'sender_name': m.sender.first_name or m.sender.username,
                'text':       m.text,
                'created_at': str(m.created_at),
            }
            for m in msgs
        ]
        return Response(data)

    # ── POST: send a new message ──
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Message text is required'}, status=400)

    msg = Message.objects.create(conversation=convo, sender=request.user, text=text)

    # bump the conversation's updated_at
    convo.save()  # auto_now on updated_at handles this

    return Response({
        'id':         msg.id,
        'sender_id':  msg.sender_id,
        'sender_name': msg.sender.first_name or msg.sender.username,
        'text':       msg.text,
        'created_at': str(msg.created_at),
    }, status=201)
