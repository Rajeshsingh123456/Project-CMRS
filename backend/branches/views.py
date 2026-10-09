from rest_framework import viewsets

from accounts.permissions import IsAdmin
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all().order_by("name")
    serializer_class = BranchSerializer
    permission_classes = [IsAdmin]