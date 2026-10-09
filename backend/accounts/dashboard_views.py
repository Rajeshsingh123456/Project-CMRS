from django.db.models import Sum, Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cash_collections.models import CashCollection
from reconciliation.models import CashSubmission, Reconciliation
from deposits.models import BankDeposit
from loans.models import Loan


class DashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        collections = CashCollection.objects.all()
        submissions = CashSubmission.objects.all()
        reconciliations = Reconciliation.objects.all()
        deposits = BankDeposit.objects.all()
        loans = Loan.objects.all()

        # Agent dashboard
        if user.role == "AGENT":
            collections = collections.filter(agent=user)
            submissions = submissions.filter(agent=user)
            reconciliations = reconciliations.filter(
                cash_submission__agent=user
            )
            deposits = deposits.filter(
                reconciliation__cash_submission__agent=user
            )
            loans = loans.filter(
                customer__branch_id=user.branch_id
            )

        # Branch manager dashboard
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
            loans = loans.filter(
                customer__branch_id=user.branch_id
            )

        # Admin gets everything

        total_collected = (
            collections.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        total_submitted = (
            submissions.aggregate(
                total=Sum("submitted_amount")
            )["total"] or 0
        )

        total_received = (
            reconciliations.aggregate(
                total=Sum("received_amount")
            )["total"] or 0
        )

        total_discrepancy = (
            reconciliations.filter(
                status=Reconciliation.Status.DISCREPANCY
            ).aggregate(
                total=Sum("discrepancy_amount")
            )["total"] or 0
        )

        total_deposited = (
            deposits.aggregate(
                total=Sum("deposit_amount")
            )["total"] or 0
        )

        total_settled = (
            deposits.filter(
                status=BankDeposit.Status.SETTLED
            ).aggregate(
                total=Sum("deposit_amount")
            )["total"] or 0
        )

        outstanding = (
            loans.aggregate(
                total=Sum("outstanding_amount")
            )["total"] or 0
        )

        return Response({
            "role": user.role,

            "metrics": {
                "total_collected": total_collected,
                "total_submitted": total_submitted,
                "total_received": total_received,
                "total_discrepancy": total_discrepancy,
                "total_deposited": total_deposited,
                "total_settled": total_settled,
                "outstanding_amount": outstanding,
            },

            "counts": {
                "collections": collections.count(),
                "submissions": submissions.count(),
                "reconciliations": reconciliations.count(),
                "discrepancies": reconciliations.filter(
                    status=Reconciliation.Status.DISCREPANCY
                ).count(),
                "deposits": deposits.count(),
                "settled_deposits": deposits.filter(
                    status=BankDeposit.Status.SETTLED
                ).count(),
                "loans": loans.count(),
            },
        })