
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import "./Customers.css";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  branch: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canManage = ["ADMIN", "BRANCH_MANAGER"].includes(user.role);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await apiRequest(
        `/customers/${search ? `?search=${encodeURIComponent(search)}` : ""}`
      );
      setCustomers(Array.isArray(data) ? data : data.results || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBranches() {
    try {
      const data = await apiRequest("/branches/");
      setBranches(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function startAdd() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      branch: user.branch || "",
    });
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      branch: String(customer.branch || ""),
    });
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        branch: Number(form.branch),
      };

      if (!payload.branch) {
        throw new Error("Please select a branch.");
      }

      await apiRequest(
        editingId ? `/customers/${editingId}/` : "/customers/",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setShowForm(false);
      setForm(emptyForm);
      setMessage(editingId ? "Customer updated successfully." : "Customer added successfully.");
      await loadCustomers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer) {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;

    setError("");
    setMessage("");

    try {
      await apiRequest(`/customers/${customer.id}/`, {
        method: "DELETE",
      });
      setMessage("Customer deleted successfully.");
      await loadCustomers();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="customers-page">
      <header className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage customer records and branch information.</p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={startAdd}>
            + Add Customer
          </button>
        )}
      </header>

      {message && <div className="customer-message success">{message}</div>}
      {error && <div className="customer-message error">{error}</div>}

      {showForm && canManage && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>

          <div className="customer-form-grid">
            <label>
              Full name *
              <input
                required
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Phone *
              <input
                required
                maxLength={15}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label>
              Branch *
              <select
                required
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.code ? `(${branch.code})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="customer-address">
              Address *
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
          </div>

          <div className="customer-form-actions">
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      )}

      <section className="customers-toolbar">
        <input
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{customers.length} customer(s)</span>
      </section>

      <section className="customers-table-card">
        {loading ? (
          <p className="customers-state">Loading customers...</p>
        ) : (
          <div className="customers-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Address</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="customers-state">
                      No customers found.
                    </td>
                  </tr>
                ) : customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <small>Customer #{customer.id}</small>
                    </td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || "—"}</td>
                    <td>{customer.branch_name || `Branch #${customer.branch}`}</td>
                    <td>{customer.address || "—"}</td>
                    {canManage && (
                      <td className="customer-actions">
                        <button type="button" onClick={() => startEdit(customer)}>Edit</button>
                        <button type="button" className="delete-action" onClick={() => handleDelete(customer)}>Delete</button>
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

export default Customers;