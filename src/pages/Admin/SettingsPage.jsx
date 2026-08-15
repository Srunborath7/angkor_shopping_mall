import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Store,
  CreditCard,
  Truck,
  Bell,
  Lock,
  Save,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Key,
  Globe,
  Sliders,
  DollarSign,
  Send,
  X
} from "lucide-react";
import Swal from "sweetalert2";
import "./style/SettingsPage.css";

// 1. Initial Permission Modules Configuration
const PERMISSION_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard & Analytics",
    desc: "View business metrics, charts, revenue statistics",
    actions: ["view", "export"]
  },
  {
    id: "products",
    name: "Products & Catalog",
    desc: "Manage item listings, prices, SKU, specs and images",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "flash_sale",
    name: "Flash Sale & Promotions",
    desc: "Create limited-time deals, discount timers and banners",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "orders",
    name: "Orders & Invoicing",
    desc: "Process customer orders, print invoices, refunds",
    actions: ["view", "process", "cancel", "refund"]
  },
  {
    id: "trading",
    name: "Trade-In & Exchange",
    desc: "Review trade-in requests, valuate gadgets, approve payouts",
    actions: ["view", "value", "approve", "reject"]
  },
  {
    id: "inventory",
    name: "Inventory & Warehouses",
    desc: "Track stock quantities, low-stock warnings, adjustments",
    actions: ["view", "adjust", "reorder"]
  },
  {
    id: "suppliers",
    name: "Suppliers & Purchases",
    desc: "Purchase orders, vendor contracts, stock arrivals",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "customers",
    name: "Customers & Accounts",
    desc: "Manage customer profiles, order history, VIP levels",
    actions: ["view", "edit", "ban"]
  },
  {
    id: "settings",
    name: "System Settings & RBAC",
    desc: "Store config, payment keys, security, role permissions",
    actions: ["view", "edit"]
  }
];

// 2. Default Initial Roles
const DEFAULT_ROLES = [
  {
    id: "super_admin",
    name: "Super Administrator",
    type: "super",
    desc: "Unrestricted master access to all system features and configurations.",
    userCount: 2,
    permissions: {
      dashboard: ["view", "export"],
      products: ["view", "create", "edit", "delete"],
      flash_sale: ["view", "create", "edit", "delete"],
      orders: ["view", "process", "cancel", "refund"],
      trading: ["view", "value", "approve", "reject"],
      inventory: ["view", "adjust", "reorder"],
      suppliers: ["view", "create", "edit", "delete"],
      customers: ["view", "edit", "ban"],
      settings: ["view", "edit"]
    }
  },
  {
    id: "mall_manager",
    name: "Mall Manager",
    type: "manager",
    desc: "Oversees daily mall operations, orders, trading, and inventory.",
    userCount: 3,
    permissions: {
      dashboard: ["view", "export"],
      products: ["view", "create", "edit"],
      flash_sale: ["view", "create", "edit"],
      orders: ["view", "process", "cancel"],
      trading: ["view", "value", "approve"],
      inventory: ["view", "adjust", "reorder"],
      suppliers: ["view", "create"],
      customers: ["view", "edit"],
      settings: ["view"]
    }
  },
  {
    id: "orders_specialist",
    name: "Orders & Sales Specialist",
    type: "staff",
    desc: "Focuses on customer checkout processing, dispatch, and order fulfillment.",
    userCount: 5,
    permissions: {
      dashboard: ["view"],
      products: ["view"],
      flash_sale: ["view"],
      orders: ["view", "process"],
      trading: ["view"],
      inventory: ["view"],
      suppliers: ["view"],
      customers: ["view"],
      settings: []
    }
  },
  {
    id: "inventory_clerk",
    name: "Inventory & Warehouse Clerk",
    type: "staff",
    desc: "Handles warehouse stock levels, purchase arrivals, and inventory count.",
    userCount: 4,
    permissions: {
      dashboard: ["view"],
      products: ["view", "edit"],
      flash_sale: ["view"],
      orders: ["view"],
      trading: ["view"],
      inventory: ["view", "adjust", "reorder"],
      suppliers: ["view", "create"],
      customers: [],
      settings: []
    }
  },
  {
    id: "customer_support",
    name: "Customer Support Agent",
    type: "custom",
    desc: "Assists customers, reviews inquiries, order statuses, and trade-in tickets.",
    userCount: 6,
    permissions: {
      dashboard: ["view"],
      products: ["view"],
      flash_sale: ["view"],
      orders: ["view"],
      trading: ["view"],
      inventory: ["view"],
      suppliers: [],
      customers: ["view"],
      settings: []
    }
  }
];

// 3. Default Staff Directory
const DEFAULT_STAFF = [
  { id: 1, name: "Borath Srun", email: "admin@angkormall.com", roleId: "super_admin", roleName: "Super Administrator", status: "Active", lastLogin: "Just now" },
  { id: 2, name: "Dara Sok", email: "dara.manager@angkormall.com", roleId: "mall_manager", roleName: "Mall Manager", status: "Active", lastLogin: "2 hours ago" },
  { id: 3, name: "Chanthy Chea", email: "chanthy.orders@angkormall.com", roleId: "orders_specialist", roleName: "Orders Specialist", status: "Active", lastLogin: "Yesterday" },
  { id: 4, name: "Vanna Meng", email: "vanna.inv@angkormall.com", roleId: "inventory_clerk", roleName: "Inventory Clerk", status: "Active", lastLogin: "3 days ago" },
  { id: 5, name: "Sreynich Pov", email: "sreynich.support@angkormall.com", roleId: "customer_support", roleName: "Support Agent", status: "Active", lastLogin: "5 hours ago" }
];

// 4. Default Store & System Settings
const DEFAULT_SYSTEM_SETTINGS = {
  // Store Profile
  storeName: "Angkor Shopping Mall",
  storeTagline: "Cambodia's Leading Tech & Lifestyle Destination",
  storeEmail: "contact@angkormall.com",
  storePhone: "+855 23 888 999",
  supportTelegram: "@AngkorMallSupport",
  storeAddress: "St. 2004, Phnom Penh, Kingdom of Cambodia",
  currency: "USD",
  dualCurrencyDisplay: true,
  khrRate: 4100,
  taxRate: 10,

  // Payment Gateways
  abaEnabled: true,
  abaMerchantId: "MCH_ANGKOR_8892",
  abaApiKey: "••••••••••••••••••••••••••••••••",
  abaSandbox: false,
  wingEnabled: true,
  codEnabled: true,
  codMaxLimit: 500,
  cardEnabled: true,

  // Shipping & Logistics
  expressShippingFee: 1.5,
  expressHours: "24 Hours (Phnom Penh)",
  provinceShippingFee: 2.5,
  freeShippingThreshold: 50,

  // Security & Notifications
  lowStockThreshold: 5,
  telegramAlertsEnabled: true,
  telegramWebhook: "https://api.telegram.org/bot7281923:AAHb9/sendMessage",
  enforce2FA: true,
  sessionTimeoutMinutes: 60,
  maintenanceMode: false,
  maintenanceMessage: "We are currently conducting scheduled upgrades to bring you a faster shopping experience. We will be back shortly!"
};

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("roles_permissions");

  // State Management with LocalStorage Fallback
  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_admin_roles_v1");
      return saved ? JSON.parse(saved) : DEFAULT_ROLES;
    } catch {
      return DEFAULT_ROLES;
    }
  });

  const [selectedRoleId, setSelectedRoleId] = useState(DEFAULT_ROLES[0].id);

  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_admin_staff_v1");
      return saved ? JSON.parse(saved) : DEFAULT_STAFF;
    } catch {
      return DEFAULT_STAFF;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_admin_settings_v1");
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_SETTINGS;
    } catch {
      return DEFAULT_SYSTEM_SETTINGS;
    }
  });

  // Modal States
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: "", desc: "" });

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", roleId: "mall_manager", status: "Active" });

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Save changes to localStorage
  const handleSaveAll = () => {
    try {
      localStorage.setItem("angkor_admin_roles_v1", JSON.stringify(roles));
      localStorage.setItem("angkor_admin_staff_v1", JSON.stringify(staff));
      localStorage.setItem("angkor_admin_settings_v1", JSON.stringify(settings));

      Swal.fire({
        icon: "success",
        title: "Settings Saved!",
        text: "System configurations, RBAC permissions, and staff credentials have been updated.",
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: "#166534"
      });
    } catch (e) {
      Swal.fire("Error", "Could not save settings", "error");
    }
  };

  const handleResetDefaults = () => {
    Swal.fire({
      title: "Reset to System Defaults?",
      text: "This will restore all default roles, permissions, and system configurations.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Reset"
    }).then((res) => {
      if (res.isConfirmed) {
        setRoles(DEFAULT_ROLES);
        setStaff(DEFAULT_STAFF);
        setSettings(DEFAULT_SYSTEM_SETTINGS);
        setSelectedRoleId(DEFAULT_ROLES[0].id);

        localStorage.removeItem("angkor_admin_roles_v1");
        localStorage.removeItem("angkor_admin_staff_v1");
        localStorage.removeItem("angkor_admin_settings_v1");

        Swal.fire("Reset Completed", "Default configuration restored.", "success");
      }
    });
  };

  // Toggle single action permission
  const handleTogglePermission = (moduleId, action) => {
    if (selectedRoleId === "super_admin") {
      Swal.fire("Notice", "Super Administrator holds permanent full system permissions.", "info");
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRoleId) return role;

        const currentModulePerms = role.permissions[moduleId] || [];
        const hasAction = currentModulePerms.includes(action);

        const updatedModulePerms = hasAction
          ? currentModulePerms.filter((a) => a !== action)
          : [...currentModulePerms, action];

        return {
          ...role,
          permissions: {
            ...role.permissions,
            [moduleId]: updatedModulePerms
          }
        };
      })
    );
  };

  // Toggle all actions for a module
  const handleToggleModuleAll = (module) => {
    if (selectedRoleId === "super_admin") return;

    const currentModulePerms = currentRole.permissions[module.id] || [];
    const allActions = module.actions;
    const isAllChecked = allActions.every((a) => currentModulePerms.includes(a));

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRoleId) return role;
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [module.id]: isAllChecked ? [] : [...allActions]
          }
        };
      })
    );
  };

  // Add new Role
  const handleCreateRole = (e) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;

    const newId = "role_" + Date.now();
    const newRole = {
      id: newId,
      name: newRoleForm.name.trim(),
      type: "custom",
      desc: newRoleForm.desc.trim() || "Custom tailored access role.",
      userCount: 0,
      permissions: {
        dashboard: ["view"],
        products: ["view"],
        orders: ["view"]
      }
    };

    const updated = [...roles, newRole];
    setRoles(updated);
    setSelectedRoleId(newId);
    setNewRoleForm({ name: "", desc: "" });
    setRoleModalOpen(false);

    Swal.fire("Role Created!", `Role "${newRole.name}" is ready for permission assignment.`, "success");
  };

  // Delete Role
  const handleDeleteRole = (roleId, roleName) => {
    if (roleId === "super_admin") {
      Swal.fire("Action Blocked", "Super Admin role cannot be deleted.", "warning");
      return;
    }

    Swal.fire({
      title: `Delete "${roleName}"?`,
      text: "Any staff currently assigned to this role will need reassignment.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete Role"
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = roles.filter((r) => r.id !== roleId);
        setRoles(updated);
        setSelectedRoleId(updated[0].id);
        Swal.fire("Deleted", "Role removed.", "success");
      }
    });
  };

  // Save / Edit Staff
  const handleSaveStaff = (e) => {
    e.preventDefault();
    const matchedRole = roles.find((r) => r.id === staffForm.roleId);
    const roleName = matchedRole ? matchedRole.name : "Custom Role";

    if (selectedStaff) {
      // Edit
      setStaff((prev) =>
        prev.map((s) =>
          s.id === selectedStaff.id
            ? { ...s, name: staffForm.name, email: staffForm.email, roleId: staffForm.roleId, roleName, status: staffForm.status }
            : s
        )
      );
      Swal.fire("Staff Updated", "User permissions refreshed.", "success");
    } else {
      // Create
      const newMember = {
        id: Date.now(),
        name: staffForm.name,
        email: staffForm.email,
        roleId: staffForm.roleId,
        roleName,
        status: staffForm.status,
        lastLogin: "Never"
      };
      setStaff((prev) => [...prev, newMember]);
      Swal.fire("Staff Added", "New administrator user created.", "success");
    }

    setStaffModalOpen(false);
  };

  return (
    <div className="settings-page-wrapper">
      {/* Top Banner */}
      <div className="settings-header-banner">
        <div className="settings-header-title">
          <div className="settings-header-icon">
            <Sliders size={26} />
          </div>
          <div>
            <h1>Admin Settings & RBAC Control</h1>
            <p>Configure role-based access permissions, payment gateways, store profile, and security preferences.</p>
          </div>
        </div>

        <div className="settings-header-actions">
          <button type="button" className="btn-outline-secondary" onClick={handleResetDefaults}>
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>
          <button type="button" className="btn-save-primary" onClick={handleSaveAll}>
            <Save size={16} />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "roles_permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("roles_permissions")}
        >
          <Shield size={16} />
          <span>Roles & RBAC Matrix</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "staff_users" ? "active" : ""}`}
          onClick={() => setActiveTab("staff_users")}
        >
          <Users size={16} />
          <span>Staff Directory ({staff.length})</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <Store size={16} />
          <span>Store & Mall Profile</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard size={16} />
          <span>Payment Gateways</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
          onClick={() => setActiveTab("shipping")}
        >
          <Truck size={16} />
          <span>Delivery & Shipping</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Lock size={16} />
          <span>Security & Alerts</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ROLES & PERMISSION RBAC MATRIX
         ========================================================================= */}
      {activeTab === "roles_permissions" && (
        <>
          {/* Roles Selector Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Shield size={18} color="#166534" />
                  <span>Select Role to Configure Permissions</span>
                </h3>
                <p>Choose a role to view or adjust module-level privileges and action rights.</p>
              </div>
              <button
                type="button"
                className="btn-save-primary"
                onClick={() => {
                  setNewRoleForm({ name: "", desc: "" });
                  setRoleModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Add New Role</span>
              </button>
            </div>

            <div className="roles-grid">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`role-card-item ${selectedRoleId === role.id ? "selected" : ""}`}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <div className="role-card-top">
                    <span className={`role-badge-tag ${role.type}`}>{role.type}</span>
                    {role.id !== "super_admin" && (
                      <button
                        type="button"
                        className="btn-outline-secondary"
                        style={{ padding: "4px 8px", fontSize: "11px", border: "none", color: "#dc2626" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id, role.name);
                        }}
                        title="Delete Role"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <h4 className="role-title">{role.name}</h4>
                  <p className="role-description">{role.desc}</p>
                  <div className="role-meta-row">
                    <span>Assigned Staff:</span>
                    <span className="role-user-count">
                      {staff.filter((s) => s.roleId === role.id).length} Users
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Granular Permission Matrix for Selected Role */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Key size={18} color="#166534" />
                  <span>Permissions Matrix for: {currentRole.name}</span>
                </h3>
                <p>Check or uncheck individual operational capabilities for this role.</p>
              </div>
            </div>

            <div className="matrix-table-container">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Module Name</th>
                    <th>Select All</th>
                    <th>Permissions & Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MODULES.map((module) => {
                    const currentPerms = currentRole.permissions[module.id] || [];
                    const isAllChecked = module.actions.every((a) => currentPerms.includes(a));

                    return (
                      <tr key={module.id}>
                        <td>
                          <div className="matrix-module-cell">
                            <span className="matrix-module-name">{module.name}</span>
                            <span className="matrix-module-desc">{module.desc}</span>
                          </div>
                        </td>
                        <td>
                          <label className="perm-toggle-wrapper">
                            <input
                              type="checkbox"
                              className="perm-checkbox"
                              checked={isAllChecked}
                              disabled={selectedRoleId === "super_admin"}
                              onChange={() => handleToggleModuleAll(module)}
                            />
                          </label>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            {module.actions.map((act) => {
                              const checked = currentPerms.includes(act);
                              return (
                                <label key={act} className="perm-toggle-wrapper" style={{ gap: "6px" }}>
                                  <input
                                    type="checkbox"
                                    className="perm-checkbox"
                                    checked={checked}
                                    disabled={selectedRoleId === "super_admin"}
                                    onChange={() => handleTogglePermission(module.id, act)}
                                  />
                                  <span style={{ textTransform: "capitalize", fontSize: "12.5px", fontWeight: 500 }}>
                                    {act}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: STAFF DIRECTORY & ROLE ASSIGNMENT
         ========================================================================= */}
      {activeTab === "staff_users" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Users size={18} color="#166534" />
                <span>Admin & Staff Accounts</span>
              </h3>
              <p>Manage back-office users and their designated system roles.</p>
            </div>
            <button
              type="button"
              className="btn-save-primary"
              onClick={() => {
                setSelectedStaff(null);
                setStaffForm({ name: "", email: "", roleId: roles[0]?.id || "super_admin", status: "Active" });
                setStaffModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Add Staff User</span>
            </button>
          </div>

          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="staff-user-cell">
                        <div className="staff-avatar">{member.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0f172a" }}>{member.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="staff-role-badge">{member.roleName}</span>
                    </td>
                    <td>
                      <span className={`status-indicator-dot ${member.status.toLowerCase()}`}>
                        {member.status}
                      </span>
                    </td>
                    <td style={{ color: "#64748b" }}>{member.lastLogin}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-outline-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px", marginRight: "6px" }}
                        onClick={() => {
                          setSelectedStaff(member);
                          setStaffForm({
                            name: member.name,
                            email: member.email,
                            roleId: member.roleId,
                            status: member.status
                          });
                          setStaffModalOpen(true);
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GENERAL STORE PROFILE
         ========================================================================= */}
      {activeTab === "general" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Store size={18} color="#166534" />
                <span>Store Profile & Official Information</span>
              </h3>
              <p>Customize store branding, operating details, contact channels, and currency.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">Mall / Store Name</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Official Tagline</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Support Email</label>
              <input
                type="email"
                className="settings-input"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Hotline Phone</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Official Telegram Channel</label>
              <input
                type="text"
                className="settings-input"
                value={settings.supportTelegram}
                onChange={(e) => setSettings({ ...settings, supportTelegram: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Primary Currency</label>
              <select
                className="settings-select"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="KHR">KHR (៛) - Cambodian Riel</option>
              </select>
            </div>

            <div className="form-group-item">
              <label className="form-label">KHR Exchange Rate (1 USD = X KHR)</label>
              <input
                type="number"
                className="settings-input"
                value={settings.khrRate}
                onChange={(e) => setSettings({ ...settings, khrRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">VAT / Tax Rate (%)</label>
              <input
                type="number"
                className="settings-input"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item full-width">
              <label className="form-label">Physical Store / Headquarters Address</label>
              <textarea
                className="settings-textarea"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PAYMENT GATEWAYS
         ========================================================================= */}
      {activeTab === "payments" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <CreditCard size={18} color="#166534" />
                <span>Payment Gateways & Checkout Methods</span>
              </h3>
              <p>Configure ABA KHQR, Wing Bank, Cash on Delivery, and Credit/Debit cards.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* ABA Payway Card */}
            <div className="payment-gateway-item">
              <div className="payment-gateway-top">
                <div className="payment-gateway-info">
                  <div className="gateway-icon-badge">🏦</div>
                  <div>
                    <strong style={{ fontSize: "14.5px" }}>ABA KHQR & PayWay</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Instant QR scan & in-app checkout</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.abaEnabled}
                    onChange={(e) => setSettings({ ...settings, abaEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {settings.abaEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>Merchant ID</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.abaMerchantId}
                      onChange={(e) => setSettings({ ...settings, abaMerchantId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>API Key / Secret</label>
                    <input
                      type="password"
                      className="settings-input"
                      value={settings.abaApiKey}
                      onChange={(e) => setSettings({ ...settings, abaApiKey: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Wing Bank Card */}
            <div className="payment-gateway-item">
              <div className="payment-gateway-top">
                <div className="payment-gateway-info">
                  <div className="gateway-icon-badge" style={{ color: "#84cc16" }}>💸</div>
                  <div>
                    <strong style={{ fontSize: "14.5px" }}>Wing Bank Wallet</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Wing KHQR & mobile account</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.wingEnabled}
                    onChange={(e) => setSettings({ ...settings, wingEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Cash on Delivery Card */}
            <div className="payment-gateway-item">
              <div className="payment-gateway-top">
                <div className="payment-gateway-info">
                  <div className="gateway-icon-badge">📦</div>
                  <div>
                    <strong style={{ fontSize: "14.5px" }}>Cash on Delivery (COD)</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Pay driver upon parcel receipt</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.codEnabled}
                    onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {settings.codEnabled && (
                <div style={{ marginTop: "8px" }}>
                  <label style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>Max Order Limit for COD ($)</label>
                  <input
                    type="number"
                    className="settings-input"
                    value={settings.codMaxLimit}
                    onChange={(e) => setSettings({ ...settings, codMaxLimit: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {/* Credit/Debit Cards */}
            <div className="payment-gateway-item">
              <div className="payment-gateway-top">
                <div className="payment-gateway-info">
                  <div className="gateway-icon-badge">💳</div>
                  <div>
                    <strong style={{ fontSize: "14.5px" }}>Credit / Debit Cards</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Visa, MasterCard, UnionPay</div>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.cardEnabled}
                    onChange={(e) => setSettings({ ...settings, cardEnabled: e.target.checked })}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SHIPPING & DELIVERY
         ========================================================================= */}
      {activeTab === "shipping" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Truck size={18} color="#166534" />
                <span>Delivery Zones & Shipping Rates</span>
              </h3>
              <p>Configure Phnom Penh express delivery and nationwide province dispatch fees.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">Express Delivery Fee - Phnom Penh ($)</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.expressShippingFee}
                onChange={(e) => setSettings({ ...settings, expressShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Estimated Delivery Timeframe</label>
              <input
                type="text"
                className="settings-input"
                value={settings.expressHours}
                onChange={(e) => setSettings({ ...settings, expressHours: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Provinces Shipping Fee ($)</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.provinceShippingFee}
                onChange={(e) => setSettings({ ...settings, provinceShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">Free Shipping Minimum Threshold ($)</label>
              <input
                type="number"
                className="settings-input"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              />
              <span className="form-helper-text">Orders above this amount receive free shipping automatically.</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: SECURITY, ALERTS & MAINTENANCE
         ========================================================================= */}
      {activeTab === "security" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Lock size={18} color="#166534" />
                <span>Security Policies, Alerts & Maintenance</span>
              </h3>
              <p>Configure stock alert thresholds, Telegram webhooks, and maintenance mode.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Low Stock Alert */}
            <div className="switch-container">
              <div className="switch-label-group">
                <span className="switch-title">Low Stock Alert Threshold (Units)</span>
                <span className="switch-desc">Notify warehouse managers when item quantity drops below this number</span>
              </div>
              <input
                type="number"
                className="settings-input"
                style={{ width: "100px" }}
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
              />
            </div>

            {/* Telegram Webhook Notifications */}
            <div className="switch-container">
              <div className="switch-label-group">
                <span className="switch-title">Instant Telegram Order & Trade-In Webhook</span>
                <span className="switch-desc">Receive real-time alerts in your staff Telegram group whenever an order or trade is placed</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.telegramAlertsEnabled}
                  onChange={(e) => setSettings({ ...settings, telegramAlertsEnabled: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Enforce 2FA */}
            <div className="switch-container">
              <div className="switch-label-group">
                <span className="switch-title">Enforce Two-Factor Authentication (2FA) for Staff</span>
                <span className="switch-desc">Require OTP or authenticator verification on all admin/manager logins</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enforce2FA}
                  onChange={(e) => setSettings({ ...settings, enforce2FA: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Maintenance Mode */}
            <div className="switch-container" style={{ borderLeft: "4px solid #ef4444" }}>
              <div className="switch-label-group">
                <span className="switch-title" style={{ color: "#dc2626" }}>Store Maintenance Mode</span>
                <span className="switch-desc">Temporarily lock the customer-facing storefront during database or inventory audits</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {settings.maintenanceMode && (
              <div className="form-group-item">
                <label className="form-label">Customer Maintenance Notice Banner</label>
                <textarea
                  className="settings-textarea"
                  value={settings.maintenanceMessage}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW ROLE
         ========================================================================= */}
      {roleModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setRoleModalOpen(false)}>
          <div className="settings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>Create New Role</h3>
              <button
                type="button"
                className="btn-outline-secondary"
                style={{ padding: "4px", border: "none" }}
                onClick={() => setRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div className="settings-modal-body">
                <div className="form-group-item">
                  <label className="form-label">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marketing Lead, Warehouse Auditor"
                    className="settings-input"
                    value={newRoleForm.name}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Describe responsibilities and scope of this role..."
                    className="settings-textarea"
                    value={newRoleForm.desc}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, desc: e.target.value })}
                  />
                </div>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="btn-outline-secondary" onClick={() => setRoleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-primary">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT STAFF
         ========================================================================= */}
      {staffModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setStaffModalOpen(false)}>
          <div className="settings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>{selectedStaff ? "Edit Staff User" : "Add New Staff Member"}</h3>
              <button
                type="button"
                className="btn-outline-secondary"
                style={{ padding: "4px", border: "none" }}
                onClick={() => setStaffModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="settings-modal-body">
                <div className="form-group-item">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="settings-input"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="settings-input"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">Assign Role *</label>
                  <select
                    className="settings-select"
                    value={staffForm.roleId}
                    onChange={(e) => setStaffForm({ ...staffForm, roleId: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group-item">
                  <label className="form-label">Account Status</label>
                  <select
                    className="settings-select"
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="btn-outline-secondary" onClick={() => setStaffModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-primary">
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
