from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class CustomTokenObtainPairSerializer(
    TokenObtainPairSerializer
):

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        token["username"] = user.username
        token["role"] = user.role
        token["branch_id"] = user.branch_id

        return token

    def validate(self, attrs):

        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "role": self.user.role,
            "branch_id": self.user.branch_id,
        }

        return data


class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "email",
            "password",
            "role",
            "branch",
            "is_active",
        ]

        read_only_fields = [
            "id"
        ]

    def create(self, validated_data):

        password = validated_data.pop(
            "password",
            None
        )

        if not password:
            raise serializers.ValidationError(
                {
                    "password": (
                        "Password is required when "
                        "creating a user."
                    )
                }
            )

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user

    def update(self, instance, validated_data):

        password = validated_data.pop(
            "password",
            None
        )

        for attr, value in validated_data.items():

            setattr(
                instance,
                attr,
                value
            )

        if password:
            instance.set_password(
                password
            )

        instance.save()

        return instance