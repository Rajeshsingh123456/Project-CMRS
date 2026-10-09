import { NavLink, useNavigate } from "react-router-dom";

import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Customers",
      path: "/customers",
    },
    {
      label: "Loans",
      path: "/loans",
    },
    {
      label: "Cash Collections",
      path: "/collections",
    },
    {
      label: "Cash Submissions",
      path: "/submissions",
    },
    {
      label: "Reconciliation",
      path: "/reconciliation",
    },
    {
      label: "Bank Deposits",
      path: "/deposits",
    },
    {
      label: "Reports",
      path: "/reports",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          CM
        </div>

        <div>
          <h1>CMRS</h1>
          <p>Cash Management</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-title">
          MAIN MENU
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-link-icon">
              {item.label.charAt(0)}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.username
              ? user.username.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user.username || "User"}
            </strong>

            <span>
              {user.role || "User"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;