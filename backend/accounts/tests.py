from datetime import date
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from branches.models import Branch
from customers.models import Customer
from loans.models import Loan, RepaymentSchedule


class CMRSFlowTest(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.branch = Branch.objects.create(
            name="Delhi Main Branch",
            code="DL001",
            address="Delhi",
            city="Delhi",
        )

        self.agent = User.objects.create_user(
            username="testagent",
            password="Test@123",
            role=User.Role.AGENT,
            branch=self.branch,
        )

        self.manager = User.objects.create_user(
            username="testmanager",
            password="Test@123",
            role=User.Role.BRANCH_MANAGER,
            branch=self.branch,
        )

        self.customer = Customer.objects.create(
            branch=self.branch,
            name="Test Customer",
            phone="9999999999",
            email="test@example.com",
            address="Delhi",
        )

        self.loan = Loan.objects.create(
            customer=self.customer,
            loan_number="LN-TEST-001",
            principal_amount=Decimal("5000.00"),
            total_amount=Decimal("5000.00"),
            outstanding_amount=Decimal("5000.00"),
            start_date=date.today(),
        )

        self.installment = RepaymentSchedule.objects.create(
            loan=self.loan,
            installment_number=1,
            due_date=date.today(),
            expected_amount=Decimal("5000.00"),
        )

    def login(self, username, password):

        response = self.client.post(
            "/api/auth/login/",
            {
                "username": username,
                "password": password,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=(
                f"Bearer {response.data['access']}"
            )
        )

    def test_cash_lifecycle(self):

        # Agent login
        self.login(
            "testagent",
            "Test@123"
        )

        # Customer cash collection
        collection_response = self.client.post(
            "/api/cash-collections/",
            {
                "receipt_number": "RCPT-TEST-001",
                "customer": self.customer.id,
                "loan": self.loan.id,
                "installment": self.installment.id,
                "amount": "5000.00",
                "collection_date": str(date.today()),
            },
            format="json",
        )

        self.assertEqual(
            collection_response.status_code,
            201
        )

        # Agent submits collected cash
        submission_response = self.client.post(
            "/api/cash-submissions/",
            {
                "submission_number": "SUB-TEST-001",
                "submission_date": str(date.today()),
            },
            format="json",
        )

        self.assertEqual(
            submission_response.status_code,
            201
        )

        submission_id = submission_response.data["id"]

        # Branch manager login
        self.login(
            "testmanager",
            "Test@123"
        )

        # Branch reconciliation
        reconciliation_response = self.client.post(
            "/api/reconciliations/",
            {
                "cash_submission": submission_id,
                "received_amount": "5000.00",
                "remarks": "Verified",
            },
            format="json",
        )

        self.assertEqual(
            reconciliation_response.status_code,
            201
        )

        reconciliation_id = (
            reconciliation_response.data["id"]
        )

        # Bank deposit
        deposit_response = self.client.post(
            "/api/bank-deposits/",
            {
                "reconciliation": reconciliation_id,
                "bank_name": "Demo Bank",
                "deposit_amount": "5000.00",
                "deposit_date": str(date.today()),
                "bank_reference": "BANK-TEST-001",
            },
            format="json",
        )

        self.assertEqual(
            deposit_response.status_code,
            201
        )

        # Deposit should be marked as deposited
        self.assertEqual(
            deposit_response.data["status"],
            "DEPOSITED"
        )

        # Settlement
        deposit_id = deposit_response.data["id"]

        settle_response = self.client.post(
            f"/api/bank-deposits/{deposit_id}/settle/",
            {},
            format="json",
        )

        self.assertEqual(
            settle_response.status_code,
            200
        )

        self.assertEqual(
            settle_response.data["status"],
            "SETTLED"
        )