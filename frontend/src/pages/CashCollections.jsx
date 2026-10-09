import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import "./CashCollections.css";

function CashCollections() {
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [installments, setInstallments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    receipt_number: "",
    customer: "",
    loan: "",
    installment: "",
    amount: "",
    collection_date: new Date().toISOString().split("T")[0],
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadCollections = async () => {
    try {
      const data = await apiRequest("/cash-collections/");
      setCollections(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiRequest("/customers/");
      setCustomers(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadLoans = async () => {
    try {
      const data = await apiRequest("/loans/");
      setLoans(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadInstallments = async () => {
    try {
      const data = await apiRequest("/repayment-schedules/");
      setInstallments(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    await Promise.all([
      loadCollections(),
      loadCustomers(),
      loadLoans(),
      loadInstallments(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLoans = useMemo(() => {
    if (!form.customer) return [];

    return loans.filter((loan) => {
      const customerId = loan.customer?.id ?? loan.customer;
      return String(customerId) === String(form.customer);
    });
  }, [loans, form.customer]);

  const filteredInstallments = useMemo(() => {
    if (!form.loan) return [];

    return installments.filter((installment) => {
      const loanId = installment.loan?.id ?? installment.loan;
      return String(loanId) === String(form.loan);
    });
  }, [installments, form.loan]);

  const selectedInstallment = filteredInstallments.find(
    (installment) =>
      String(installment.id) === String(form.installment)
  );

  const handleCustomerChange = (event) => {
    setForm((previous) => ({
      ...previous,
      customer: event.target.value,
      loan: "",
      installment: "",
      amount: "",
    }));
  };

  const handleLoanChange = (event) => {
    setForm((previous) => ({
      ...previous,
      loan: event.target.value,
      installment: "",
      amount: "",
    }));
  };

  const handleInstallmentChange = (event) => {
    const installmentId = event.target.value;

    const installment = filteredInstallments.find(
      (item) => String(item.id) === String(installmentId)
    );

    const expected = Number(installment?.expected_amount || 0);
    const paid = Number(installment?.paid_amount || 0);
    const remaining = Math.max(expected - paid, 0);

    setForm((previous) => ({
      ...previous,
      installment: installmentId,
      amount: remaining > 0 ? remaining.toFixed(2) : "",
    }));
  };

  const resetForm = () => {
    setForm({
      receipt_number: "",
      customer: "",
      loan: "",
      installment: "",
      amount: "",
      collection_date: new Date().toISOString().split("T")[0],
    });
  };

  const closeModal = () => {
    if (!submitting) {
      setShowModal(false);
      resetForm();
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.receipt_number.trim()) {
      setError("Receipt number is required.");
      return;
    }

    if (!form.customer || !form.loan || !form.installment) {
      setError("Please select customer, loan and installment.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Collection amount must be greater than zero.");
      return;
    }

    if (
      selectedInstallment &&
      Number(form.amount) >
        Number(selectedInstallment.expected_amount || 0) -
          Number(selectedInstallment.paid_amount || 0)
    ) {
      setError("Collection amount cannot exceed the remaining installment amount.");
      return;
    }

    try {
      setSubmitting(true);

      await apiRequest("/cash-collections/", {
        method: "POST",
        body: JSON.stringify({
          receipt_number: form.receipt_number.trim(),
          customer: Number(form.customer),
          loan: Number(form.loan),
          installment: Number(form.installment),
          amount: form.amount,
          collection_date: form.collection_date,
        }),
      });

      setSuccess("Cash collection recorded successfully.");
      setShowModal(false);
      resetForm();

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = collections.reduce(
    (sum, collection) => sum + Number(collection.amount || 0),
    0
  );

  const todayCollected = collections
    .filter(
      (collection) =>
        collection.collection_date ===
        new Date().toISOString().split("T")[0]
    )
    .reduce(
      (sum, collection) => sum + Number(collection.amount || 0),
      0
    );

  const collectionCount = collections.length;

  const submittedCount = collections.filter(
    (collection) => collection.status === "SUBMITTED"
  ).length;

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  return (
    <div className="cash-collections-page">
      <div className="cash-collections-header">
        <div>
          <span className="page-eyebrow">COLLECTION OPERATIONS</span>
          <h1>Cash Collections</h1>
          <p>
            Record and monitor customer cash collections made by collection agents.
          </p>
        </div>

        {user.role === "AGENT" && (
          <button
            className="primary-action"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowModal(true);
            }}
          >
            <span>+</span>
            Record Collection
          </button>
        )}
      </div>

      {success && (
        <div className="collection-alert success-alert">
          <span>✓</span>
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="collection-alert error-alert">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="collection-stat-grid">
        <div className="collection-stat-card">
          <div className="stat-icon">₹</div>
          <div>
            <span>Total Collected</span>
            <strong>{formatCurrency(totalCollected)}</strong>
          </div>
        </div>

        <div className="collection-stat-card">
          <div className="stat-icon">₹</div>
          <div>
            <span>Collected Today</span>
            <strong>{formatCurrency(todayCollected)}</strong>
          </div>
        </div>

        <div className="collection-stat-card">
          <div className="stat-icon">#</div>
          <div>
            <span>Total Collections</span>
            <strong>{collectionCount}</strong>
          </div>
        </div>

        <div className="collection-stat-card">
          <div className="stat-icon">↗</div>
          <div>
            <span>Pending Submission</span>
            <strong>{submittedCount === 0 ? collectionCount : submittedCount}</strong>
          </div>
        </div>
      </div>

      <section className="collections-panel">
        <div className="panel-header">
          <div>
            <h2>Collection History</h2>
            <p>Recent customer payment collection records.</p>
          </div>

          <button
            className="refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-state">
              <div className="loading-spinner"></div>
              <p>Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="table-state empty-state">
              <div className="empty-icon">₹</div>
              <h3>No collections found</h3>
              <p>
                Recorded customer collections will appear here.
              </p>
            </div>
          ) : (
            <table className="collections-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Customer</th>
                  <th>Loan</th>
                  <th>Installment</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id}>
                    <td>
                      <strong className="receipt-number">
                        {collection.receipt_number}
                      </strong>
                    </td>

                    <td>
                      <div className="customer-cell">
                        <span className="customer-avatar">
                          {(collection.customer_name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {collection.customer_name || "-"}
                        </span>
                      </div>
                    </td>

                    <td>{collection.loan_number || "-"}</td>

                    <td>
                      {collection.installment_number
                        ? `#${collection.installment_number}`
                        : "-"}
                    </td>

                    <td>
                      <strong className="amount-cell">
                        {formatCurrency(collection.amount)}
                      </strong>
                    </td>

                    <td>
                      {formatDate(collection.collection_date)}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${String(
                          collection.status || ""
                        ).toLowerCase()}`}
                      >
                        {collection.status || "COLLECTED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="collection-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">NEW TRANSACTION</span>
                <h2>Record Cash Collection</h2>
                <p>
                  Enter the payment details collected from the customer.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="modal-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Receipt Number</label>
                  <input
                    type="text"
                    placeholder="e.g. RCPT-2026-001"
                    value={form.receipt_number}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        receipt_number: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Collection Date</label>
                  <input
                    type="date"
                    value={form.collection_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        collection_date: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group form-group-full">
                  <label>Customer</label>
                  <select
                    value={form.customer}
                    onChange={handleCustomerChange}
                  >
                    <option value="">Select customer</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone ? ` — ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Loan</label>
                  <select
                    value={form.loan}
                    onChange={handleLoanChange}
                    disabled={!form.customer}
                  >
                    <option value="">
                      {form.customer
                        ? "Select loan"
                        : "Select customer first"}
                    </option>

                    {filteredLoans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.loan_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Installment</label>
                  <select
                    value={form.installment}
                    onChange={handleInstallmentChange}
                    disabled={!form.loan}
                  >
                    <option value="">
                      {form.loan
                        ? "Select installment"
                        : "Select loan first"}
                    </option>

                    {filteredInstallments.map((installment) => {
                      const remaining =
                        Number(installment.expected_amount || 0) -
                        Number(installment.paid_amount || 0);

                      return (
                        <option
                          key={installment.id}
                          value={installment.id}
                          disabled={remaining <= 0}
                        >
                          Installment #{installment.installment_number}
                          {" — "}
                          {formatCurrency(Math.max(remaining, 0))}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label>Collection Amount</label>

                  <div className="amount-input-wrapper">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          amount: event.target.value,
                        })
                      }
                    />
                  </div>

                  {selectedInstallment && (
                    <small className="field-help">
                      Remaining installment amount:{" "}
                      <strong>
                        {formatCurrency(
                          Number(
                            selectedInstallment.expected_amount || 0
                          ) -
                            Number(
                              selectedInstallment.paid_amount || 0
                            )
                        )}
                      </strong>
                    </small>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={submitting}
                >
                  {submitting ? "Recording..." : "Record Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashCollections;