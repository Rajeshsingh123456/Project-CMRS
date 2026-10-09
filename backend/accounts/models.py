from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        AGENT = "AGENT", "Collection Agent"
        BRANCH_MANAGER = "BRANCH_MANAGER", "Branch Manager"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.AGENT
    )

    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    def __str__(self):
        return self.username