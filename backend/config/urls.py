from django.contrib import admin
from django.urls import include, path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "api/auth/",
        include("accounts.urls")
    ),

    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/",
        include("branches.urls")
    ),

    path(
        "api/",
        include("customers.urls")
    ),

    path(
        "api/",
        include("loans.urls")
    ),

    path(
        "api/",
        include("cash_collections.urls")
    ),

    path(
        "api/",
        include("reconciliation.urls")
    ),

    path(
        "api/",
        include("deposits.urls")
    ),

    path(
    "api/",
    include("dashboard.urls")
),

    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),

    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema"
        ),
        name="swagger-ui",
    ),
]