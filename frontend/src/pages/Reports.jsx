
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import "./Reports.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getDate = (item) =>
  item.collection_date ||
  item.submission_date ||
  item.reconciled_at ||
  item.deposit_date ||
  item.created_at ||
  "";

const isWithinDates = (item, startDate, endDate) => {
  const date = getDate(item);
  if (!date) return true;

  const day = String(date).slice(0, 10);

  if (startDate && day < startDate) return false;
  if (endDate && day > endDate) return false;

  return true;
};

const sum = (items, fields) => {
  const keys = Array.isArray(fields) ? fields : [fields];

  return items.reduce((total, item) => {
    const field = keys.find(
      (key) => item?.[key] !== null && item?.[key] !== undefined
    );

    return total + (field ? Number(item[field]) || 0 : 0);
  }, 0);
};

const getAgentName = (item) =>
  item.agent_username ||
  item.agent_name ||
  item.agent?.username ||
  "-";

const getStatusClass = (status) =>
  String(status || "UNKNOWN")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

const getDepositReference = (item) =>
  item.bank_reference ||
  item.bank_reference_number ||
  item.deposit_reference ||
  item.deposit_number ||
  item.reference_number ||
  item.reference ||
  item.transaction_reference ||
  "-";

const getDepositAmount = (item) =>
  item.deposit_amount ?? item.amount ?? item.deposited_amount ?? 0;

const getDepositDate = (item) =>
  item.deposit_date || item.created_at || "";

function Reports() {
  const user = useMemo(() => getStoredUser(), []);
  const role = String(user?.role || "").toUpperCase();

  const isAdmin = role === "ADMIN";
  const isManager = role === "BRANCH_MANAGER";
  const isAgent = role === "AGENT";
  const canViewFinancialReports = isAdmin || isManager;

  const [collections, setCollections] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [deposits, setDeposits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchReportsData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      if (!user || !role) {
        setError("Your login session was not found. Please log in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const endpoints = [
        {
          name: "Collections",
          url: "/cash-collections/",
          setter: setCollections,
        },
        {
          name: "Cash submissions",
          url: "/cash-submissions/",
          setter: setSubmissions,
        },
      ];

      if (canViewFinancialReports) {
        endpoints.push(
          {
            name: "Reconciliations",
            url: "/reconciliations/",
            setter: setReconciliations,
          },
          {
            name: "Bank deposits",
            url: "/bank-deposits/",
            setter: setDeposits,
          }
        );
      } else {
        setReconciliations([]);
        setDeposits([]);
      }

      try {
        const results = await Promise.allSettled(
          endpoints.map((endpoint) => apiRequest(endpoint.url))
        );

        const failures = [];

        results.forEach((result, index) => {
          const endpoint = endpoints[index];

          if (result.status === "fulfilled") {
            endpoint.setter(toArray(result.value));
          } else {
            endpoint.setter([]);
            failures.push(
              `${endpoint.name}: ${
                result.reason?.message || "Request failed"
              }`
            );
          }
        });

        if (failures.length) {
          setError(
            `Some report data could not be loaded. ${failures.join(" | ")}`
          );
          setLastUpdated("");
        } else {
          setLastUpdated(new Date().toLocaleString("en-IN"));
        }
      } catch (err) {
        setError(err?.message || "Unable to load report data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, role, canViewFinancialReports]
  );

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const filteredCollections = useMemo(
    () =>
      collections.filter((item) =>
        isWithinDates(item, startDate, endDate)
      ),
    [collections, startDate, endDate]
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((item) =>
        isWithinDates(item, startDate, endDate)
      ),
    [submissions, startDate, endDate]
  );

  const filteredReconciliations = useMemo(
    () =>
      reconciliations.filter((item) =>
        isWithinDates(item, startDate, endDate)
      ),
    [reconciliations, startDate, endDate]
  );

  const filteredDeposits = useMemo(
    () =>
      deposits.filter((item) =>
        isWithinDates(item, startDate, endDate)
      ),
    [deposits, startDate, endDate]
  );

  const collectedAmount = sum(filteredCollections, "amount");
  const submittedAmount = sum(filteredSubmissions, "submitted_amount");
  const reconciledAmount = sum(filteredReconciliations, "received_amount");
  const discrepancyAmount = sum(
    filteredReconciliations,
    "discrepancy_amount"
  );
  const depositAmount = sum(filteredDeposits, [
    "deposit_amount",
    "amount",
    "deposited_amount",
  ]);

  const pendingSubmissions = filteredSubmissions.filter(
    (item) => String(item.status || "").toUpperCase() === "SUBMITTED"
  ).length;

  const pendingReconciliations = filteredSubmissions.filter(
    (item) => String(item.status || "").toUpperCase() === "SUBMITTED"
  ).length;

  const settledAmount = sum(
    filteredDeposits.filter(
      (item) => String(item.status || "").toUpperCase() === "SETTLED"
    ),
    ["deposit_amount", "amount", "deposited_amount"]
  );

  const handleStartDate = (value) => {
    setStartDate(value);
    setDateError(
      value && endDate && value > endDate
        ? "Start date cannot be after the end date."
        : ""
    );
  };

  const handleEndDate = (value) => {
    setEndDate(value);
    setDateError(
      startDate && value && startDate > value
        ? "End date cannot be before the start date."
        : ""
    );
  };

  const resetDates = () => {
    setStartDate("");
    setEndDate("");
    setDateError("");
  };

  if (loading) {
    return (
      <main className="reports-page">
        <div className="reports-loading">
          <div className="reports-spinner" />
          <p>Loading reports...</p>
        </div>
      </main>
    );
  }

  if (!user || !role) {
    return (
      <main className="reports-page">
        <section className="reports-message reports-error">
          <h2>Login required</h2>
          <p>{error || "Please log in to view reports."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div>
          <p className="reports-eyebrow">CASH MANAGEMENT SYSTEM</p>
          <h1>Reports &amp; Analytics</h1>
          <p className="reports-subtitle">
            Review collections, cash submissions and reconciliation activity.
          </p>
          <span className="reports-role">
            {isAdmin
              ? "Administrator"
              : isManager
              ? "Branch Manager"
              : isAgent
              ? "Collection Agent"
              : role}
          </span>
        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={() => fetchReportsData(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <section className="reports-message reports-error" role="alert">
          <strong>Some data could not be loaded</strong>
          <p>{error}</p>
          <p>
            Check the failed API endpoint and your permissions. Missing data
            should not be interpreted as a genuine zero balance.
          </p>
        </section>
      )}

      {lastUpdated && (
        <p className="reports-updated">Last updated: {lastUpdated}</p>
      )}

      <section className="reports-filters">
        <div className="reports-filter-field">
          <label htmlFor="reports-start-date">From date</label>
          <input
            id="reports-start-date"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => handleStartDate(event.target.value)}
          />
        </div>

        <div className="reports-filter-field">
          <label htmlFor="reports-end-date">To date</label>
          <input
            id="reports-end-date"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => handleEndDate(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="reports-reset"
          onClick={resetDates}
        >
          Clear dates
        </button>
      </section>

      {dateError && (
        <p className="reports-date-error" role="alert">
          {dateError}
        </p>
      )}

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Financial overview</h2>
            <p>Summary for the selected date range.</p>
          </div>
        </div>

        <div className="reports-metrics">
          <article className="reports-metric">
            <span className="reports-metric-icon">₹</span>
            <p>Total Collections</p>
            <h3>{money(collectedAmount)}</h3>
            <small>{filteredCollections.length} collection records</small>
          </article>

          <article className="reports-metric">
            <span className="reports-metric-icon">⇧</span>
            <p>Cash Submitted</p>
            <h3>{money(submittedAmount)}</h3>
            <small>{filteredSubmissions.length} submissions</small>
          </article>

          {canViewFinancialReports && (
            <>
              <article className="reports-metric">
                <span className="reports-metric-icon">✓</span>
                <p>Amount Reconciled</p>
                <h3>{money(reconciledAmount)}</h3>
                <small>
                  {filteredReconciliations.length} reconciliation records
                </small>
              </article>

              <article className="reports-metric">
                <span className="reports-metric-icon">!</span>
                <p>Discrepancy Amount</p>
                <h3>{money(discrepancyAmount)}</h3>
                <small>Expected versus received</small>
              </article>

              <article className="reports-metric">
                <span className="reports-metric-icon">▤</span>
                <p>Total Bank Deposits</p>
                <h3>{money(depositAmount)}</h3>
                <small>{filteredDeposits.length} deposit records</small>
              </article>

              <article className="reports-metric">
                <span className="reports-metric-icon">✓</span>
                <p>Settled Amount</p>
                <h3>{money(settledAmount)}</h3>
                <small>Deposits marked settled</small>
              </article>
            </>
          )}

          <article className="reports-metric">
            <span className="reports-metric-icon">◷</span>
            <p>Pending Submissions</p>
            <h3>{pendingSubmissions}</h3>
            <small>Awaiting manager review</small>
          </article>

          {canViewFinancialReports && (
            <article className="reports-metric">
              <span className="reports-metric-icon">⌛</span>
              <p>Pending Reconciliation</p>
              <h3>{pendingReconciliations}</h3>
              <small>Submissions awaiting reconciliation</small>
            </article>
          )}
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Recent Cash Collections</h2>
            <p>Collection records visible to your account.</p>
          </div>
          <span className="reports-count">
            {filteredCollections.length} records
          </span>
        </div>

        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Customer</th>
                <th>Loan No.</th>
                <th>Agent</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.length ? (
                filteredCollections.map((item) => (
                  <tr key={item.id || item.receipt_number}>
                    <td className="reports-reference">
                      {item.receipt_number || `#${item.id}`}
                    </td>
                    <td>{item.customer_name || item.customer?.name || "-"}</td>
                    <td>
                      {item.loan_number || item.loan?.loan_number || "-"}
                    </td>
                    <td>{getAgentName(item)}</td>
                    <td className="reports-amount">{money(item.amount)}</td>
                    <td>
                      {item.collection_date
                        ? String(item.collection_date).slice(0, 10)
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`reports-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="reports-empty">
                    No collections found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Cash Submissions</h2>
            <p>Cash handed over by collection agents.</p>
          </div>
          <span className="reports-count">
            {filteredSubmissions.length} records
          </span>
        </div>

        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Submission No.</th>
                <th>Agent</th>
                <th>Branch</th>
                <th>Expected</th>
                <th>Submitted</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length ? (
                filteredSubmissions.map((item) => (
                  <tr key={item.id || item.submission_number}>
                    <td className="reports-reference">
                      {item.submission_number || "-"}
                    </td>
                    <td>{getAgentName(item)}</td>
                    <td>{item.branch_name || item.branch?.name || "-"}</td>
                    <td>{money(item.expected_amount)}</td>
                    <td>{money(item.submitted_amount)}</td>
                    <td>
                      {item.submission_date
                        ? String(item.submission_date).slice(0, 10)
                        : "-"}
                    </td>
                    <td>
                      <span
                        className={`reports-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="reports-empty">
                    No cash submissions found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canViewFinancialReports && (
        <>
          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>Reconciliation History</h2>
                <p>Branch cash verification results.</p>
              </div>
              <span className="reports-count">
                {filteredReconciliations.length} records
              </span>
            </div>

            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Submission No.</th>
                    <th>Agent</th>
                    <th>Expected</th>
                    <th>Received</th>
                    <th>Difference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReconciliations.length ? (
                    filteredReconciliations.map((item) => (
                      <tr key={item.id}>
                        <td className="reports-reference">
                          {item.submission_number ||
                            item.cash_submission?.submission_number ||
                            "-"}
                        </td>
                        <td>{getAgentName(item)}</td>
                        <td>{money(item.expected_amount)}</td>
                        <td>{money(item.received_amount)}</td>
                        <td>{money(item.discrepancy_amount)}</td>
                        <td>
                          <span
                            className={`reports-status ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="reports-empty">
                        No reconciliation records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>Bank Deposit History</h2>
                <p>Deposit and settlement records.</p>
              </div>
              <span className="reports-count">
                {filteredDeposits.length} records
              </span>
            </div>

            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Deposit Reference</th>
                    <th>Bank</th>
                    <th>Branch</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeposits.length ? (
                    filteredDeposits.map((item) => (
                      <tr key={item.id || getDepositReference(item)}>
                        <td className="reports-reference">
                          {getDepositReference(item)}
                        </td>
                        <td>
                          {item.bank_name || item.bank?.name || "-"}
                        </td>
                        <td>
                          {item.branch_name || item.branch?.name || "-"}
                        </td>
                        <td>{money(getDepositAmount(item))}</td>
                        <td>
                          {getDepositDate(item)
                            ? String(getDepositDate(item)).slice(0, 10)
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={`reports-status ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="reports-empty">
                        No bank deposits found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default Reports;