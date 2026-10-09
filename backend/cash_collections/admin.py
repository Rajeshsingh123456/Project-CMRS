from django.contrib import admin
from .models import CashCollection


@admin.register(CashCollection)
class CashCollectionAdmin(admin.ModelAdmin):
    list_display = (
        "receipt_number",
        "customer",
        "loan",
        "agent",
        "amount",
        "collection_date",
        "status",
    )
    search_fields = (
        "receipt_number",
        "customer__name",
        "loan__loan_number",
    )
    list_filter = ("status", "collection_date")