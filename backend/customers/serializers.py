from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(
        source="branch.name",
        read_only=True
    )

    class Meta:
        model = Customer
        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "phone",
            "email",
            "address",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "branch_name",
        ]