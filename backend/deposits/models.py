from django.db import models


class BankDeposit(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        DEPOSITED = "DEPOSITED", "Deposited"
        SETTLED = "SETTLED", "Settled"
        FAILED = "FAILED", "Failed"
        MISMATCH = "MISMATCH", "Mismatch"

    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,
        related_name="bank_deposits"
    )
    reconciliation = models.ForeignKey(
        "reconciliation.Reconciliation",
        on_delete=models.PROTECT,
        related_name="bank_deposits"
    )
    bank_name = models.CharField(max_length=100)
    deposit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    deposit_date = models.DateField()
    bank_reference = models.CharField(
        max_length=50,
        unique=True
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.bank_reference