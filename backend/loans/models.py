from django.db import models


class Loan(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"
        DEFAULTED = "DEFAULTED", "Defaulted"

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="loans"
    )
    loan_number = models.CharField(max_length=30, unique=True)
    principal_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    outstanding_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    start_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.loan_number


class RepaymentSchedule(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"

    loan = models.ForeignKey(
        Loan,
        on_delete=models.CASCADE,
        related_name="repayment_schedules"
    )
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    expected_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    def __str__(self):
        return (
            f"{self.loan.loan_number} - "
            f"Installment {self.installment_number}"
        )