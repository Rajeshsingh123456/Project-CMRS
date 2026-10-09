from rest_framework import filters, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdminOrBranchManager
from .models import BankDeposit
from .serializers import BankDepositSerializer


class BankDepositViewSet(viewsets.ModelViewSet):

    serializer_class = BankDepositSerializer

    filter_backends = [
        filters.SearchFilter,
    ]

    search_fields = [
        "bank_reference",
        "bank_name",
        "branch__name",
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = (
            BankDeposit.objects
            .select_related(
                "branch",
                "reconciliation",
                "reconciliation__cash_submission",
            )
            .order_by("-created_at")
        )

        if user.role == "ADMIN":
            return queryset

        if user.role == "BRANCH_MANAGER":
            return queryset.filter(
                branch_id=user.branch_id
            )

        return queryset.none()

    def get_permissions(self):
        return [
            IsAdminOrBranchManager()
        ]

    def perform_update(self, serializer):
        raise serializers.ValidationError(
            "Bank deposits cannot be modified after creation."
        )

    def perform_destroy(self, instance):
        raise serializers.ValidationError(
            "Bank deposits cannot be deleted."
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="settle"
    )
    def settle(self, request, pk=None):

        deposit = self.get_object()

        if deposit.status not in [
            BankDeposit.Status.DEPOSITED,
            BankDeposit.Status.MISMATCH,
        ]:
            return Response(
                {
                    "detail": (
                        "Only deposited or mismatch bank "
                        "transactions can be settled."
                    )
                },
                status=400,
            )

        deposit.status = BankDeposit.Status.SETTLED

        deposit.save(
            update_fields=["status"]
        )

        return Response(
            {
                "message": "Bank deposit settled successfully.",
                "bank_reference": deposit.bank_reference,
                "status": deposit.status,
            }
        )