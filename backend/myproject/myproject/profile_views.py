from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
# Create your views here.
#Method runs when a user signs up for an account
@api_view(['POST'])
def signup(request):
    #Sets credentials to given variables from the signup request
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name')
    role = request.data.get('role')
    #Throws error if email already exists
    if User.objects.filter(username=email).exists():
         return Response({'error': 'Email already registered'}, status=400)
    
    #Make a User model that fills out Djangos default template, than matches it to a profile model that includes data unique to our app ReBu
    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    user.profile.role = role  # requires a Profile model (see below)
    user.profile.save()
    #Returns JWT tokens to React
    refresh = RefreshToken.for_user(user)
    return Response({'token': str(refresh.access_token), 'name': name, 'role': role}, status=201)

#Methon runs when a user attempts a log in
@api_view(['POST'])
def login(request):
    #Gets existing email and password and check them agains the login attempt
    from django.contrib.auth import authenticate
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(username=email, password=password)
    #If the login was sucessful, return the tokens to react
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'name': user.first_name,
            'role': user.profile.role,
            'rating': user.profile.rating,
        })
