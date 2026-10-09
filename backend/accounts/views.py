from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

from .models import User
from .permissions import IsAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "branch_id": user.branch_id,
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related(
        "branch"
    ).all().order_by("username")

    serializer_class = UserSerializer
    permission_classes = [IsAdmin]