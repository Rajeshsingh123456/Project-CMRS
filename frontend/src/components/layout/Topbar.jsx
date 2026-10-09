import { useLocation, useNavigate } from "react-router-dom";

import "./Topbar.css";

function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const pageInfo = {
    "/dashboard": {
      title: "Dashboard",
      description:
        "Overview of your cash management operations",
    },

    "/customers": {
      title: "Customers",
      description:
        "Manage customer records and account information",
    },

    "/loans": {
      title: "Loans",
      description:
        "Manage customer loans and repayment information",
    },

    "/collections": {
      title: "Cash Collections",
      description:
        "Record and monitor customer cash collections",
    },

    "/submissions": {
      title: "Cash Submissions",
      description:
        "Track agent cash submissions to branches",
    },

    "/reconciliation": {
      title: "Reconciliation",
      description:
        "Review and reconcile submitted cash",
    },

    "/deposits": {
      title: "Bank Deposits",
      description:
        "Track bank deposits and settlement status",
    },

    "/reports": {
      title: "Reports",
      description:
        "View operational and financial reports",
    },
  };

  const currentPage =
    pageInfo[location.pathname] || pageInfo["/dashboard"];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const getRoleName = (role) => {
    if (role === "ADMIN") {
      return "Administrator";
    }

    if (role === "BRANCH_MANAGER") {
      return "Branch Manager";
    }

    if (role === "AGENT") {
      return "Collection Agent";
    }

    return "User";
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h2>{currentPage.title}</h2>

          <p>
            {currentPage.description}
          </p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-status">
          <span className="status-dot"></span>
          System Online
        </div>

        <div className="topbar-divider"></div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user.username
              ? user.username.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="topbar-user-info">
            <strong>
              {user.username || "User"}
            </strong>

            <span>
              {getRoleName(user.role)}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="topbar-logout"
          onClick={handleLogout}
          title="Logout"
        >
          ↪
        </button>
      </div>
    </header>
  );
}

export default Topbar;