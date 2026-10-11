# CMRS — Cash Management & Reconciliation System

A full-stack web application designed to manage customer repayments, cash collections, branch reconciliation, discrepancies, and bank deposits through a structured cash-management workflow.

## Live Demo

**Live Website:** https://project-cmrs.vercel.app

**GitHub Repository:** https://github.com/Rajeshsingh123456/Project-CMRS

---

## Overview

The Cash Management & Reconciliation System (CMRS) is designed to organize and track the cash collection process in a lending or financial-services environment.

It helps manage customer and loan records, record repayments, track collection receipts, verify cash submitted by collection agents, identify discrepancies between expected and actual amounts, and maintain bank deposit records.

The system uses role-based access control to help ensure users can access the features permitted for their roles.

## Key Features

### 1. Authentication & Role-Based Access
- User authentication using JWT.
- Role-based access control for protected application features.
- Access restrictions for authorized operations.

### 2. Customer Management
- Create and manage customer records.
- Maintain customer information used in repayment workflows.
- Associate customers with relevant loan records.

### 3. Loan Management
- Manage loan information.
- Track repayment-related details.
- Monitor outstanding amounts and repayment information where available.

### 4. Cash Collection
- Record customer repayments.
- Support full and partial repayment workflows.
- Maintain collection and receipt/reference information.
- Track collected amounts for reconciliation.

### 5. Branch Cash Submission
- Track cash submitted by collection agents to a branch.
- Maintain expected and received cash information.
- Support branch-level verification of submitted collections.

### 6. Cash Reconciliation
- Compare expected cash against actual cash received.
- Identify and record discrepancies.
- Support discrepancy review and resolution workflows.

### 7. Bank Deposit Management
- Record and track bank deposit information.
- Maintain deposit-related records for cash settlement tracking.
- Connect branch reconciliation with the bank deposit workflow.

### 8. Dashboard
- Provide an overview of relevant cash-management information.
- Help users navigate the workflows available to their roles.

### 9. REST API
- Django REST Framework backend.
- JWT-based authentication support.
- API endpoints for frontend-backend communication.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| UI | HTML5, CSS3 |
| Routing | React Router |
| Backend | Python, Django |
| API | Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| API Schema & Documentation | drf-spectacular, OpenAPI |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git, GitHub |

---

## Cash Management Workflow

The system is designed around the following workflow:

1. **Customer Repayment** — A customer makes a repayment against a loan.
2. **Agent Collection** — The collection agent records the payment and relevant receipt details.
3. **Branch Cash Submission** — The agent submits the collected cash to the branch.
4. **Branch Verification** — The branch verifies the cash submitted by the agent.
5. **Reconciliation** — Expected cash is compared with the amount actually received.
6. **Discrepancy Tracking** — Any difference is recorded for review and resolution.
7. **Bank Deposit** — Verified cash is recorded as a bank deposit.
8. **Settlement Tracking** — Deposit and settlement records support tracking through the cash-management process.

## Example Reconciliation

Consider a branch submission with the following amounts:

| Description | Amount |
|---|---:|
| Expected Cash | ₹50,000 |
| Actual Cash Received | ₹48,500 |
| Difference | ₹1,500 |

The ₹1,500 difference represents a discrepancy that requires review according to the branch's reconciliation process.

---

## Project Architecture

CMRS follows a frontend-backend architecture.

- **Frontend:** React application responsible for the user interface, navigation, and user interactions.
- **Backend:** Django REST Framework responsible for API endpoints, business logic, authentication, and server-side validation.
- **Database:** PostgreSQL stores application records.
- **Authentication:** JWT tokens are used to authenticate API requests, with permissions applied to protected operations.

The frontend communicates with the backend through HTTP API requests.

## Project Structure

```text
Project-CMRS/
├── backend/
│   ├── accounts/
│   ├── branches/
│   ├── customers/
│   ├── loans/
│   ├── cash_collections/
│   ├── reconciliation/
│   ├── deposits/
│   ├── config/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

Install the following before running the project locally:

- Python
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Rajeshsingh123456/Project-CMRS.git
cd Project-CMRS
```

### 2. Configure the Backend

Open a terminal in the project root and run:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Configure the backend environment variables using `backend/.env.example` as a reference. Set the required Django settings and PostgreSQL connection details using your local configuration.

Create the required database in PostgreSQL before running migrations.

Apply database migrations:

```bash
python manage.py migrate
```

Start the Django development server:

```bash
python manage.py runserver
```

The backend development server will normally run at:

`http://127.0.0.1:8000/`

### 3. Configure the Frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
```

Configure the frontend environment variables using `frontend/.env.example`. Set the API base URL to the locally running backend.

Start the Vite development server:

```bash
npm run dev
```

Open the local development URL displayed in the terminal.

> **Note:** Local setup depends on the environment variables and database settings configured for your environment.

---

## Security

- Keep secret keys, database credentials, and access tokens out of source control.
- Use environment variables for sensitive configuration.
- Do not commit `.env` files or database backup files containing sensitive information.
- Set `DEBUG=False` in production.
- Configure Django allowed hosts, CORS, and CSRF settings appropriately.
- Apply authentication and role-based permissions to protected API operations.
- Restrict access to customer, loan, collection, reconciliation, and deposit records.
- Use HTTPS for deployed application traffic.
- Use authorized test accounts when demonstrating the application.

## Current Project Status

The frontend is deployed on Vercel, and the Django backend is deployed on Render.

CMRS brings together the core cash-management workflows for customer and loan management, collection recording, branch cash reconciliation, discrepancy tracking, and bank deposit management.

The deployed application should be tested with authorized accounts to verify individual workflows and role-specific permissions.

## Future Enhancements

Potential areas for further improvement include:

- Automated unit and integration tests.
- Detailed reconciliation reports and audit trails.
- Enhanced settlement monitoring and reporting.
- Additional dashboard analytics.
- Production monitoring and operational alerts.

## Author

**Rajesh Singh**

BCA Student | Aspiring Full Stack Developer

**GitHub:** https://github.com/Rajeshsingh123456

**Project Repository:** https://github.com/Rajeshsingh123456/Project-CMRS
