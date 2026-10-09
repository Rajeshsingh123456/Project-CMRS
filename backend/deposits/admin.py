from django.contrib import admin
from .models import BankDeposit


@admin.register(BankDeposit)
class BankDepositAdmin(admin.ModelAdmin):
    list_display = (
        "bank_reference",
        "branch",
        "bank_name",
        "deposit_amount",
        "deposit_date",
        "status",
    )
    search_fields = (
        "bank_reference",
        "bank_name",
    )
    list_filter = ("status", "branch")