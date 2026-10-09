
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import "./BankDeposits.css";

function BankDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);

  const [formData, setFormData] = useState({
    reconciliation: "",
    bank_name: "",
    deposit_amount: "",
    deposit_date: new Date().toISOString().split("T")[0],
    bank_reference: "",
    remarks: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      setUser(null);
    }

    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const depositResult = await Promise.allSettled([
      apiRequest("/bank-deposits/"),
    ]);

    if (depositResult[0].status === "fulfilled") {
      const data = depositResult[0].value;
      setDeposits(data.results || data);
    } else {
      setError(
        depositResult[0].reason?.message ||
          "Failed to load bank deposits."
      );
    }

    const reconciliationResult = await Promise.allSettled([
      apiRequest("/reconciliations/"),
    ]);

    if (reconciliationResult[0].status === "fulfilled") {
      const data = reconciliationResult[0].value;
      setReconciliations(data.results || data);
    } else {
      setReconciliations([]);
      setError((previous) =>
        previous
          ? `${previous} Reconciliations could not be loaded.`
          : "Reconciliations could not be loaded. Please check the backend."
      );
    }

    setLoading(false);
  };

  const availableReconciliations = useMemo(() => {
    const depositedIds = new Set(
      deposits.map((deposit) => String(deposit.reconciliation))
    );

    return reconciliations.filter(
      (reconciliation) =>
        ["APPROVED", "DISCREPANCY"].includes(reconciliation.status) &&
        !depositedIds.has(String(reconciliation.id))
    );
  }, [deposits, reconciliations]);

  const stats = useMemo(
    () => ({
      total: deposits.length,
      deposited: deposits.filter((item) => item.status === "DEPOSITED").length,
      mismatch: deposits.filter((item) => item.status === "MISMATCH").length,
      settled: deposits.filter((item) => item.status === "SETTLED").length,
    }),
    [deposits]
  );

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "reconciliation") {
      const reconciliation = reconciliations.find(
        (item) => String(item.id) === String(value)
      );

      setSelectedReconciliation(reconciliation || null);
      setFormData((previous) => ({
        ...previous,
        reconciliation: value,
        deposit_amount: reconciliation
          ? reconciliation.received_amount
          : "",
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openModal = () => {
    setError("");
    setSuccess("");

    if (!canCreateDeposit) {
      setError("Only Admin or Branch Manager can record bank deposits.");
      return;
    }

    setFormData({
      reconciliation: "",
      bank_name: "",
      deposit_amount: "",
      deposit_date: new Date().toISOString().split("T")[0],
      bank_reference: "",
      remarks: "",
    });

    setSelectedReconciliation(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.reconciliation) {
      setError("Please select a reconciliation.");
      return;
    }

    if (!formData.bank_name.trim()) {
      setError("Please enter the bank name.");
      return;
    }

    if (!formData.deposit_amount || Number(formData.deposit_amount) <= 0) {
      setError("Enter a valid deposit amount.");
      return;
    }

    if (!formData.deposit_date) {
      setError("Deposit date is required.");
      return;
    }

    if (!formData.bank_reference.trim()) {
      setError("Bank reference is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await apiRequest("/bank-deposits/", {
        method: "POST",
        body: JSON.stringify({
          reconciliation: Number(formData.reconciliation),
          bank_name: formData.bank_name.trim(),
          deposit_amount: formData.deposit_amount,
          deposit_date: formData.deposit_date,
          bank_reference: formData.bank_reference.trim(),
          remarks: formData.remarks.trim(),
        }),
      });

      setSuccess("Bank deposit recorded successfully.");
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create bank deposit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettle = async (depositId) => {
    try {
      setSettlingId(depositId);
      setError("");
      setSuccess("");

      await apiRequest(`/bank-deposits/${depositId}/settle/`, {
        method: "POST",
      });

      setSuccess("Bank deposit settled successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to settle bank deposit.");
    } finally {
      setSettlingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "SETTLED":
        return "status-settled";
      case "DEPOSITED":
        return "status-deposited";
      case "MISMATCH":
        return "status-mismatch";
      case "FAILED":
        return "status-failed";
      default:
        return "status-pending";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "SETTLED":
        return "Settled";
      case "DEPOSITED":
        return "Deposited";
      case "MISMATCH":
        return "Mismatch";
      case "FAILED":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const getSubmissionNumber = (deposit) =>
    deposit.reconciliation_details?.cash_submission?.submission_number ||
    deposit.submission_number ||
    `REC-${deposit.reconciliation}`;

  const canCreateDeposit =
    user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER";

  return (
    <div className="bank-deposits-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">SETTLEMENT</span>
          <h1>Bank Deposits</h1>
          <p>Record reconciled cash deposits and track settlement status.</p>
        </div>

        {canCreateDeposit && (
          <button
            type="button"
            className="primary-button"
            onClick={openModal}
            title={
              availableReconciliations.length === 0
                ? "No eligible reconciliations available. Click to see details."
                : "Record a new bank deposit"
            }
          >
            + Record Bank Deposit
          </button>
        )}
      </div>

      {success && (
        <div className="alert success-alert">
          <span>✓</span> {success}
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          <span>!</span> {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">₿</div>
          <div>
            <span>Total Deposits</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↓</div>
          <div>
            <span>Deposited</span>
            <strong>{stats.deposited}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning-icon">!</div>
          <div>
            <span>Mismatches</span>
            <strong>{stats.mismatch}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success-icon">✓</div>
          <div>
            <span>Settled</span>
            <strong>{stats.settled}</strong>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h2>Deposit History</h2>
            <p>Track bank deposits and settlement activity.</p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p>Loading bank deposits...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">₿</div>
            <h3>No bank deposits yet</h3>
            <p>
              Once a reconciliation is completed, you can record the
              corresponding bank deposit here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="deposits-table">
              <thead>
                <tr>
                  <th>Bank Reference</th>
                  <th>Bank</th>
                  <th>Branch</th>
                  <th>Reconciliation</th>
                  <th>Amount</th>
                  <th>Deposit Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>
                      <strong className="reference-number">
                        {deposit.bank_reference}
                      </strong>
                    </td>
                    <td>{deposit.bank_name || "-"}</td>
                    <td>
                      <span className="branch-name">
                        {deposit.branch_name || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="reconciliation-number">
                        {getSubmissionNumber(deposit)}
                      </span>
                    </td>
                    <td>
                      <strong>{formatAmount(deposit.deposit_amount)}</strong>
                    </td>
                    <td>{formatDate(deposit.deposit_date)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(deposit.status)}`}
                      >
                        {getStatusLabel(deposit.status)}
                      </span>
                    </td>
                    <td>
                      {(deposit.status === "DEPOSITED" ||
                        deposit.status === "MISMATCH") && (
                        <button
                          type="button"
                          className="settle-button"
                          onClick={() => handleSettle(deposit.id)}
                          disabled={settlingId === deposit.id}
                        >
                          {settlingId === deposit.id ? "Settling..." : "Settle"}
                        </button>
                      )}

                      {deposit.status === "SETTLED" && (
                        <span className="completed-label">✓ Completed</span>
                      )}

                      {deposit.status === "FAILED" && (
                        <span className="failed-label">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="deposit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">BANK SETTLEMENT</span>
                <h2>Record Bank Deposit</h2>
                <p>
                  Record the cash received by the bank after reconciliation.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            {availableReconciliations.length === 0 && (
              <div className="alert error-alert">
                No eligible reconciliation is available. A reconciliation
                must have status APPROVED or DISCREPANCY and must not already
                be linked to a bank deposit. Fix or complete reconciliation
                first.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="reconciliation">
                  Reconciliation <span>*</span>
                </label>
                <select
                  id="reconciliation"
                  name="reconciliation"
                  value={formData.reconciliation}
                  onChange={handleInputChange}
                  disabled={submitting || availableReconciliations.length === 0}
                  required
                >
                  <option value="">Select reconciliation</option>
                  {availableReconciliations.map((reconciliation) => (
                    <option key={reconciliation.id} value={reconciliation.id}>
                      Reconciliation #{reconciliation.id} —{" "}
                      {formatAmount(reconciliation.received_amount)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReconciliation && (
                <div className="reconciliation-summary">
                  <div>
                    <span>Expected</span>
                    <strong>
                      {formatAmount(selectedReconciliation.expected_amount)}
                    </strong>
                  </div>
                  <div>
                    <span>Received</span>
                    <strong>
                      {formatAmount(selectedReconciliation.received_amount)}
                    </strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{selectedReconciliation.status}</strong>
                  </div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bank_name">
                    Bank Name <span>*</span>
                  </label>
                  <input
                    id="bank_name"
                    name="bank_name"
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deposit_amount">
                    Deposit Amount <span>*</span>
                  </label>
                  <input
                    id="deposit_amount"
                    name="deposit_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deposit_amount}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  />
                  <small>Must match the reconciled received amount.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="deposit_date">
                    Deposit Date <span>*</span>
                  </label>
                  <input
                    id="deposit_date"
                    name="deposit_date"
                    type="date"
                    value={formData.deposit_date}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bank_reference">
                    Bank Reference <span>*</span>
                  </label>
                  <input
                    id="bank_reference"
                    name="bank_reference"
                    type="text"
                    placeholder="e.g. HDFC-DEP-20261008"
                    value={formData.bank_reference}
                    onChange={handleInputChange}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  rows="3"
                  placeholder="Optional deposit remarks..."
                  value={formData.remarks}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting || availableReconciliations.length === 0}
                >
                  {submitting ? "Recording..." : "Record Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankDeposits;