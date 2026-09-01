import React, { useState, useEffect } from "react";
import {
  FaUserTie,
  FaUserCheck,
  FaUserTimes,
  FaShieldAlt,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaKey,
  FaLock,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaChevronRight,
  FaArrowUp,
  FaSyncAlt,
  FaIdBadge
} from "react-icons/fa";
import Swal from "sweetalert2";
import Modal from "../../components/Modal";
import { TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import { useTranslation } from "../../context/LanguageContext";
import {
  StaffApi,
  createStaffApi,
  updateStaffApi,
  deleteStaffApi,
  RolesApi,
  adminChangeUserPasswordApi
} from "../../services/customerService";
import "./style/StaffPage.css";

function StaffPage() {
  const { can } = usePermissions();
  const { isKhmer } = useTranslation();

  const [staffList, setStaffList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Forms
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role_id: "",
    is_active: true
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        StaffApi(),
        RolesApi()
      ]);

      const staffArray = staffRes?.data?.users || staffRes?.data || [];
      const rolesArray = rolesRes?.data?.roles || rolesRes?.data || [];

      setStaffList(Array.isArray(staffArray) ? staffArray : []);
      setRoles(Array.isArray(rolesArray) ? rolesArray : []);
    } catch (err) {
      console.warn("Failed to load staff list:", err);
      toastError("Failed to load staff data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchStaffData();
      }
    }, 45000); // refresh every 45s to track online changes
    return () => clearInterval(interval);
  }, []);

  const toastError = (msg) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: msg
    });
  };

  const handleOpenCreate = () => {
    const defaultRole = roles.find(r => r.name !== "customer")?.id || "";
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role_id: defaultRole,
      is_active: true
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toastError("Please fill in Name, Email and Password.");
    }

    try {
      setLoading(true);
      await createStaffApi(form);
      Swal.fire("Created!", "Staff member created successfully.", "success");
      setIsCreateModalOpen(false);
      fetchStaffData();
    } catch (err) {
      toastError(err?.message || "Failed to create staff member.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setForm({
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      password: "",
      role_id: staff.roles?.[0]?.id || staff.role_id || "",
      is_active: staff.is_active !== undefined ? staff.is_active : true
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff?.id) return;

    try {
      setLoading(true);
      await updateStaffApi(selectedStaff.id, form);
      Swal.fire("Updated!", "Staff info updated successfully.", "success");
      setIsEditModalOpen(false);
      fetchStaffData();
    } catch (err) {
      toastError(err?.message || "Failed to update staff info.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = (staff) => {
    setSelectedStaff(staff);
    setIsViewModalOpen(true);
  };

  const handleOpenPassword = (staff) => {
    setSelectedStaff(staff);
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      return toastError("Password must be at least 6 characters long.");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toastError("Passwords do not match.");
    }

    try {
      setLoading(true);
      await adminChangeUserPasswordApi(selectedStaff.id, passwordForm.newPassword);
      Swal.fire("Success!", `Password changed for ${selectedStaff.name}.`, "success");
      setIsPasswordModalOpen(false);
    } catch (err) {
      toastError(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = (staff) => {
    Swal.fire({
      title: `Delete Staff ${staff.name}?`,
      text: "This staff account will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Cancel"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          setLoading(true);
          await deleteStaffApi(staff.id);
          Swal.fire("Deleted!", "Staff member removed.", "success");
          fetchStaffData();
        } catch (err) {
          toastError(err?.message || "Failed to delete staff member.");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Helper for role pill styling
  const getRoleBadgeClass = (roleName = "") => {
    const lower = String(roleName).toLowerCase();
    if (lower.includes("admin") || lower.includes("super")) return "admin";
    if (lower.includes("manager")) return "manager";
    if (lower.includes("cashier")) return "cashier";
    if (lower.includes("inventory")) return "inventory";
    return "staff";
  };

  // Filter staff
  const filteredStaff = staffList.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase()) ||
      item.phone?.toLowerCase().includes(search.toLowerCase()) ||
      (item.roles || []).some(r => r.name?.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      roleFilter === "all" ||
      (item.roles || []).some(r => String(r.id) === String(roleFilter) || r.name === roleFilter);

    if (statusFilter === "online") return matchesSearch && matchesRole && item.is_online;
    if (statusFilter === "active") return matchesSearch && matchesRole && item.is_active;
    if (statusFilter === "inactive") return matchesSearch && matchesRole && !item.is_active;

    return matchesSearch && matchesRole;
  });

  // KPI Calculations
  const totalStaffCount = staffList.length;
  const onlineStaffCount = staffList.filter(s => s.is_online).length;
  const activeStaffCount = staffList.filter(s => s.is_active).length;
  const adminManagerCount = staffList.filter(s =>
    (s.roles || []).some(r =>
      r.name?.toLowerCase().includes("admin") || r.name?.toLowerCase().includes("manager")
    )
  ).length;

  if (!can("staff", "view") && !can("customers", "view")) {
    return <AccessDeniedView moduleName="Staff & Administration Directory" />;
  }

  return (
    <div className="staff-page">
      {/* KPI Stats Grid */}
      <div className="staff-stats-grid">
        {/* Total Staff */}
        <div
          className={`staff-stat-card ${statusFilter === "all" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter("all")}
          role="button"
          tabIndex={0}
        >
          <div className="staff-stat-card-header">
            <div className="staff-stat-icon-wrapper blue-bg">
              <FaUserTie />
            </div>
            <span className="growth-tag positive"><FaArrowUp /> All Staff</span>
          </div>
          <div className="staff-stat-card-body">
            <h4>{isKhmer ? "បុគ្គលិកសរុប" : "Total Staff"}</h4>
            <h2 className="staff-stat-value">{totalStaffCount}</h2>
            <div className="staff-stat-footer-row">
              <small>{isKhmer ? "គណនីបុគ្គលិកទាំងអស់" : "Registered staff accounts"}</small>
              <FaChevronRight size={11} />
            </div>
          </div>
        </div>

        {/* Online Now */}
        <div
          className={`staff-stat-card ${statusFilter === "online" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "online" ? "all" : "online")}
          role="button"
          tabIndex={0}
        >
          <div className="staff-stat-card-header">
            <div className="staff-stat-icon-wrapper green-bg">
              <FaUserCheck />
            </div>
            <span className="growth-tag positive">● {onlineStaffCount} Online</span>
          </div>
          <div className="staff-stat-card-body">
            <h4>{isKhmer ? "កំពុង Online ឥឡូវនេះ" : "Online Staff Now"}</h4>
            <h2 className="staff-stat-value" style={{ color: "#10b981" }}>{onlineStaffCount}</h2>
            <div className="staff-stat-footer-row">
              <small>{isKhmer ? "សកម្មក្នុងរយៈពេល ២ នាទី" : "Active in last 2 mins"}</small>
              <FaChevronRight size={11} />
            </div>
          </div>
        </div>

        {/* Active Accounts */}
        <div
          className={`staff-stat-card ${statusFilter === "active" ? "active-kpi" : ""}`}
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
          role="button"
          tabIndex={0}
        >
          <div className="staff-stat-card-header">
            <div className="staff-stat-icon-wrapper purple-bg">
              <FaCheckCircle />
            </div>
            <span className="growth-tag positive">
              {totalStaffCount > 0 ? Math.round((activeStaffCount / totalStaffCount) * 100) : 100}%
            </span>
          </div>
          <div className="staff-stat-card-body">
            <h4>{isKhmer ? "គណនីមានសុពលភាព" : "Active Status"}</h4>
            <h2 className="staff-stat-value">{activeStaffCount}</h2>
            <div className="staff-stat-footer-row">
              <small>{isKhmer ? "អាចចូលប្រើប្រាស់បាន" : "Authorized to access panel"}</small>
              <FaChevronRight size={11} />
            </div>
          </div>
        </div>

        {/* Admins & Managers */}
        <div
          className="staff-stat-card"
          onClick={() => {
            setRoleFilter("all");
            setStatusFilter("all");
          }}
          role="button"
          tabIndex={0}
        >
          <div className="staff-stat-card-header">
            <div className="staff-stat-icon-wrapper amber-bg">
              <FaShieldAlt />
            </div>
            <span className="growth-tag positive"><FaIdBadge /> Management</span>
          </div>
          <div className="staff-stat-card-body">
            <h4>{isKhmer ? "ថ្នាក់គ្រប់គ្រង (Admins)" : "Managers & Admins"}</h4>
            <h2 className="staff-stat-value">{adminManagerCount}</h2>
            <div className="staff-stat-footer-row">
              <small>{isKhmer ? "សិទ្ធិគ្រប់គ្រងជាន់ខ្ពស់" : "Supervisors & Admins"}</small>
              <FaChevronRight size={11} />
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="staff-page-header">
        <div>
          <h1>{isKhmer ? "ព័ត៌មាន និងបញ្ជីបុគ្គលិក" : "Staff Directory & Info"}</h1>
          <p>{isKhmer ? "គ្រប់គ្រងបុគ្គលិក សិទ្ធិប្រើប្រាស់ និងតាមដានវត្តមាន Online ជាក់ស្តែង" : "Manage team members, roles, permissions and monitor real-time online presence"}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn-add-staff"
            style={{ background: "#475569" }}
            onClick={fetchStaffData}
            title="Refresh list"
          >
            <FaSyncAlt /> {isKhmer ? "ផ្ទុកឡើងវិញ" : "Refresh"}
          </button>
          <button
            type="button"
            className="btn-add-staff"
            onClick={handleOpenCreate}
          >
            <FaPlus /> {isKhmer ? "បន្ថែមបុគ្គលិកថ្មី" : "Add New Staff"}
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="staff-main-card">
        {/* Toolbar & Filters */}
        <div className="staff-toolbar">
          <div className="staff-search-box">
            <FaSearch color="#94a3b8" />
            <input
              type="text"
              placeholder={isKhmer ? "ស្វែងរកឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ..." : "Search staff by name, email, phone..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="staff-filter-controls">
            {/* Filter by Role */}
            <select
              className="staff-select-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">{isKhmer ? "គ្រប់តួនាទីទាំងអស់ (All Roles)" : "All Roles"}</option>
              {roles.filter(r => r.name !== "customer").map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Filter by Presence */}
            <select
              className="staff-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{isKhmer ? "ស្ថានភាពទាំងអស់ (All Status)" : "All Presence"}</option>
              <option value="online">🟢 {isKhmer ? "កំពុង Online ឥឡូវនេះ" : "Online Now"}</option>
              <option value="active">✓ {isKhmer ? "គណនីសកម្ម (Active)" : "Active Accounts"}</option>
              <option value="inactive">✕ {isKhmer ? "គណនីផ្អាក (Inactive)" : "Inactive / Locked"}</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        {loading && staffList.length === 0 ? (
          <div style={{ padding: 20 }}>
            <TableSkeleton rows={5} cols={6} hasAvatar={true} />
          </div>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isKhmer ? "ព័ត៌មានបុគ្គលិក" : "Staff Member"}</th>
                  <th>{isKhmer ? "អ៊ីមែល & ទូរស័ព្ទ" : "Contact"}</th>
                  <th>{isKhmer ? "តួនាទី" : "Assigned Role"}</th>
                  <th>{isKhmer ? "វត្តមានជាក់ស្តែង" : "Live Presence"}</th>
                  <th>{isKhmer ? "ស្ថានភាពគណនី" : "Account"}</th>
                  <th style={{ textAlign: "right" }}>{isKhmer ? "សកម្មភាព" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff, index) => {
                  const roleName = staff.roles?.[0]?.name || staff.role || "Staff";
                  return (
                    <tr key={staff.id}>
                      <td><strong>{index + 1}</strong></td>
                      <td>
                        <div className="staff-profile-cell">
                          <div className="staff-avatar-box">
                            <FaUserTie />
                            <span
                              className={`presence-dot-bubble ${staff.is_online ? "online" : "offline"}`}
                              title={staff.is_online ? "Active Now (Online)" : "Offline"}
                            />
                          </div>
                          <div className="staff-name-wrap">
                            <strong>{staff.name}</strong>
                            <small>{staff.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.85rem" }}>
                          <span><FaPhone size={11} color="#64748b" /> {staff.phone || "N/A"}</span>
                          <span style={{ color: "#64748b" }}><FaEnvelope size={11} /> {staff.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`staff-role-pill ${getRoleBadgeClass(roleName)}`}>
                          <FaShieldAlt size={10} /> {roleName}
                        </span>
                      </td>
                      <td>
                        <span className={`staff-presence-pill ${staff.is_online ? "online" : "offline"}`}>
                          <span className="staff-presence-dot" />
                          {staff.is_online ? (isKhmer ? "Online ឥឡូវនេះ" : "Online Now") : (isKhmer ? "Offline" : "Offline")}
                        </span>
                      </td>
                      <td>
                        <span className={`staff-account-badge ${staff.is_active ? "active" : "inactive"}`}>
                          {staff.is_active ? (isKhmer ? "សកម្ម" : "Active") : (isKhmer ? "ផ្អាក" : "Inactive")}
                        </span>
                      </td>
                      <td>
                        <div className="staff-row-actions" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="staff-action-btn view"
                            onClick={() => handleOpenView(staff)}
                            title="View Staff Profile Info"
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            className="staff-action-btn password"
                            onClick={() => handleOpenPassword(staff)}
                            title="Change Password"
                          >
                            <FaKey />
                          </button>
                          <button
                            type="button"
                            className="staff-action-btn edit"
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Staff Member"
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="staff-action-btn delete"
                            onClick={() => handleDeleteStaff(staff)}
                            title="Delete Staff Member"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      {isKhmer ? "រកមិនឃើញព័ត៌មានបុគ្គលិកនោះទេ" : "No staff members found matching your search or filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Kanban Cards */}
        <div className="staff-mobile-cards">
          {filteredStaff.map((staff) => {
            const roleName = staff.roles?.[0]?.name || staff.role || "Staff";
            return (
              <div key={staff.id} className="staff-kanban-card">
                <div className="staff-card-header-row">
                  <div className="staff-profile-cell">
                    <div className="staff-avatar-box">
                      <FaUserTie />
                      <span
                        className={`presence-dot-bubble ${staff.is_online ? "online" : "offline"}`}
                        title={staff.is_online ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="staff-name-wrap">
                      <strong>{staff.name}</strong>
                      <span className={`staff-role-pill ${getRoleBadgeClass(roleName)}`}>
                        {roleName}
                      </span>
                    </div>
                  </div>
                  <span className={`staff-presence-pill ${staff.is_online ? "online" : "offline"}`}>
                    <span className="staff-presence-dot" />
                    {staff.is_online ? "Online" : "Offline"}
                  </span>
                </div>

                <div className="staff-card-body-row">
                  <div><strong>Email:</strong> {staff.email}</div>
                  <div><strong>Phone:</strong> {staff.phone || "N/A"}</div>
                </div>

                <div className="staff-card-actions-row">
                  <button type="button" onClick={() => handleOpenView(staff)}>
                    <FaEye color="#2563eb" /> Info
                  </button>
                  <button type="button" onClick={() => handleOpenPassword(staff)}>
                    <FaKey color="#d97706" /> Key
                  </button>
                  <button type="button" onClick={() => handleOpenEdit(staff)}>
                    <FaEdit color="#10b981" /> Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteStaff(staff)}>
                    <FaTrash color="#ef4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. Modal: Create New Staff */}
      {isCreateModalOpen && (
        <Modal
          title={isKhmer ? "បន្ថែមបុគ្គលិកថ្មី" : "Add New Staff Member"}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        >
          <form onSubmit={handleCreateSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Srun Borath"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                placeholder="staff@angkor-mall.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                required
                placeholder="012 345 678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Login Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Assign Role *</label>
              <select
                required
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              >
                {roles.filter(r => r.name !== "customer").map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.toUpperCase()} {r.description ? `(${r.description})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer-btn" style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-add-staff"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? "Creating..." : "Save Staff Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. Modal: Edit Staff */}
      {isEditModalOpen && selectedStaff && (
        <Modal
          title={isKhmer ? "កែប្រែព័ត៌មានបុគ្គលិក" : `Edit Staff: ${selectedStaff.name}`}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              >
                {roles.filter(r => r.name !== "customer").map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select
                value={form.is_active ? "true" : "false"}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}
              >
                <option value="true">Active (Authorized to login)</option>
                <option value="false">Inactive (Account Locked)</option>
              </select>
            </div>

            <div className="modal-footer-btn" style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-add-staff"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? "Saving..." : "Update Staff Info"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. Modal: View Staff Profile & Live Info */}
      {isViewModalOpen && selectedStaff && (
        <Modal
          title={isKhmer ? "ព័ត៌មានលម្អិតអំពីបុគ្គលិក" : "Staff Profile & Live Info"}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        >
          <div className="staff-detail-card">
            <div className="staff-detail-header">
              <div className="staff-detail-avatar">
                <FaUserTie />
                <span
                  className={`presence-dot-bubble ${selectedStaff.is_online ? "online" : "offline"}`}
                  title={selectedStaff.is_online ? "Online Now" : "Offline"}
                />
              </div>
              <div className="staff-detail-title">
                <h3>{selectedStaff.name}</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <span className={`staff-role-pill ${getRoleBadgeClass(selectedStaff.roles?.[0]?.name || selectedStaff.role)}`}>
                    <FaShieldAlt size={10} /> {selectedStaff.roles?.[0]?.name || selectedStaff.role || "Staff"}
                  </span>
                  <span className={`staff-presence-pill ${selectedStaff.is_online ? "online" : "offline"}`}>
                    <span className="staff-presence-dot" />
                    {selectedStaff.is_online ? "🟢 Active Online" : "⚪ Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="staff-detail-grid">
              <div className="staff-detail-field">
                <label>Email Address</label>
                <span>{selectedStaff.email}</span>
              </div>

              <div className="staff-detail-field">
                <label>Phone Number</label>
                <span>{selectedStaff.phone || "N/A"}</span>
              </div>

              <div className="staff-detail-field">
                <label>Account Status</label>
                <span>{selectedStaff.is_active ? "✅ Active / Authorized" : "❌ Suspended / Inactive"}</span>
              </div>

              <div className="staff-detail-field">
                <label>2FA Security</label>
                <span>{selectedStaff.two_fa_enabled ? "🔒 2FA Enabled" : "🔓 Standard"}</span>
              </div>

              <div className="staff-detail-field">
                <label>Joined Date</label>
                <span>
                  {selectedStaff.created_at || selectedStaff.createdAt
                    ? new Date(selectedStaff.created_at || selectedStaff.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>

              <div className="staff-detail-field">
                <label>Staff ID</label>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>
                  {selectedStaff.id}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Modal: Admin Change Password */}
      {isPasswordModalOpen && selectedStaff && (
        <Modal
          title={isKhmer ? "ប្តូរពាក្យសម្ងាត់បុគ្គលិក" : `Change Password: ${selectedStaff.name}`}
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        >
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="modal-footer-btn" style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-add-staff"
                style={{ width: "100%", justifyContent: "center", background: "#d97706" }}
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default StaffPage;
