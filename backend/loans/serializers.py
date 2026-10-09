from rest_framework import serializers

from .models import Loan, RepaymentSchedule


class RepaymentScheduleSerializer(serializers.ModelSerializer):

    class Meta:
        model = RepaymentSchedule
        fields = [
            "id",
            "loan",
            "installment_number",
            "due_date",
            "expected_amount",
            "paid_amount",
            "status",
        ]
        read_only_fields = ["id", "paid_amount", "status"]

    def validate(self, attrs):
        loan = attrs["loan"]

        if loan.status != Loan.Status.ACTIVE:
            raise serializers.ValidationError(
                "Repayment schedule can only be created for an active loan."
            )

        if attrs["expected_amount"] <= 0:
            raise serializers.ValidationError(
                "Expected amount must be greater than zero."
            )

        return attrs


class LoanSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Loan
        fields = [
            "id",
            "customer",
            "customer_name",
            "loan_number",
            "principal_amount",
            "total_amount",
            "outstanding_amount",
            "start_date",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "outstanding_amount",
            "created_at",
            "customer_name",
        ]

    def validate(self, attrs):
        principal = attrs["principal_amount"]
        total = attrs["total_amount"]

        if principal <= 0:
            raise serializers.ValidationError(
                "Principal amount must be greater than zero."
            )

        if total < principal:
            raise serializers.ValidationError(
                "Total amount cannot be less than principal amount."
            )

        return attrs

    def create(self, validated_data):
        validated_data["outstanding_amount"] = validated_data["total_amount"]
        return super().create(validated_data)