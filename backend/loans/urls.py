from rest_framework.routers import DefaultRouter

from .views import LoanViewSet, RepaymentScheduleViewSet


router = DefaultRouter()

router.register("loans", LoanViewSet, basename="loan")
router.register(
    "repayment-schedules",
    RepaymentScheduleViewSet,
    basename="repayment-schedule",
)

urlpatterns = router.urls