from rest_framework.permissions import BasePermission

from .models import User


class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class IsAgent(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.AGENT
        )


class IsBranchManager(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.BRANCH_MANAGER
        )


class IsAdminOrBranchManager(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [
                User.Role.ADMIN,
                User.Role.BRANCH_MANAGER,
            ]
        )