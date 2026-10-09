
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import "./Loans.css";

const initialForm = {
  customer: "",
  loan_number: "",
  principal_amount: "",
  total_amount: "",
  start_date: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function Loans() {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canManage = ["ADMIN", "BRANCH_MANAGER"].includes(user.role);

  async function loadLoans() {
    try {
      setLoading(true);
      const data = await apiRequest(
        `/loans/${search ? `?search=${encodeURIComponent(search)}` : ""}`
      );
      setLoans(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await apiRequest("/customers/");
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadLoans, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEdit(loan) {
    setEditingId(loan.id);
    setForm({
      customer: String(loan.customer || ""),
      loan_number: loan.loan_number || "",
      principal_amount: String(loan.principal_amount || ""),
      total_amount: String(loan.total_amount || ""),
      start_date: loan.start_date || "",
      status: loan.status || "ACTIVE",
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const principal = Number(form.principal_amount);
    const total = Number(form.total_amount);

    if (!form.customer) return setError("Select a customer.");
    if (!form.loan_number.trim()) return setError("Enter a loan number.");
    if (!Number.isFinite(principal) || principal <= 0) {
      return setError("Principal must be greater than zero.");
    }
    if (!Number.isFinite(total) || total < principal) {
      return setError("Total amount must be at least the principal amount.");
    }
    if (!form.start_date) return setError("Select the loan start date.");

    try {
      setSaving(true);

      const payload = {
        customer: Number(form.customer),
        loan_number: form.loan_number.trim(),
        principal_amount: principal.toFixed(2),
        total_amount: total.toFixed(2),
        start_date: form.start_date,
        status: form.status,
      };

      await apiRequest(
        editingId ? `/loans/${editingId}/` : "/loans/",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setShowForm(false);
      setMessage(editingId ? "Loan updated successfully." : "Loan created successfully.");
      await loadLoans();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLoan(loan) {
    if (!window.confirm(`Delete loan ${loan.loan_number}?`)) return;

    try {
      setError("");
      setMessage("");
      await apiRequest(`/loans/${loan.id}/`, { method: "DELETE" });
      setMessage("Loan deleted successfully.");
      await loadLoans();
    } catch (e) {
      setError(e.message);
    }
  }

  const activeCount = loans.filter((loan) => loan.status === "ACTIVE").length;
  const principalTotal = loans.reduce(
    (sum, loan) => sum + Number(loan.principal_amount || 0),
    0
  );
  const outstandingTotal = loans.reduce(
    (sum, loan) => sum + Number(loan.outstanding_amount || 0),
    0
  );

  return (
    <main className="loans-page">
      <header className="page-header">
        <div>
          <h1>Loans</h1>
          <p>Manage customer loans and outstanding balances.</p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={openAdd}>
            + Add Loan
          </button>
        )}
      </header>

      {message && <div className="loan-alert success">{message}</div>}
      {error && <div className="loan-alert error">{error}</div>}

      {showForm && canManage && (
        <form className="loan-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Loan" : "Create Loan"}</h2>

          <div className="loan-form-grid">
            <label>
              Customer *
              <select
                required
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Loan Number *
              <input
                required
                maxLength={30}
                value={form.loan_number}
                onChange={(e) => setForm({ ...form, loan_number: e.target.value })}
              />
            </label>

            <label>
              Principal Amount (₹) *
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.principal_amount}
                onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
              />
            </label>

            <label>
              Total Repayable Amount (₹) *
              <input
                required
                type="number"
                min={form.principal_amount || "0.01"}
                step="0.01"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
              />
            </label>

            <label>
              Start Date *
              <input
                required
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DEFAULTED">Defaulted</option>
              </select>
            </label>
          </div>

          <div className="loan-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Loan"}
            </button>
          </div>
        </form>
      )}

      <section className="loan-summary">
        <div className="loan-summary-card">
          <span>Total Loans</span>
          <strong>{loans.length}</strong>
        </div>
        <div className="loan-summary-card">
          <span>Active Loans</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="loan-summary-card">
          <span>Total Principal</span>
          <strong className="money-value">{money(principalTotal)}</strong>
        </div>
        <div className="loan-summary-card">
          <span>Outstanding Balance</span>
          <strong className="money-value">{money(outstandingTotal)}</strong>
        </div>
      </section>

      <section className="loans-toolbar">
        <input
          placeholder="Search loan or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{loans.length} loan(s)</span>
      </section>

      <section className="loans-card">
        {loading ? (
          <p className="table-state">Loading loans...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Customer</th>
                  <th>Principal</th>
                  <th>Total Amount</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 8 : 7} className="empty-table">
                      No loans found.
                    </td>
                  </tr>
                ) : loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.loan_number || `#${loan.id}`}</td>
                    <td>{loan.customer_name || `Customer #${loan.customer}`}</td>
                    <td className="money-value">{money(loan.principal_amount)}</td>
                    <td className="money-value">{money(loan.total_amount)}</td>
                    <td className="money-value">{money(loan.outstanding_amount)}</td>
                    <td><span className={`loan-status status-${(loan.status || "ACTIVE").toLowerCase()}`}>{loan.status}</span></td>
                    <td>{loan.start_date || "—"}</td>
                    {canManage && (
                      <td className="loan-actions">
                        <button type="button" onClick={() => openEdit(loan)}>Edit</button>
                        <button type="button" className="delete-action" onClick={() => deleteLoan(loan)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Loans;