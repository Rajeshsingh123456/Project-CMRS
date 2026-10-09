from decimal import Decimal

from django.db.models import Sum, Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cash_collections.models import CashCollection
from reconciliation.models import CashSubmission, Reconciliation
from deposits.models import BankDeposit


class ReportsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        collections = CashCollection.objects.all()
        submissions = CashSubmission.objects.all()
        reconciliations = Reconciliation.objects.all()
        deposits = BankDeposit.objects.all()

        if user.role == "AGENT":

            collections = collections.filter(
                agent=user
            )

            submissions = submissions.filter(
                agent=user
            )

            reconciliations = reconciliations.filter(
                cash_submission__agent=user
            )

            deposits = deposits.filter(
                reconciliation__cash_submission__agent=user
            )

        elif user.role == "BRANCH_MANAGER":

            collections = collections.filter(
                customer__branch_id=user.branch_id
            )

            submissions = submissions.filter(
                branch_id=user.branch_id
            )

            reconciliations = reconciliations.filter(
                cash_submission__branch_id=user.branch_id
            )

            deposits = deposits.filter(
                branch_id=user.branch_id
            )

        return Response({
            "collections": {
                "count": collections.count(),
                "total_amount": (
                    collections.aggregate(
                        total=Sum("amount")
                    )["total"]
                    or Decimal("0.00")
                ),
            },

            "submissions": {
                "count": submissions.count(),
                "total_expected": (
                    submissions.aggregate(
                        total=Sum("expected_amount")
                    )["total"]
                    or Decimal("0.00")
                ),
                "total_submitted": (
                    submissions.aggregate(
                        total=Sum("submitted_amount")
                    )["total"]
                    or Decimal("0.00")
                ),
            },

            "reconciliation": {
                "count": reconciliations.count(),
                "approved": reconciliations.filter(
                    status=Reconciliation.Status.APPROVED
                ).count(),
                "discrepancies": reconciliations.filter(
                    status=Reconciliation.Status.DISCREPANCY
                ).count(),
                "total_discrepancy": (
                    reconciliations.filter(
                        status=Reconciliation.Status.DISCREPANCY
                    ).aggregate(
                        total=Sum("discrepancy_amount")
                    )["total"]
                    or Decimal("0.00")
                ),
            },

            "deposits": {
                "count": deposits.count(),
                "total_deposited": (
                    deposits.aggregate(
                        total=Sum("deposit_amount")
                    )["total"]
                    or Decimal("0.00")
                ),
                "settled": deposits.filter(
                    status=BankDeposit.Status.SETTLED
                ).count(),
                "pending": deposits.filter(
                    status=BankDeposit.Status.PENDING
                ).count(),
            },
        })