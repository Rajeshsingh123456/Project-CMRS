
from rest_framework import filters, serializers, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminOrBranchManager
from .models import CashSubmission, Reconciliation
from .serializers import (
    CashSubmissionSerializer,
    ReconciliationSerializer,
)


class CashSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = CashSubmissionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "submission_number",
        "agent__username",
        "branch__name",
        "branch__code",
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = CashSubmission.objects.select_related(
            "agent",
            "branch",
        ).order_by("-created_at")

        if user.role == "ADMIN":
            return queryset

        if user.role == "AGENT":
            return queryset.filter(agent=user)

        if user.role == "BRANCH_MANAGER":
            return queryset.filter(branch_id=user.branch_id)

        return queryset.none()

    def get_permissions(self):
        if self.action in ["list", "retrieve", "create"]:
            return [IsAuthenticated()]

        return [IsAdminOrBranchManager()]

    def perform_destroy(self, instance):
        raise serializers.ValidationError(
            "Cash submissions cannot be deleted."
        )


class ReconciliationViewSet(viewsets.ModelViewSet):
    serializer_class = ReconciliationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "cash_submission__submission_number",
        "cash_submission__agent__username",
        "cash_submission__branch__name",
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = Reconciliation.objects.select_related(
            "cash_submission",
            "cash_submission__agent",
            "cash_submission__branch",
            "reconciled_by",
        ).order_by("-reconciled_at")

        if user.role == "ADMIN":
            return queryset

        if user.role == "BRANCH_MANAGER":
            return queryset.filter(
                cash_submission__branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):
        return [IsAdminOrBranchManager()]

    def perform_update(self, serializer):
        raise serializers.ValidationError(
            "Reconciliations cannot be modified after creation."
        )

    def perform_destroy(self, instance):
        raise serializers.ValidationError(
            "Reconciliations cannot be deleted."
        )
