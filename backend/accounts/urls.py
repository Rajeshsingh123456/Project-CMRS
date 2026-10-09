from django.urls import path
from rest_framework.routers import DefaultRouter
from .reports_views import ReportsView

from .dashboard_views import DashboardView
from .views import (
    CurrentUserView,
    LoginView,
    UserViewSet,
)


router = DefaultRouter()

router.register(
    "users",
    UserViewSet,
    basename="user"
)


urlpatterns = [
    path(
        "login/",
        LoginView.as_view(),
        name="login"
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user"
    ),

    path(
        "dashboard/",
        DashboardView.as_view(),
        name="dashboard"
    ),

    path(
    "reports/",
    ReportsView.as_view(),
    name="reports"
),
]


urlpatterns += router.urls