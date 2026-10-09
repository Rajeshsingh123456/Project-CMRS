from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import BankDeposit
from reconciliation.models import Reconciliation


class BankDepositSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    bank_reference = serializers.CharField(
        required=True
    )

    class Meta:
        model = BankDeposit
        fields = [
            "id",
            "branch",
            "branch_name",
            "reconciliation",
            "bank_name",
            "deposit_amount",
            "deposit_date",
            "bank_reference",
            "status",
            "remarks",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "branch",
            "branch_name",
            "status",
            "created_at",
        ]

    def validate(self, attrs):
        user = self.context["request"].user
        reconciliation = attrs["reconciliation"]
        deposit_amount = attrs["deposit_amount"]

        if user.role not in [
            "ADMIN",
            "BRANCH_MANAGER",
        ]:
            raise serializers.ValidationError(
                "Only Admin or Branch Manager can create bank deposits."
            )

        if (
            user.role == "BRANCH_MANAGER"
            and user.branch_id != reconciliation.cash_submission.branch_id
        ):
            raise serializers.ValidationError(
                "You can only deposit cash from your branch."
            )

        if reconciliation.status not in [
            Reconciliation.Status.APPROVED,
            Reconciliation.Status.DISCREPANCY,
        ]:
            raise serializers.ValidationError(
                "Only approved or discrepancy reconciliations can be deposited."
            )

        if reconciliation.bank_deposits.exists():
            raise serializers.ValidationError(
                "A bank deposit already exists for this reconciliation."
            )

        if deposit_amount <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Deposit amount must be greater than zero."
            )

        if deposit_amount != reconciliation.received_amount:
            raise serializers.ValidationError(
                "Deposit amount must match the reconciled received amount."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        reconciliation = (
            Reconciliation.objects
            .select_for_update()
            .select_related("cash_submission")
            .get(
                pk=validated_data["reconciliation"].pk
            )
        )

        if reconciliation.status not in [
            Reconciliation.Status.APPROVED,
            Reconciliation.Status.DISCREPANCY,
        ]:
            raise serializers.ValidationError(
                "Only approved or discrepancy reconciliations can be deposited."
            )

        if reconciliation.bank_deposits.exists():
            raise serializers.ValidationError(
                "A bank deposit already exists for this reconciliation."
            )

        if (
            validated_data["deposit_amount"]
            != reconciliation.received_amount
        ):
            raise serializers.ValidationError(
                "Deposit amount must match the reconciled received amount."
            )

        if reconciliation.status == Reconciliation.Status.APPROVED:
            deposit_status = BankDeposit.Status.DEPOSITED
        else:
            deposit_status = BankDeposit.Status.MISMATCH

        deposit = BankDeposit.objects.create(
            branch_id=reconciliation.cash_submission.branch_id,
            reconciliation=reconciliation,
            bank_name=validated_data["bank_name"],
            deposit_amount=validated_data["deposit_amount"],
            deposit_date=validated_data["deposit_date"],
            bank_reference=validated_data["bank_reference"],
            status=deposit_status,
            remarks=validated_data.get(
                "remarks",
                ""
            ),
        )

        return deposit