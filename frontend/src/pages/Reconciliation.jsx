import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import "./Reconciliation.css";

function Reconciliation() {
  const [reconciliations, setReconciliations] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    cash_submission: "",
    received_amount: "",
    remarks: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loadReconciliations = async () => {
    try {
      const data = await apiRequest("/reconciliations/");
      setReconciliations(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSubmissions = async () => {
    try {
      const data = await apiRequest("/cash-submissions/");
      setSubmissions(data.results || data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    await Promise.all([
      loadReconciliations(),
      loadSubmissions(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSubmissions = submissions.filter(
    (submission) => submission.status === "SUBMITTED"
  );

  const selectedSubmission = availableSubmissions.find(
    (submission) =>
      String(submission.id) === String(form.cash_submission)
  );

  const handleSubmissionChange = (event) => {
    const submissionId = event.target.value;

    const submission = availableSubmissions.find(
      (item) => String(item.id) === String(submissionId)
    );

    setForm({
      ...form,
      cash_submission: submissionId,
      received_amount: submission
        ? Number(submission.expected_amount || 0).toFixed(2)
        : "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.cash_submission) {
      setError("Please select a cash submission.");
      return;
    }

    if (
      form.received_amount === "" ||
      Number(form.received_amount) < 0
    ) {
      setError("Received amount cannot be negative.");
      return;
    }

    if (
      selectedSubmission &&
      Number(form.received_amount) >
        Number(selectedSubmission.expected_amount || 0)
    ) {
      setError(
        "Received amount cannot be greater than expected amount."
      );
      return;
    }

    try {
      setSubmitting(true);

      await apiRequest("/reconciliations/", {
        method: "POST",
        body: JSON.stringify({
          cash_submission: Number(form.cash_submission),
          received_amount: form.received_amount,
          remarks: form.remarks.trim(),
        }),
      });

      setSuccess("Cash reconciliation completed successfully.");

      setShowModal(false);

      setForm({
        cash_submission: "",
        received_amount: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!submitting) {
      setShowModal(false);
      setError("");

      setForm({
        cash_submission: "",
        received_amount: "",
        remarks: "",
      });
    }
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const approvedCount = reconciliations.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const discrepancyCount = reconciliations.filter(
    (item) => item.status === "DISCREPANCY"
  ).length;

  const pendingCount = availableSubmissions.length;

  const totalDiscrepancy = reconciliations.reduce(
    (sum, item) =>
      sum + Number(item.discrepancy_amount || 0),
    0
  );

  return (
    <div className="reconciliation-page">
      <div className="reconciliation-header">
        <div>
          <span className="reconciliation-eyebrow">
            CASH CONTROL
          </span>

          <h1>Reconciliation</h1>

          <p>
            Verify branch cash received against submitted collection amounts.
          </p>
        </div>

        {(user.role === "ADMIN" ||
          user.role === "BRANCH_MANAGER") && (
          <button
            className="reconciliation-primary-action"
            onClick={() => {
              setError("");
              setSuccess("");

              setForm({
                cash_submission: "",
                received_amount: "",
                remarks: "",
              });

              setShowModal(true);
            }}
            disabled={availableSubmissions.length === 0}
          >
            <span>+</span>
            Reconcile Cash
          </button>
        )}
      </div>

      {success && (
        <div className="reconciliation-alert reconciliation-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="reconciliation-alert reconciliation-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="reconciliation-stat-grid">
        <div className="reconciliation-stat-card">
          <div className="reconciliation-stat-icon">◷</div>

          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="reconciliation-stat-icon">✓</div>

          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="reconciliation-stat-icon">!</div>

          <div>
            <span>Discrepancies</span>
            <strong>{discrepancyCount}</strong>
          </div>
        </div>

        <div className="reconciliation-stat-card">
          <div className="reconciliation-stat-icon">₹</div>

          <div>
            <span>Total Discrepancy</span>
            <strong>{formatCurrency(totalDiscrepancy)}</strong>
          </div>
        </div>
      </div>

      <section className="reconciliation-panel">
        <div className="reconciliation-panel-header">
          <div>
            <h2>Reconciliation History</h2>

            <p>
              Review completed branch cash reconciliation records.
            </p>
          </div>

          <button
            className="reconciliation-refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="reconciliation-table-wrapper">
          {loading ? (
            <div className="reconciliation-table-state">
              <div className="reconciliation-spinner"></div>
              <p>Loading reconciliation records...</p>
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="reconciliation-table-state">
              <div className="reconciliation-empty-icon">
                ✓
              </div>

              <h3>No reconciliation records yet</h3>

              <p>
                Completed cash reconciliations will appear here.
              </p>
            </div>
          ) : (
            <table className="reconciliation-table">
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>Agent</th>
                  <th>Branch</th>
                  <th>Expected</th>
                  <th>Received</th>
                  <th>Discrepancy</th>
                  <th>Status</th>
                  <th>Reconciled On</th>
                </tr>
              </thead>

              <tbody>
                {reconciliations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="reconciliation-submission">
                        {item.submission_number || "-"}
                      </strong>
                    </td>

                    <td>
                      <div className="reconciliation-user">
                        <span className="reconciliation-avatar">
                          {(item.agent_username || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {item.agent_username || "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {item.branch_name || "-"}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(item.expected_amount)}
                      </strong>
                    </td>

                    <td>
                      <strong className="received-amount">
                        {formatCurrency(item.received_amount)}
                      </strong>
                    </td>

                    <td>
                      <strong
                        className={
                          Number(item.discrepancy_amount) > 0
                            ? "discrepancy-amount"
                            : "no-discrepancy"
                        }
                      >
                        {formatCurrency(item.discrepancy_amount)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`reconciliation-status reconciliation-status-${String(
                          item.status || ""
                        ).toLowerCase()}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td>
                      {formatDateTime(item.reconciled_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showModal && (
        <div
          className="reconciliation-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="reconciliation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reconciliation-modal-header">
              <div>
                <span className="reconciliation-modal-eyebrow">
                  BRANCH VERIFICATION
                </span>

                <h2>Reconcile Cash</h2>

                <p>
                  Compare submitted cash with the amount actually received.
                </p>
              </div>

              <button
                className="reconciliation-modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="reconciliation-modal-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <div className="reconciliation-form-group">
                <label>Cash Submission</label>

                <select
                  value={form.cash_submission}
                  onChange={handleSubmissionChange}
                >
                  <option value="">
                    Select submitted cash
                  </option>

                  {availableSubmissions.map((submission) => (
                    <option
                      key={submission.id}
                      value={submission.id}
                    >
                      {submission.submission_number}
                      {" — "}
                      {formatCurrency(
                        submission.expected_amount
                      )}
                      {" — "}
                      {submission.agent_username || "Agent"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubmission && (
                <div className="reconciliation-amount-summary">
                  <div>
                    <span>Expected Amount</span>

                    <strong>
                      {formatCurrency(
                        selectedSubmission.expected_amount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Agent</span>

                    <strong>
                      {selectedSubmission.agent_username || "-"}
                    </strong>
                  </div>

                  <div>
                    <span>Branch</span>

                    <strong>
                      {selectedSubmission.branch_name || "-"}
                    </strong>
                  </div>
                </div>
              )}

              <div className="reconciliation-form-group">
                <label>Received Amount</label>

                <div className="reconciliation-money-input">
                  <span>₹</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.received_amount}
                    placeholder="0.00"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        received_amount:
                          event.target.value,
                      })
                    }
                  />
                </div>

                {selectedSubmission &&
                  form.received_amount !== "" && (
                    <small
                      className={
                        Number(form.received_amount) <
                        Number(
                          selectedSubmission.expected_amount
                        )
                          ? "reconciliation-help discrepancy-help"
                          : "reconciliation-help"
                      }
                    >
                      Calculated discrepancy:{" "}
                      <strong>
                        {formatCurrency(
                          Math.max(
                            Number(
                              selectedSubmission.expected_amount ||
                                0
                            ) -
                              Number(
                                form.received_amount || 0
                              ),
                            0
                          )
                        )}
                      </strong>
                    </small>
                  )}
              </div>

              <div className="reconciliation-form-group">
                <label>Remarks</label>

                <textarea
                  rows="4"
                  placeholder="Add remarks if required..."
                  value={form.remarks}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      remarks: event.target.value,
                    })
                  }
                ></textarea>
              </div>

              <div className="reconciliation-note">
                <span>i</span>

                <p>
                  If received amount equals expected amount,
                  the submission will be marked
                  <strong> APPROVED</strong>. If there is a shortfall,
                  the system will automatically mark it as
                  <strong> DISCREPANCY</strong>.
                </p>
              </div>

              <div className="reconciliation-modal-footer">
                <button
                  type="button"
                  className="reconciliation-secondary-action"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="reconciliation-primary-action"
                  disabled={submitting}
                >
                  {submitting
                    ? "Processing..."
                    : "Complete Reconciliation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reconciliation;