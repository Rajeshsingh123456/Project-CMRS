from django.conf import settings
from django.db import models


class CashCollection(models.Model):

    class Status(models.TextChoices):
        COLLECTED = "COLLECTED", "Collected"
        SUBMITTED = "SUBMITTED", "Submitted"
        RECONCILED = "RECONCILED", "Reconciled"
        REJECTED = "REJECTED", "Rejected"

    receipt_number = models.CharField(
        max_length=30,
        unique=True
    )

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="cash_collections"
    )

    loan = models.ForeignKey(
        "loans.Loan",
        on_delete=models.PROTECT,
        related_name="cash_collections"
    )

    installment = models.ForeignKey(
        "loans.RepaymentSchedule",
        on_delete=models.PROTECT,
        related_name="cash_collections"
    )

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="cash_collections"
    )

    submission = models.ForeignKey(
        "reconciliation.CashSubmission",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="collections"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    collection_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COLLECTED
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.receipt_number} - ₹{self.amount}"