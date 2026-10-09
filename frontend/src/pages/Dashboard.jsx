import { useEffect, useState } from "react";

import { apiRequest } from "../api/client";
import "./Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(
          "/dashboard/"
        );

        setDashboard(data);
      } catch (error) {
        setError(
          error.message ||
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatAmount = (amount) => {
    const value = Number(amount || 0);

    return `₹${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <h1>Good evening</h1>
          <p>
            Here&apos;s an overview of your cash
            management operations.
          </p>
        </div>

        <span className="dashboard-date">
          Today
        </span>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span>Total Collections</span>
          <strong>
            {formatAmount(
              dashboard?.total_collections
            )}
          </strong>
          <small>Collected cash</small>
        </div>

        <div className="stat-card">
          <span>Pending Reconciliation</span>
          <strong>
            {dashboard?.pending_reconciliations || 0}
          </strong>
          <small>Requires attention</small>
        </div>

        <div className="stat-card">
          <span>Bank Deposits</span>
          <strong>
            {formatAmount(
              dashboard?.total_deposits
            )}
          </strong>
          <small>Recorded deposits</small>
        </div>

        <div className="stat-card">
          <span>Discrepancies</span>
          <strong>
            {dashboard?.discrepancies || 0}
          </strong>
          <small>Open cases</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Cash Collection Overview</h2>
              <p>
                Current collection activity
              </p>
            </div>
          </div>

          <div className="dashboard-summary">
            <div>
              <span>Total Collections</span>
              <strong>
                {formatAmount(
                  dashboard?.total_collections
                )}
              </strong>
            </div>

            <div>
              <span>Collections Count</span>
              <strong>
                {dashboard?.collection_count || 0}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Reconciliation Status</h2>
              <p>
                Latest reconciliation overview
              </p>
            </div>
          </div>

          <div className="dashboard-summary">
            <div>
              <span>Pending</span>
              <strong>
                {dashboard?.pending_reconciliations || 0}
              </strong>
            </div>

            <div>
              <span>Discrepancies</span>
              <strong>
                {dashboard?.discrepancies || 0}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;