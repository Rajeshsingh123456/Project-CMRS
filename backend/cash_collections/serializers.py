
from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from rest_framework import serializers

from .models import CashCollection
from loans.models import Loan, RepaymentSchedule


class CashCollectionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True,
    )

    loan_number = serializers.CharField(
        source="loan.loan_number",
        read_only=True,
    )

    installment_number = serializers.IntegerField(
        source="installment.installment_number",
        read_only=True,
    )

    agent_username = serializers.CharField(
        source="agent.username",
        read_only=True,
    )

    class Meta:
        model = CashCollection
        fields = [
            "id",
            "receipt_number",
            "customer",
            "customer_name",
            "loan",
            "loan_number",
            "installment",
            "installment_number",
            "agent",
            "agent_username",
            "amount",
            "collection_date",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "receipt_number",
            "agent",
            "agent_username",
            "status",
            "created_at",
            "customer_name",
            "loan_number",
            "installment_number",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        customer = attrs["customer"]
        loan = attrs["loan"]
        installment = attrs["installment"]
        amount = attrs["amount"]

        if user.role != "AGENT":
            raise serializers.ValidationError(
                "Only collection agents can create cash collections."
            )

        if amount <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Collection amount must be greater than zero."
            )

        if loan.customer_id != customer.id:
            raise serializers.ValidationError(
                "Selected loan does not belong to the selected customer."
            )

        if installment.loan_id != loan.id:
            raise serializers.ValidationError(
                "Selected installment does not belong to the selected loan."
            )

        if user.branch_id != customer.branch_id:
            raise serializers.ValidationError(
                "You can only collect payments for customers in your branch."
            )

        if loan.status != Loan.Status.ACTIVE:
            raise serializers.ValidationError(
                "Cash cannot be collected for an inactive loan."
            )

        if installment.status == RepaymentSchedule.Status.PAID:
            raise serializers.ValidationError(
                "This installment has already been fully paid."
            )

        remaining_amount = installment.expected_amount - installment.paid_amount

        if amount > remaining_amount:
            raise serializers.ValidationError(
                f"Collection amount cannot exceed the remaining "
                f"installment amount of ₹{remaining_amount}."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user

        installment = validated_data["installment"]
        loan = validated_data["loan"]
        amount = validated_data["amount"]

        installment = (
            RepaymentSchedule.objects
            .select_for_update()
            .get(pk=installment.pk)
        )

        remaining_amount = installment.expected_amount - installment.paid_amount

        if amount > remaining_amount:
            raise serializers.ValidationError(
                "Collection amount exceeds the remaining installment amount."
            )

        installment.paid_amount += amount

        if installment.paid_amount == installment.expected_amount:
            installment.status = RepaymentSchedule.Status.PAID
        else:
            installment.status = RepaymentSchedule.Status.PARTIAL

        installment.save(update_fields=["paid_amount", "status"])

        loan.outstanding_amount -= amount

        if loan.outstanding_amount < Decimal("0.00"):
            loan.outstanding_amount = Decimal("0.00")

        loan.save(update_fields=["outstanding_amount"])

        receipt_number = f"RCPT-CMRS-{uuid4().hex[:10].upper()}"

        collection = CashCollection.objects.create(
            **validated_data,
            receipt_number=receipt_number,
            agent=user,
            status=CashCollection.Status.COLLECTED,
        )

        return collection