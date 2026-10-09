from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminOrBranchManager
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "phone", "email"]

    def get_queryset(self):
        user = self.request.user

        queryset = (
            Customer.objects
            .select_related("branch")
            .order_by("-created_at")
        )

        if user.role == "ADMIN":
            return queryset

        if user.branch_id:
            return queryset.filter(
                branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):
        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [IsAdminOrBranchManager()]

        return [IsAuthenticated()]