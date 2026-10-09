from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "CMRS Details",
            {
                "fields": (
                    "role",
                    "branch",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "CMRS Details",
            {
                "fields": (
                    "role",
                    "branch",
                )
            },
        ),
    )

    list_display = (
        "username",
        "email",
        "role",
        "branch",
        "is_active",
    )

    list_filter = (
        "role",
        "branch",
        "is_active",
    )

    search_fields = (
        "username",
        "email",
    )