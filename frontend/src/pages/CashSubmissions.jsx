import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import "./CashSubmissions.css";

function CashSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [form, setForm] = useState({
    submission_number: "",
    submission_date: new Date().toISOString().split("T")[0],
  });

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/cash-submissions/");
      setSubmissions(data.results || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const generateSubmissionNumber = () => {
    const year = new Date().getFullYear();
    const randomPart = String(Date.now()).slice(-6);

    return `SUB-${year}-${randomPart}`;
  };

  const openModal = () => {
    setError("");
    setSuccess("");

    setForm({
      submission_number: generateSubmissionNumber(),
      submission_date: new Date().toISOString().split("T")[0],
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (!submitting) {
      setShowModal(false);
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.submission_number.trim()) {
      setError("Submission number is required.");
      return;
    }

    if (!form.submission_date) {
      setError("Submission date is required.");
      return;
    }

    try {
      setSubmitting(true);

      await apiRequest("/cash-submissions/", {
        method: "POST",
        body: JSON.stringify({
          submission_number: form.submission_number.trim(),
          submission_date: form.submission_date,
        }),
      });

      setSuccess("Cash submitted to branch successfully.");
      setShowModal(false);

      await loadSubmissions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

  const totalSubmitted = submissions.reduce(
    (sum, submission) =>
      sum + Number(submission.submitted_amount || 0),
    0
  );

  const pendingCount = submissions.filter(
    (submission) => submission.status === "SUBMITTED"
  ).length;

  const approvedCount = submissions.filter(
    (submission) => submission.status === "APPROVED"
  ).length;

  const discrepancyCount = submissions.filter(
    (submission) => submission.status === "DISCREPANCY"
  ).length;

  return (
    <div className="cash-submissions-page">
      <div className="cash-submissions-header">
        <div>
          <span className="submission-eyebrow">
            CASH HANDOVER
          </span>

          <h1>Cash Submissions</h1>

          <p>
            Submit collected cash to the assigned branch and track submission status.
          </p>
        </div>

        {user.role === "AGENT" && (
          <button
            className="submission-primary-action"
            onClick={openModal}
          >
            <span>+</span>
            Submit Cash
          </button>
        )}
      </div>

      {success && (
        <div className="submission-alert submission-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="submission-alert submission-error">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="submission-stat-grid">
        <div className="submission-stat-card">
          <div className="submission-stat-icon">₹</div>

          <div>
            <span>Total Submitted</span>
            <strong>{formatCurrency(totalSubmitted)}</strong>
          </div>
        </div>

        <div className="submission-stat-card">
          <div className="submission-stat-icon">◷</div>

          <div>
            <span>Pending Reconciliation</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>

        <div className="submission-stat-card">
          <div className="submission-stat-icon">✓</div>

          <div>
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
        </div>

        <div className="submission-stat-card">
          <div className="submission-stat-icon">!</div>

          <div>
            <span>Discrepancies</span>
            <strong>{discrepancyCount}</strong>
          </div>
        </div>
      </div>

      <section className="submissions-panel">
        <div className="submissions-panel-header">
          <div>
            <h2>Submission History</h2>
            <p>
              Track cash handed over from agents to branches.
            </p>
          </div>

          <button
            className="submission-refresh-button"
            onClick={loadSubmissions}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="submission-table-wrapper">
          {loading ? (
            <div className="submission-table-state">
              <div className="submission-spinner"></div>
              <p>Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="submission-table-state submission-empty">
              <div className="submission-empty-icon">₹</div>

              <h3>No cash submissions yet</h3>

              <p>
                Cash submissions will appear here once collected cash is handed over to a branch.
              </p>

              {user.role === "AGENT" && (
                <button
                  className="submission-empty-action"
                  onClick={openModal}
                >
                  Submit Cash
                </button>
              )}
            </div>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>Agent</th>
                  <th>Branch</th>
                  <th>Expected Amount</th>
                  <th>Submitted Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <strong className="submission-number">
                        {submission.submission_number}
                      </strong>
                    </td>

                    <td>
                      <div className="submission-user">
                        <span className="submission-avatar">
                          {(submission.agent_username || "A")
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span>
                          {submission.agent_username || "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {submission.branch_name || "-"}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          submission.expected_amount
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong className="submitted-amount">
                        {formatCurrency(
                          submission.submitted_amount
                        )}
                      </strong>
                    </td>

                    <td>
                      {formatDate(
                        submission.submission_date
                      )}
                    </td>

                    <td>
                      <span
                        className={`submission-status submission-status-${String(
                          submission.status || ""
                        ).toLowerCase()}`}
                      >
                        {submission.status || "SUBMITTED"}
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
        <div
          className="submission-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="submission-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="submission-modal-header">
              <div>
                <span className="submission-modal-eyebrow">
                  BRANCH HANDOVER
                </span>

                <h2>Submit Cash</h2>

                <p>
                  Submit all currently collected cash to your assigned branch.
                </p>
              </div>

              <button
                className="submission-modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="submission-modal-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <div className="submission-info-box">
                <div className="submission-info-icon">
                  ₹
                </div>

                <div>
                  <strong>Automatic cash calculation</strong>

                  <p>
                    The system will automatically calculate all your currently collected cash. You do not need to enter the amount manually.
                  </p>
                </div>
              </div>

              <div className="submission-form-grid">
                <div className="submission-form-group">
                  <label>Submission Number</label>

                  <input
                    type="text"
                    value={form.submission_number}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        submission_number:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="submission-form-group">
                  <label>Submission Date</label>

                  <input
                    type="date"
                    value={form.submission_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        submission_date:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="submission-warning">
                <span>i</span>

                <p>
                  Once submitted, the collected cash will move to the
                  <strong> SUBMITTED </strong>
                  state and become available for branch reconciliation.
                </p>
              </div>

              <div className="submission-modal-footer">
                <button
                  type="button"
                  className="submission-secondary-action"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submission-primary-action"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Confirm Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashSubmissions;