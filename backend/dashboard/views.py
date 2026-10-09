from decimal import Decimal

from django.db.models import Sum

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from loans.models import Loan
from cash_collections.models import CashCollection
from reconciliation.models import CashSubmission, Reconciliation
from deposits.models import BankDeposit


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        customers = Customer.objects.all()
        loans = Loan.objects.all()
        collections = CashCollection.objects.all()
        submissions = CashSubmission.objects.all()
        reconciliations = Reconciliation.objects.all()
        deposits = BankDeposit.objects.all()

        if user.role == "AGENT":
            collections = collections.filter(agent=user)
            submissions = submissions.filter(agent=user)

            if user.branch_id:
                customers = customers.filter(branch_id=user.branch_id)
                loans = loans.filter(customer__branch_id=user.branch_id)
                reconciliations = reconciliations.filter(
                    cash_submission__branch_id=user.branch_id
                )
                deposits = deposits.filter(branch_id=user.branch_id)

        elif user.role == "BRANCH_MANAGER":
            if user.branch_id:
                customers = customers.filter(branch_id=user.branch_id)
                loans = loans.filter(customer__branch_id=user.branch_id)
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

        total_collections = collections.aggregate(
            total=Sum("amount")
        )["total"] or Decimal("0.00")

        total_deposits = deposits.aggregate(
            total=Sum("deposit_amount")
        )["total"] or Decimal("0.00")

        active_loans = loans.filter(
            status=Loan.Status.ACTIVE
        ).count()

        total_principal = loans.aggregate(
            total=Sum("principal_amount")
        )["total"] or Decimal("0.00")

        outstanding_amount = loans.aggregate(
            total=Sum("outstanding_amount")
        )["total"] or Decimal("0.00")

        pending_reconciliations = submissions.filter(
            status=CashSubmission.Status.SUBMITTED
        ).count()

        approved_reconciliations = reconciliations.filter(
            status=Reconciliation.Status.APPROVED
        ).count()

        discrepancy_count = reconciliations.filter(
            status=Reconciliation.Status.DISCREPANCY
        ).count()

        discrepancy_amount = reconciliations.filter(
            status=Reconciliation.Status.DISCREPANCY
        ).aggregate(
            total=Sum("discrepancy_amount")
        )["total"] or Decimal("0.00")

        settled_deposits = deposits.filter(
            status=BankDeposit.Status.SETTLED
        ).count()

        deposited_count = deposits.filter(
            status=BankDeposit.Status.DEPOSITED
        ).count()

        return Response({
            "total_customers": customers.count(),
            "total_loans": loans.count(),
            "active_loans": active_loans,
            "total_principal": total_principal,
            "outstanding_amount": outstanding_amount,

            "total_collections": total_collections,
            "collection_count": collections.count(),

            "total_submissions": submissions.count(),
            "pending_reconciliations": pending_reconciliations,

            "approved_reconciliations": approved_reconciliations,
            "discrepancies": discrepancy_count,
            "discrepancy_amount": discrepancy_amount,

            "total_deposits": total_deposits,
            "deposited_count": deposited_count,
            "settled_deposits": settled_deposits,

            "role": user.role,
        })