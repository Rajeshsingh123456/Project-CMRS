from rest_framework.routers import DefaultRouter

from .views import CashSubmissionViewSet, ReconciliationViewSet


router = DefaultRouter()

router.register(
    "cash-submissions",
    CashSubmissionViewSet,
    basename="cash-submission",
)

router.register(
    "reconciliations",
    ReconciliationViewSet,
    basename="reconciliation",
)

urlpatterns = router.urls