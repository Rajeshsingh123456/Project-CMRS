from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import CashSubmission, Reconciliation
from cash_collections.models import CashCollection


class CashSubmissionSerializer(serializers.ModelSerializer):

    agent_username = serializers.CharField(
        source="agent.username",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = CashSubmission
        fields = [
            "id",
            "submission_number",
            "agent",
            "agent_username",
            "branch",
            "branch_name",
            "expected_amount",
            "submitted_amount",
            "submission_date",
            "status",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "agent",
            "branch",
            "expected_amount",
            "submitted_amount",
            "status",
            "rejection_reason",
            "created_at",
            "agent_username",
            "branch_name",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        if user.role != "AGENT":
            raise serializers.ValidationError(
                "Only collection agents can submit cash."
            )

        if not user.branch_id:
            raise serializers.ValidationError(
                "Agent is not assigned to a branch."
            )

        collections = CashCollection.objects.filter(
            agent=user,
            status=CashCollection.Status.COLLECTED,
        )

        if not collections.exists():
            raise serializers.ValidationError(
                "No collected cash is available for submission."
            )

        expected_amount = sum(
            (collection.amount for collection in collections),
            Decimal("0.00"),
        )

        if expected_amount <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Submission amount must be greater than zero."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user

        collections = CashCollection.objects.select_for_update().filter(
            agent=user,
            status=CashCollection.Status.COLLECTED,
        )

        if not collections.exists():
            raise serializers.ValidationError(
                "No collected cash is available for submission."
            )

        expected_amount = sum(
            (collection.amount for collection in collections),
            Decimal("0.00"),
        )

        submission = CashSubmission.objects.create(
            submission_number=validated_data["submission_number"],
            agent=user,
            branch_id=user.branch_id,
            expected_amount=expected_amount,
            submitted_amount=expected_amount,
            submission_date=validated_data["submission_date"],
            status=CashSubmission.Status.SUBMITTED,
        )

        collections.update(
            status=CashCollection.Status.SUBMITTED,
            submission=submission,
        )

        return submission


class ReconciliationSerializer(serializers.ModelSerializer):

    submission_number = serializers.CharField(
        source="cash_submission.submission_number",
        read_only=True
    )

    branch_name = serializers.CharField(
        source="cash_submission.branch.name",
        read_only=True
    )

    agent_username = serializers.CharField(
        source="cash_submission.agent.username",
        read_only=True
    )

    class Meta:
        model = Reconciliation
        fields = [
            "id",
            "cash_submission",
            "submission_number",
            "branch_name",
            "agent_username",
            "expected_amount",
            "received_amount",
            "discrepancy_amount",
            "status",
            "remarks",
            "reconciled_by",
            "reconciled_at",
        ]
        read_only_fields = [
            "id",
            "expected_amount",
            "discrepancy_amount",
            "status",
            "reconciled_by",
            "reconciled_at",
            "submission_number",
            "branch_name",
            "agent_username",
        ]

    def validate(self, attrs):
        user = self.context["request"].user
        cash_submission = attrs["cash_submission"]
        received_amount = attrs["received_amount"]

        if user.role not in [
            "ADMIN",
            "BRANCH_MANAGER",
        ]:
            raise serializers.ValidationError(
                "Only Admin or Branch Manager can reconcile cash."
            )

        if (
            user.role == "BRANCH_MANAGER"
            and user.branch_id != cash_submission.branch_id
        ):
            raise serializers.ValidationError(
                "You can only reconcile cash submitted to your branch."
            )

        if cash_submission.status != CashSubmission.Status.SUBMITTED:
            raise serializers.ValidationError(
                "Only submitted cash can be reconciled."
            )

        if hasattr(cash_submission, "reconciliation"):
            raise serializers.ValidationError(
                "This cash submission has already been reconciled."
            )

        if received_amount < Decimal("0.00"):
            raise serializers.ValidationError(
                "Received amount cannot be negative."
            )

        if received_amount > cash_submission.expected_amount:
            raise serializers.ValidationError(
                "Received amount cannot be greater than the expected amount."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user

        cash_submission = (
            CashSubmission.objects
            .select_for_update()
            .get(
                pk=validated_data["cash_submission"].pk
            )
        )

        expected_amount = cash_submission.expected_amount
        received_amount = validated_data["received_amount"]

        discrepancy_amount = (
            expected_amount - received_amount
        )

        if discrepancy_amount == Decimal("0.00"):
            status = Reconciliation.Status.APPROVED
        else:
            status = Reconciliation.Status.DISCREPANCY

        reconciliation = Reconciliation.objects.create(
            cash_submission=cash_submission,
            expected_amount=expected_amount,
            received_amount=received_amount,
            discrepancy_amount=discrepancy_amount,
            status=status,
            remarks=validated_data.get(
                "remarks",
                ""
            ),
            reconciled_by=user,
            reconciled_at=timezone.now(),
        )

        if status == Reconciliation.Status.APPROVED:
            cash_submission.status = (
                CashSubmission.Status.APPROVED
            )
        else:
            cash_submission.status = (
                CashSubmission.Status.DISCREPANCY
            )

        cash_submission.save(
            update_fields=["status"]
        )

        cash_submission.collections.update(
            status=CashCollection.Status.RECONCILED
        )

        return reconciliation