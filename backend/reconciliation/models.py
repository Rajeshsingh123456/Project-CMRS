from django.conf import settings
from django.db import models


class CashSubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Submitted"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        DISCREPANCY = "DISCREPANCY", "Discrepancy"

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cash_submissions"
    )
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,
        related_name="cash_submissions"
    )
    submission_number = models.CharField(
        max_length=30,
        unique=True
    )
    expected_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    submitted_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    submission_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED
    )
    rejection_reason = models.TextField(
        blank=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.submission_number


class Reconciliation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        DISCREPANCY = "DISCREPANCY", "Discrepancy"
        REJECTED = "REJECTED", "Rejected"

    cash_submission = models.OneToOneField(
        CashSubmission,
        on_delete=models.PROTECT,
        related_name="reconciliation"
    )
    expected_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    received_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    discrepancy_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    remarks = models.TextField(
        blank=True
    )
    reconciled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reconciliations"
    )
    reconciled_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Reconciliation #{self.id}"