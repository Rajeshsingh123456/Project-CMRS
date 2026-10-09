from rest_framework.routers import DefaultRouter

from .views import BankDepositViewSet


router = DefaultRouter()

router.register(
    "bank-deposits",
    BankDepositViewSet,
    basename="bank-deposit",
)

urlpatterns = router.urls