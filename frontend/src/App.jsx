import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Loans from "./pages/Loans";
import CashCollections from "./pages/CashCollections";
import CashSubmissions from "./pages/CashSubmissions";
import Reconciliation from "./pages/Reconciliation";
import BankDeposits from "./pages/BankDeposits";
import Reports from "./pages/Reports";

import DashboardLayout from "./components/layout/DashboardLayout";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/loans"
            element={<Loans />}
          />

          <Route
            path="/collections"
            element={<CashCollections />}
          />

          <Route
            path="/submissions"
            element={<CashSubmissions />}
          />

          <Route
            path="/reconciliation"
            element={<Reconciliation />}
          />

          <Route
            path="/deposits"
            element={<BankDeposits />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;