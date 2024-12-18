from users.models import CustomUser as User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny

# Create your views here.

MAX_SESSIONS = 5

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Signup API
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name=request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not name or not password:
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(email=email, password=password, name=name)
            user.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Login API
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(email=email, password=password)
        if user is not None:
            if user.is_active:
                tokens = get_tokens_for_user(user)
                if(len(user.tokens) > MAX_SESSIONS):
                    user.tokens.pop(0)
                user.tokens.append(tokens)
                User.objects.update(tokens=user.tokens)
                return Response(tokens,status=status.HTTP_200_OK)
            else:
                return Response({"error": "User account is disabled."}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
        
class LogoutView(APIView):
    def get(self, request):
        request.user.auth_token.delete()
        return Response({"message": "User logged out successfully."}, status=status.HTTP_200_OK)
        

