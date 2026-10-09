from rest_framework import filters, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsAdminOrBranchManager
from .models import Loan, RepaymentSchedule
from .serializers import (
    LoanSerializer,
    RepaymentScheduleSerializer,
)


class LoanViewSet(viewsets.ModelViewSet):

    serializer_class = LoanSerializer

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "loan_number",
        "customer__name",
        "customer__phone",
    ]

    ordering_fields = [
        "created_at",
        "loan_number",
        "outstanding_amount",
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = Loan.objects.select_related(
            "customer",
            "customer__branch",
        ).order_by("-created_at")

        if user.role == "ADMIN":
            return queryset

        if user.branch_id:
            return queryset.filter(
                customer__branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [
                IsAdminOrBranchManager()
            ]

        return [
            IsAuthenticated()
        ]


class RepaymentScheduleViewSet(viewsets.ModelViewSet):

    serializer_class = RepaymentScheduleSerializer

    filter_backends = [
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "due_date",
        "installment_number",
        "expected_amount",
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = RepaymentSchedule.objects.select_related(
            "loan",
            "loan__customer",
        ).order_by(
            "loan",
            "installment_number",
        )

        if user.role == "ADMIN":
            return queryset

        if user.branch_id:
            return queryset.filter(
                loan__customer__branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):

        if self.action in [
            "create",
            "update",
            "partial_update",
            "destroy",
        ]:
            return [
                IsAdminOrBranchManager()
            ]

        return [
            IsAuthenticated()
        ]