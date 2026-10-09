from django.contrib import admin
from .models import CashSubmission, Reconciliation


@admin.register(CashSubmission)
class CashSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "submission_number",
        "agent",
        "branch",
        "expected_amount",
        "submitted_amount",
        "status",
        "submission_date",
    )
    search_fields = (
        "submission_number",
        "agent__username",
    )
    list_filter = ("status", "branch")


@admin.register(Reconciliation)
class ReconciliationAdmin(admin.ModelAdmin):
    list_display = (
        "cash_submission",
        "expected_amount",
        "received_amount",
        "discrepancy_amount",
        "status",
        "reconciled_by",
        "reconciled_at",
    )
    list_filter = ("status",)
    search_fields = ("cash_submission__submission_number",)