from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
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
