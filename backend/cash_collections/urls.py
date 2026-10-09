from rest_framework.routers import DefaultRouter

from .views import CashCollectionViewSet


router = DefaultRouter()

router.register(
    "cash-collections",
    CashCollectionViewSet,
    basename="cash-collection",
)

urlpatterns = router.urls