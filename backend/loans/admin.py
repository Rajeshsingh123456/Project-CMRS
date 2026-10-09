from django.contrib import admin
from .models import Loan, RepaymentSchedule


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = (
        "loan_number",
        "customer",
        "principal_amount",
        "outstanding_amount",
        "status",
        "start_date",
    )
    search_fields = ("loan_number", "customer__name")
    list_filter = ("status",)


@admin.register(RepaymentSchedule)
class RepaymentScheduleAdmin(admin.ModelAdmin):
    list_display = (
        "loan",
        "installment_number",
        "due_date",
        "expected_amount",
        "paid_amount",
        "status",
    )
    search_fields = ("loan__loan_number",)
    list_filter = ("status",)