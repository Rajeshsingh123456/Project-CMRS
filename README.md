# CMRS — Cash Management & Reconciliation System

A role-based cash collection and reconciliation platform designed to manage the repayment journey from customers to collection agents, branches, bank deposits, and company accounts.

## Overview

CMRS aims to bring transparency and accountability to cash repayment operations by tracking collections, verifying cash submissions, identifying discrepancies, and monitoring settlement status.

The system is designed for lending and fintech workflows where accurate cash tracking and reconciliation are essential.

## Key Features

* **Role-Based Access:** Separate workflows for authorized users based on their roles.
* **Customer & Loan Management:** Maintain customer information, loan details, repayment schedules, and outstanding balances.
* **Cash Collection:** Record full or partial repayments collected by agents.
* **Collection Receipts:** Track payment references and collection records.
* **Branch Reconciliation:** Compare expected collections with actual cash received.
* **Discrepancy Management:** Identify and track cash differences for further review.
* **Cash Submission:** Support the submission and verification of collected cash.
* **Bank Deposit Tracking:** Track deposits and settlement progress.
* **REST API:** Backend API architecture for communication between the frontend and backend.

## Technology Stack

**Frontend**

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

**Backend**

* Python
* Django
* Django REST Framework
* Django REST Framework Simple JWT

**Database**

* PostgreSQL

**API Documentation**

* drf-spectacular / OpenAPI

**Deployment**

* Planned: Render for backend and database hosting, Vercel for frontend hosting.

## System Workflow

```text
Customer Repayment
        |
        v
Collection Agent
        |
        v
Branch Cash Submission
        |
        v
Branch Verification
        |
        v
Expected vs Actual Reconciliation
        |
        v
Bank Deposit
        |
        v
Company Account Settlement
```

## Project Structure

```text
CMRS/
├── backend/
│   ├── accounts/
│   ├── branches/
│   ├── customers/
│   ├── loans/
│   ├── reconciliation/
│   ├── deposits/
│   ├── cash_collections/
│   ├── config/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

*The folder structure above represents the intended application organization; update it if the repository differs.*

## Local Setup

### Prerequisites

* Python
* Node.js and npm
* PostgreSQL
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/Project-CMRS.git
cd Project-CMRS
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

### 2. Set Up the Backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory using `.env.example` as a template.

Configure your own secret key and local PostgreSQL credentials. Never commit your real `.env` file.

Example configuration:

```dotenv
SECRET_KEY=your_private_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=cmrs_db
DB_USER=postgres
DB_PASSWORD=your_local_database_password
DB_HOST=localhost
DB_PORT=5432
```

Create the PostgreSQL database specified by `DB_NAME` before running migrations.

### 4. Run Backend Migrations

```bash
python manage.py migrate
```

Create an administrator account if required:

```bash
python manage.py createsuperuser
```

Start the backend development server:

```bash
python manage.py runserver
```

The default local backend address is:

`http://127.0.0.1:8000/`

### 5. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## Security

* Keep secret keys, database passwords, and production credentials in environment variables.
* Do not commit `.env` files or sensitive database backups.
* Use `DEBUG=False` in production.
* Configure allowed hosts, CORS, and CSRF trusted origins for the deployed domains.
* Use HTTPS for production traffic.

## Project Status

CMRS is under development. Deployment, database configuration, and end-to-end verification are part of the release process. Features should be considered complete only after implementation and testing.

## Future Improvements

* Detailed reconciliation reports and audit trails.
* Automated settlement status tracking.
* Improved discrepancy review and approval workflows.
* Dashboard analytics and collection summaries.
* Automated testing and production monitoring.

## Author

**Rajesh Singh**

BCA Student | Aspiring Full Stack Developer

GitHub: https://github.com/YOUR_GITHUB_USERNAME

---

*CMRS — Bringing visibility, accountability, and accuracy to cash management and reconciliation.*
