from rest_framework import filters, serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CashCollection
from .serializers import CashCollectionSerializer


class CashCollectionViewSet(viewsets.ModelViewSet):

    serializer_class = CashCollectionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "receipt_number",
        "customer__name",
        "customer__phone",
        "loan__loan_number",
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = CashCollection.objects.select_related(
            "customer",
            "loan",
            "installment",
            "agent",
        ).order_by("-created_at")

        if user.role == "ADMIN":
            return queryset

        if user.role == "AGENT":
            return queryset.filter(
                agent=user
            )

        if user.branch_id:
            return queryset.filter(
                customer__branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        raise serializers.ValidationError(
            "Cash collections cannot be modified after creation."
        )

    def perform_destroy(self, instance):
        raise serializers.ValidationError(
            "Cash collections cannot be deleted."
        )