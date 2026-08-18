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
  X,
  Sun,
  Moon,
  Laptop,
  Palette,
  Check,
  Sparkles,
  Eye,
  Layers,
  Volume2
} from "lucide-react";
import Swal from "sweetalert2";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
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
    id: "reports",
    name: "Reports & Business Intelligence",
    desc: "Export financial statements, profit margins, sales trends",
    actions: ["view", "export"]
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
      reports: ["view", "export"],
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
      reports: ["view", "export"],
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
      reports: ["view"],
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
      reports: ["view"],
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
      reports: [],
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
  // Appearance & Display Defaults
  defaultStoreLanguage: "km",
  defaultStoreTheme: "system",
  enableAiVoiceLocalization: true,
  autoDetectUserLocale: true,

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
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, isKhmer, t } = useTranslation();

  const [activeTab, setActiveTab] = useState("appearance_language");

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
        title: isKhmer ? "បានរក្សាទុកជោគជ័យ!" : "Settings Saved!",
        text: isKhmer
          ? "ការកំណត់រូបរាង ភាសា សិទ្ធិបុគ្គលិក និងព័ត៌មានទូទៅត្រូវបានធ្វើបច្ចុប្បន្នភាព។"
          : "Appearance, language, RBAC permissions, and store configurations have been updated.",
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
      title: isKhmer ? "កំណត់ឡើងវិញដូចដើម?" : "Reset to System Defaults?",
      text: isKhmer
        ? "វានឹងស្ដារការកំណត់រូបរាង ភាសា តួនាទី និងប្រព័ន្ធទាំងអស់ទៅកាន់លំនាំដើមវិញ។"
        : "This will restore all default appearances, roles, permissions, and system configurations.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "បាទ/ចាស កំណត់ឡើងវិញ" : "Yes, Reset",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel"
    }).then((res) => {
      if (res.isConfirmed) {
        setTheme("system");
        setLanguage("km");
        setRoles(DEFAULT_ROLES);
        setStaff(DEFAULT_STAFF);
        setSettings(DEFAULT_SYSTEM_SETTINGS);
        setSelectedRoleId(DEFAULT_ROLES[0].id);

        localStorage.removeItem("angkor_admin_roles_v1");
        localStorage.removeItem("angkor_admin_staff_v1");
        localStorage.removeItem("angkor_admin_settings_v1");

        Swal.fire(
          isKhmer ? "បានស្ដាររួចរាល់" : "Reset Completed",
          isKhmer ? "ការកំណត់លំនាំដើមត្រូវបានស្ដារជោគជ័យ។" : "Default configuration restored.",
          "success"
        );
      }
    });
  };

  // Toggle single action permission
  const handleTogglePermission = (moduleId, action) => {
    if (selectedRoleId === "super_admin") {
      Swal.fire(
        isKhmer ? "ដំណឹង" : "Notice",
        isKhmer
          ? "Super Administrator មានសិទ្ធិពេញលេញលើគ្រប់ផ្នែកទាំងអស់នៃប្រព័ន្ធជាអចិន្ត្រៃយ៍។"
          : "Super Administrator holds permanent full system permissions.",
        "info"
      );
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
      setStaff((prev) =>
        prev.map((s) =>
          s.id === selectedStaff.id
            ? { ...s, name: staffForm.name, email: staffForm.email, roleId: staffForm.roleId, roleName, status: staffForm.status }
            : s
        )
      );
      Swal.fire("Staff Updated", "User permissions refreshed.", "success");
    } else {
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
            <h1>{isKhmer ? "ការកំណត់ប្រព័ន្ធ & សិទ្ធិគ្រប់គ្រង Admin" : "Admin Settings & RBAC Control"}</h1>
            <p>
              {isKhmer
                ? "កំណត់រូបរាង ស្បែកពណ៌ ភាសា សិទ្ធិតួនាទីបុគ្គលិក ធនាគារទូទាត់ និងសុវត្ថិភាពទូទៅនៃប្រព័ន្ធ។"
                : "Configure appearance theme, language, role-based access permissions, payment gateways, and security preferences."}
            </p>
          </div>
        </div>

        <div className="settings-header-actions">
          <button type="button" className="btn-outline-secondary" onClick={handleResetDefaults}>
            <RotateCcw size={15} />
            <span>{isKhmer ? "កំណត់ដើមឡើងវិញ" : "Reset Defaults"}</span>
          </button>
          <button type="button" className="btn-save-primary" onClick={handleSaveAll}>
            <Save size={16} />
            <span>{isKhmer ? "រក្សាទុកការផ្លាស់ប្តូរ" : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="settings-tabs-nav">
        {/* Tab 1: Theme & Language */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "appearance_language" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance_language")}
        >
          <Palette size={16} />
          <span>{isKhmer ? "រូបរាង & ភាសា" : "Theme & Language"}</span>
          <span className="tab-pill-badge">{language === "km" ? "🇰🇭 KM" : "🇺🇸 EN"}</span>
        </button>

        {/* Tab 2: Roles & Permissions */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "roles_permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("roles_permissions")}
        >
          <Shield size={16} />
          <span>{isKhmer ? "តួនាទី & សិទ្ធិ (RBAC)" : "Roles & RBAC Matrix"}</span>
        </button>

        {/* Tab 3: Staff Users */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "staff_users" ? "active" : ""}`}
          onClick={() => setActiveTab("staff_users")}
        >
          <Users size={16} />
          <span>{isKhmer ? `បញ្ជីបុគ្គលិក (${staff.length})` : `Staff Directory (${staff.length})`}</span>
        </button>

        {/* Tab 4: Store Profile */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <Store size={16} />
          <span>{isKhmer ? "ព័ត៌មានទូទៅហាង" : "Store & Mall Profile"}</span>
        </button>

        {/* Tab 5: Payments */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard size={16} />
          <span>{isKhmer ? "ធនាគារទូទាត់" : "Payment Gateways"}</span>
        </button>

        {/* Tab 6: Shipping */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
          onClick={() => setActiveTab("shipping")}
        >
          <Truck size={16} />
          <span>{isKhmer ? "ការដឹកជញ្ជូន" : "Delivery & Shipping"}</span>
        </button>

        {/* Tab 7: Security */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Lock size={16} />
          <span>{isKhmer ? "សុវត្ថិភាព & ការជូនដំណឹង" : "Security & Alerts"}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: APPEARANCE & LANGUAGE SETTINGS (DARK / LIGHT / SYSTEM & KHMER / EN)
         ========================================================================= */}
      {activeTab === "appearance_language" && (
        <div className="appearance-settings-container">
          {/* Section 1: Theme & Appearance Mode */}
          <div className="settings-card appearance-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Palette size={19} color="#166534" />
                  <span>{isKhmer ? "ស្បែកពណ៌ និងរូបរាង (Theme & Appearance Mode)" : "Theme & Appearance Mode"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "ផ្លាស់ប្តូររូបរាងភ្លឺ ងងឹត ឬតាមប្រព័ន្ធកុំព្យូទ័រ/ទូរស័ព្ទសម្រាប់ផ្ទាំង Admin និងគេហទំព័រទាំងមូល។"
                    : "Select your preferred visual mode for the admin suite and storefront. Instant real-time toggle."}
                </p>
              </div>
              <div className="theme-current-pill">
                <span className="dot-pulse" />
                <span>
                  {isKhmer ? "ស្បែកបច្ចុប្បន្ន៖ " : "Active Mode: "}
                  <strong>{theme.toUpperCase()} ({resolvedTheme.toUpperCase()})</strong>
                </span>
              </div>
            </div>

            <div className="theme-selection-grid">
              {/* Light Mode Card */}
              <div
                className={`theme-card-box light-mode-box ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <div className="theme-card-visual light-visual">
                  <div className="visual-window">
                    <div className="visual-topbar light-topbar" />
                    <div className="visual-content light-content">
                      <div className="visual-sidebar light-sidebar" />
                      <div className="visual-body">
                        <div className="visual-card-item light-card-item" />
                        <div className="visual-card-item light-card-item small" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <div className="theme-icon-circle sun-icon">
                      <Sun size={18} />
                    </div>
                    <div>
                      <h4>{isKhmer ? "ពន្លឺ (Light Mode)" : "Light Mode"}</h4>
                      <small>{isKhmer ? "ផ្ទៃសភ្លឺច្បាស់ ងាយស្រួលមើលពេលថ្ងៃ" : "Clean, crisp bright presentation"}</small>
                    </div>
                  </div>
                  {theme === "light" && (
                    <div className="theme-check-badge">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Dark Mode Card */}
              <div
                className={`theme-card-box dark-mode-box ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <div className="theme-card-visual dark-visual">
                  <div className="visual-window dark-window">
                    <div className="visual-topbar dark-topbar" />
                    <div className="visual-content dark-content">
                      <div className="visual-sidebar dark-sidebar" />
                      <div className="visual-body">
                        <div className="visual-card-item dark-card-item" />
                        <div className="visual-card-item dark-card-item small" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <div className="theme-icon-circle moon-icon">
                      <Moon size={18} />
                    </div>
                    <div>
                      <h4>{isKhmer ? "ងងឹត (Dark Mode)" : "Dark Mode"}</h4>
                      <small>{isKhmer ? "ផ្ទៃខ្មៅប្រណិត កាត់បន្ថយចំណាំងពន្លឺ" : "Deep luxury dark theme for reduced eye strain"}</small>
                    </div>
                  </div>
                  {theme === "dark" && (
                    <div className="theme-check-badge">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* System Default Card */}
              <div
                className={`theme-card-box system-mode-box ${theme === "system" ? "active" : ""}`}
                onClick={() => setTheme("system")}
              >
                <div className="theme-card-visual system-visual">
                  <div className="visual-window system-window">
                    <div className="visual-topbar system-topbar" />
                    <div className="visual-content system-content">
                      <div className="visual-half light-half">
                        <Sun size={14} />
                      </div>
                      <div className="visual-half dark-half">
                        <Moon size={14} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="theme-card-info">
                  <div className="theme-card-title-row">
                    <div className="theme-icon-circle laptop-icon">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <h4>{isKhmer ? "តាមឧបករណ៍ (System Auto)" : "System Default"}</h4>
                      <small>{isKhmer ? "ផ្លាស់ប្តូរស្វ័យប្រវត្តិតាមការកំណត់ឧបករណ៍" : "Automatically syncs with device OS theme"}</small>
                    </div>
                  </div>
                  {theme === "system" && (
                    <div className="theme-check-badge">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Language & Localization Selection */}
          <div className="settings-card appearance-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Globe size={19} color="#166534" />
                  <span>{isKhmer ? "ការកំណត់ភាសា (Language & Localization)" : "Language & Localization Selection"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "ជ្រើសរើសភាសាចម្បងសម្រាប់គ្រប់គ្រងទិន្នន័យ របាយការណ៍ និងការបង្ហាញលើគេហទំព័រ។"
                    : "Select your active language. Changes apply immediately across all modules, sidebar, tables, and AI assistant."}
                </p>
              </div>
              <div className="theme-current-pill">
                <span>
                  {isKhmer ? "ភាសាសកម្ម៖ " : "Active Language: "}
                  <strong>{language === "km" ? "🇰🇭 ភាសាខ្មែរ (Khmer)" : "🇺🇸 English (US)"}</strong>
                </span>
              </div>
            </div>

            <div className="lang-selection-grid">
              {/* Khmer Option */}
              <div
                className={`lang-card-box ${language === "km" ? "active" : ""}`}
                onClick={() => setLanguage("km")}
              >
                <div className="lang-flag-banner">
                  <span className="lang-flag-emoji">🇰🇭</span>
                  <span className="lang-code-pill">KM</span>
                </div>
                <div className="lang-card-details">
                  <h4>ភាសាខ្មែរ (Khmer)</h4>
                  <p>ប្រើប្រាស់ភាសាខ្មែរពេញលេញសម្រាប់ផ្ទាំង Admin ផលិតផល ការបញ្ជាទិញ និងសារជំនួយការ AI</p>
                  <div className="lang-feature-tags">
                    <span className="lang-tag">✓ ផ្ទាំងបញ្ជាជាភាសាខ្មែរ</span>
                    <span className="lang-tag">✓ សំឡេង AI ខ្មែរ</span>
                    <span className="lang-tag">✓ ទ្រង់ទ្រាយប្រាក់រៀល (KHR)</span>
                  </div>
                </div>
                {language === "km" && (
                  <div className="theme-check-badge">
                    <Check size={15} />
                  </div>
                )}
              </div>

              {/* English Option */}
              <div
                className={`lang-card-box ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                <div className="lang-flag-banner">
                  <span className="lang-flag-emoji">🇺🇸</span>
                  <span className="lang-code-pill">EN</span>
                </div>
                <div className="lang-card-details">
                  <h4>English (US)</h4>
                  <p>Standard International English interface for back-office administration, inventory, and analytics.</p>
                  <div className="lang-feature-tags">
                    <span className="lang-tag">✓ Full English UI</span>
                    <span className="lang-tag">✓ AI Voice in English</span>
                    <span className="lang-tag">✓ USD ($) Standards</span>
                  </div>
                </div>
                {language === "en" && (
                  <div className="theme-check-badge">
                    <Check size={15} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Storefront Localization & AI Voice Preferences */}
          <div className="settings-card appearance-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Sliders size={18} color="#166534" />
                  <span>{isKhmer ? "ការកំណត់លំនាំដើមសម្រាប់អតិថិជន និង AI" : "Storefront & AI Assistant Defaults"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "កំណត់ភាសា និងស្បែកពណ៌ដំបូងពេលដែលអតិថិជនថ្មីចូលទស្សនាគេហទំព័ររបស់អ្នក"
                    : "Specify default preferences presented to first-time shoppers and guest visitors."}
                </p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "ភាសាដំបូងសម្រាប់អតិថិជនថ្មី" : "Default Storefront Language"}</label>
                <select
                  className="settings-select"
                  value={settings.defaultStoreLanguage || "km"}
                  onChange={(e) => setSettings({ ...settings, defaultStoreLanguage: e.target.value })}
                >
                  <option value="km">🇰🇭 ភាសាខ្មែរ (Khmer) - Recommended</option>
                  <option value="en">🇺🇸 English (US)</option>
                </select>
                <span className="form-helper-text">
                  {isKhmer ? "ភាសាដែលត្រូវបង្ហាញពេលអតិថិជនបើកគេហទំព័រលើកដំបូង" : "Default language shown to new visitors on first launch"}
                </span>
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "ស្បែកពណ៌ដំបូងសម្រាប់អតិថិជនថ្មី" : "Default Storefront Theme"}</label>
                <select
                  className="settings-select"
                  value={settings.defaultStoreTheme || "system"}
                  onChange={(e) => setSettings({ ...settings, defaultStoreTheme: e.target.value })}
                >
                  <option value="system">💻 System Auto-Match (Recommended)</option>
                  <option value="light">☀️ Light Theme Mode</option>
                  <option value="dark">🌙 Dark Theme Mode</option>
                </select>
                <span className="form-helper-text">
                  {isKhmer ? "ស្បែកពណ៌ដែលត្រូវបានជ្រើសរើសស្វ័យប្រវត្តសម្រាប់ភ្ញៀវ" : "Initial theme mode applied for non-logged-in shoppers"}
                </span>
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "តំបន់ម៉ោងប្រព័ន្ធ (Timezone)" : "System Timezone"}</label>
                <input
                  type="text"
                  className="settings-input"
                  value="Asia/Phnom_Penh (GMT+7:00)"
                  readOnly
                  style={{ background: isDark ? "#1e293b" : "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "ការបង្ហាញរូបិយប័ណ្ណទ្វេរ (USD & KHR)" : "Dual Currency Display"}</label>
                <select
                  className="settings-select"
                  value={settings.dualCurrencyDisplay ? "yes" : "no"}
                  onChange={(e) => setSettings({ ...settings, dualCurrencyDisplay: e.target.value === "yes" })}
                >
                  <option value="yes">{isKhmer ? "បង្ហាញទាំង ដុល្លារ ($) និង រៀល (៛)" : "Show both USD ($) and KHR (៛)"}</option>
                  <option value="no">{isKhmer ? "បង្ហាញតែ ដុល្លារ ($)" : "Show USD ($) only"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Live Interactive UI Preview */}
          <div className="settings-card appearance-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Eye size={18} color="#166534" />
                  <span>{isKhmer ? "ការបង្ហាញគំរូជាក់ស្តែង (Live UI Preview)" : "Live Interactive UI Simulation"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "ទិដ្ឋភាពជាក់ស្តែងនៃប៊ូតុង ស្លាកសញ្ញា និងអត្ថបទតាមការកំណត់រូបរាងបច្ចុប្បន្ន"
                    : "Real-time preview demonstrating typography, card surfaces, badges, and button states in current theme."}
                </p>
              </div>
            </div>

            <div className="preview-simulation-container">
              <div className="preview-simulation-header">
                <div className="preview-header-brand">
                  <div className="preview-logo-dot" />
                  <strong>Angkor Mall Admin Dashboard</strong>
                </div>
                <div className="preview-header-meta">
                  <span className="preview-badge success">● System Online</span>
                  <span className="preview-badge theme-tag">
                    {resolvedTheme === "dark" ? "🌙 Dark Theme" : "☀️ Light Theme"}
                  </span>
                  <span className="preview-badge lang-tag">
                    {language === "km" ? "🇰🇭 ភាសាខ្មែរ" : "🇺🇸 English"}
                  </span>
                </div>
              </div>

              <div className="preview-simulation-grid">
                {/* Metric Card 1 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "ចំណូលសរុបប្រចាំថ្ងៃ" : "Today's Total Revenue"}</span>
                    <span className="preview-metric-growth">+18.4%</span>
                  </div>
                  <div className="preview-metric-value">$4,850.00</div>
                  <div className="preview-metric-sub">{isKhmer ? "ស្មើនឹង ≈ 19,885,000 ៛" : "Approx ≈ 19,885,000 KHR"}</div>
                </div>

                {/* Metric Card 2 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "ការបញ្ជាទិញថ្មី" : "New Orders Today"}</span>
                    <span className="preview-metric-growth blue">+12</span>
                  </div>
                  <div className="preview-metric-value">48 {isKhmer ? "កញ្ចប់" : "Orders"}</div>
                  <div className="preview-metric-sub">{isKhmer ? "ABA KHQR: 36 | COD: 12" : "ABA KHQR: 36 | COD: 12"}</div>
                </div>

                {/* Metric Card 3 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "ជំនួយការឆ្លាតវៃ" : "AI Voice Assistant"}</span>
                    <span className="preview-metric-growth green">{isKhmer ? "ដំណើរការ" : "Active"}</span>
                  </div>
                  <div className="preview-metric-value">Angkor AI 2.0</div>
                  <div className="preview-metric-sub">
                    {isKhmer ? "ភាសាសំឡេង៖ ខ្មែរ (ស្តង់ដារ)" : "Voice Engine: English (US)"}
                  </div>
                </div>
              </div>

              <div className="preview-action-row">
                <button type="button" className="btn-save-primary">
                  <Sparkles size={15} />
                  <span>{isKhmer ? "សាកល្បងមុខងារថ្មី" : "Interactive Action"}</span>
                </button>
                <button type="button" className="btn-outline-secondary">
                  <span>{isKhmer ? "មើលរបាយការណ៍លម្អិត" : "Export Report"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ROLES & PERMISSION RBAC MATRIX
         ========================================================================= */}
      {activeTab === "roles_permissions" && (
        <>
          {/* Roles Selector Section */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-left">
                <h3>
                  <Shield size={18} color="#166534" />
                  <span>{isKhmer ? "ជ្រើសរើសតួនាទីដើម្បីកំណត់សិទ្ធិ" : "Select Role to Configure Permissions"}</span>
                </h3>
                <p>{isKhmer ? "ជ្រើសរើសតួនាទីដើម្បីមើល ឬកែប្រែសិទ្ធិនីមួយៗក្នុងប្រព័ន្ធ" : "Choose a role to view or adjust module-level privileges and action rights."}</p>
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
                <span>{isKhmer ? "បន្ថែមតួនាទីថ្មី" : "Add New Role"}</span>
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
                    <span>{isKhmer ? "បុគ្គលិកប្រើប្រាស់៖" : "Assigned Staff:"}</span>
                    <span className="role-user-count">
                      {staff.filter((s) => s.roleId === role.id).length} {isKhmer ? "នាក់" : "Users"}
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
                  <span>{isKhmer ? `តារាងសិទ្ធិសម្រាប់៖ ${currentRole.name}` : `Permissions Matrix for: ${currentRole.name}`}</span>
                </h3>
                <p>{isKhmer ? "ធីក ឬដោះធីកលើសកម្មភាពនីមួយៗសម្រាប់តួនាទីនេះ" : "Check or uncheck individual operational capabilities for this role."}</p>
              </div>
            </div>

            <div className="matrix-table-container">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>{isKhmer ? "ផ្នែក / មុខងារ" : "Module Name"}</th>
                    <th>{isKhmer ? "ជ្រើសទាំងអស់" : "Select All"}</th>
                    <th>{isKhmer ? "សិទ្ធិអនុញ្ញាត" : "Permissions & Actions"}</th>
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
          TAB 3: STAFF DIRECTORY & ROLE ASSIGNMENT
         ========================================================================= */}
      {activeTab === "staff_users" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Users size={18} color="#166534" />
                <span>{isKhmer ? "គណនី Admin & បុគ្គលិកគ្រប់គ្រង" : "Admin & Staff Accounts"}</span>
              </h3>
              <p>{isKhmer ? "គ្រប់គ្រងអ្នកប្រើប្រាស់ និងតួនាទីរបស់ពួកគេក្នុងប្រព័ន្ធ" : "Manage back-office users and their designated system roles."}</p>
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
              <span>{isKhmer ? "បន្ថែមបុគ្គលិកថ្មី" : "Add Staff User"}</span>
            </button>
          </div>

          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{isKhmer ? "ឈ្មោះអ្នកប្រើ" : "User"}</th>
                  <th>{isKhmer ? "តួនាទី" : "Assigned Role"}</th>
                  <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                  <th>{isKhmer ? "សកម្មភាពចុងក្រោយ" : "Last Active"}</th>
                  <th style={{ textAlign: "right" }}>{isKhmer ? "សកម្មភាព" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="staff-user-cell">
                        <div className="staff-avatar">{member.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-dark, #0f172a)" }}>{member.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>{member.email}</div>
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
                    <td style={{ color: "var(--text-muted, #64748b)" }}>{member.lastLogin}</td>
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
                        <span>{isKhmer ? "កែប្រែ" : "Edit"}</span>
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
          TAB 4: GENERAL STORE PROFILE
         ========================================================================= */}
      {activeTab === "general" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Store size={18} color="#166534" />
                <span>{isKhmer ? "ព័ត៌មានទូទៅរបស់ហាង" : "Store Profile & Official Information"}</span>
              </h3>
              <p>{isKhmer ? "កំណត់ឈ្មោះហាង ពាក្យស្លោក ព័ត៌មានទំនាក់ទំនង និងរូបិយប័ណ្ណ" : "Customize store branding, operating details, contact channels, and currency."}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ឈ្មោះហាង / ផ្សារទំនើប" : "Mall / Store Name"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ពាក្យស្លោកផ្លូវការ" : "Official Tagline"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "អ៊ីមែលជំនួយការ" : "Support Email"}</label>
              <input
                type="email"
                className="settings-input"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "លេខទូរស័ព្ទ Hotline" : "Hotline Phone"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ឆានែល Telegram ផ្លូវការ" : "Official Telegram Channel"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.supportTelegram}
                onChange={(e) => setSettings({ ...settings, supportTelegram: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "រូបិយប័ណ្ណចម្បង" : "Primary Currency"}</label>
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
              <label className="form-label">{isKhmer ? "អត្រាប្តូរប្រាក់រៀល (1 USD = X KHR)" : "KHR Exchange Rate (1 USD = X KHR)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.khrRate}
                onChange={(e) => setSettings({ ...settings, khrRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "អត្រាពន្ធ VAT (%)" : "VAT / Tax Rate (%)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item full-width">
              <label className="form-label">{isKhmer ? "អាសយដ្ឋានទីស្នាក់ការកណ្តាល" : "Physical Store / Headquarters Address"}</label>
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
          TAB 5: PAYMENT GATEWAYS
         ========================================================================= */}
      {activeTab === "payments" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <CreditCard size={18} color="#166534" />
                <span>{isKhmer ? "ធនាគារទូទាត់ប្រាក់ & KHQR" : "Payment Gateways & Checkout Methods"}</span>
              </h3>
              <p>{isKhmer ? "កំណត់ ABA KHQR, Wing Bank, Cash on Delivery និងកាតធនាគារ" : "Configure ABA KHQR, Wing Bank, Cash on Delivery, and Credit/Debit cards."}</p>
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
                    <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>Instant QR scan & in-app checkout</div>
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
                    <label style={{ fontSize: "12px", color: "var(--text-muted, #475569)", fontWeight: 600 }}>Merchant ID</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.abaMerchantId}
                      onChange={(e) => setSettings({ ...settings, abaMerchantId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "var(--text-muted, #475569)", fontWeight: 600 }}>API Key / Secret</label>
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
                    <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>Wing KHQR & mobile account</div>
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
                    <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>Pay driver upon parcel receipt</div>
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
                  <label style={{ fontSize: "12px", color: "var(--text-muted, #475569)", fontWeight: 600 }}>Max Order Limit for COD ($)</label>
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
                    <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>Visa, MasterCard, UnionPay</div>
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
          TAB 6: SHIPPING & DELIVERY
         ========================================================================= */}
      {activeTab === "shipping" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Truck size={18} color="#166534" />
                <span>{isKhmer ? "ការដឹកជញ្ជូន & តម្លៃសេវា" : "Delivery Zones & Shipping Rates"}</span>
              </h3>
              <p>{isKhmer ? "កំណត់តម្លៃដឹកជញ្ជូនក្នុងរាជធានីភ្នំពេញ និងតាមបណ្តាខេត្ត" : "Configure Phnom Penh express delivery and nationwide province dispatch fees."}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "តម្លៃដឹកជញ្ជូនភ្នំពេញ ($)" : "Express Delivery Fee - Phnom Penh ($)"}</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.expressShippingFee}
                onChange={(e) => setSettings({ ...settings, expressShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "រយៈពេលប៉ាន់ស្មានដឹកដល់" : "Estimated Delivery Timeframe"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.expressHours}
                onChange={(e) => setSettings({ ...settings, expressHours: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "តម្លៃដឹកជញ្ជូនតាមបណ្តាខេត្ត ($)" : "Provinces Shipping Fee ($)"}</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.provinceShippingFee}
                onChange={(e) => setSettings({ ...settings, provinceShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "កម្រិតទឹកប្រាក់ដើម្បីទទួលបានដឹកឥតគិតថ្លៃ ($)" : "Free Shipping Minimum Threshold ($)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              />
              <span className="form-helper-text">
                {isKhmer ? "ការបញ្ជាទិញចាប់ពីចំនួននេះឡើងទៅនឹងទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ" : "Orders above this amount receive free shipping automatically."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: SECURITY, ALERTS & MAINTENANCE
         ========================================================================= */}
      {activeTab === "security" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Lock size={18} color="#166534" />
                <span>{isKhmer ? "សុវត្ថិភាព ការជូនដំណឹង & ការថែទាំប្រព័ន្ធ" : "Security Policies, Alerts & Maintenance"}</span>
              </h3>
              <p>{isKhmer ? "កំណត់កម្រិតព្រមានស្តុក Telegram Webhook និងរបៀបថែទាំប្រព័ន្ធ" : "Configure stock alert thresholds, Telegram webhooks, and maintenance mode."}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Low Stock Alert */}
            <div className="switch-container">
              <div className="switch-label-group">
                <span className="switch-title">{isKhmer ? "កម្រិតព្រមានស្តុកទាប (ចំនួនឯកតា)" : "Low Stock Alert Threshold (Units)"}</span>
                <span className="switch-desc">{isKhmer ? "ជូនដំណឹងទៅកាន់អ្នកគ្រប់គ្រងស្តុកនៅពេលចំនួនផលិតផលធ្លាក់ចុះក្រោមចំនួននេះ" : "Notify warehouse managers when item quantity drops below this number"}</span>
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
                <span className="switch-title">{isKhmer ? "ការជូនដំណឹងតាម Telegram ភ្លាមៗពេលមានការកុម្ម៉ង់ & ប្តូរសេរី" : "Instant Telegram Order & Trade-In Webhook"}</span>
                <span className="switch-desc">{isKhmer ? "ផ្ញើសារដំណឹងទៅកាន់គ្រុប Telegram បុគ្គលិកភ្លាមៗនៅពេលមានការបញ្ជាទិញថ្មី" : "Receive real-time alerts in your staff Telegram group whenever an order or trade is placed"}</span>
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
                <span className="switch-title">{isKhmer ? "ទាមទារការផ្ទៀងផ្ទាត់ ២ ជំហាន (2FA) សម្រាប់បុគ្គលិក" : "Enforce Two-Factor Authentication (2FA) for Staff"}</span>
                <span className="switch-desc">{isKhmer ? "ទាមទារលេខកូដ OTP មុនពេលចូលប្រើប្រាស់ផ្ទាំងគ្រប់គ្រង" : "Require OTP or authenticator verification on all admin/manager logins"}</span>
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
                <span className="switch-title" style={{ color: "#dc2626" }}>{isKhmer ? "របៀបថែទាំប្រព័ន្ធ (Maintenance Mode)" : "Store Maintenance Mode"}</span>
                <span className="switch-desc">{isKhmer ? "បិទគេហទំព័រជាបណ្តោះអាសន្នពេលកំពុងធ្វើបច្ចុប្បន្នភាពទិន្នន័យ" : "Temporarily lock the customer-facing storefront during database or inventory audits"}</span>
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
                <label className="form-label">{isKhmer ? "សារជូនដំណឹងទៅកាន់អតិថិជនពេលបិទថែទាំ" : "Customer Maintenance Notice Banner"}</label>
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
              <h3>{isKhmer ? "បង្កើតតួនាទីថ្មី" : "Create New Role"}</h3>
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
                  <label className="form-label">{isKhmer ? "ឈ្មោះតួនាទី *" : "Role Title *"}</label>
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
                  <label className="form-label">{isKhmer ? "ការពិពណ៌នា" : "Description"}</label>
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
                  {isKhmer ? "បោះបង់" : "Cancel"}
                </button>
                <button type="submit" className="btn-save-primary">
                  {isKhmer ? "បង្កើតតួនាទី" : "Create Role"}
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
              <h3>{selectedStaff ? (isKhmer ? "កែប្រែព័ត៌មានបុគ្គលិក" : "Edit Staff User") : (isKhmer ? "បន្ថែមបុគ្គលិកថ្មី" : "Add New Staff Member")}</h3>
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
                  <label className="form-label">{isKhmer ? "ឈ្មោះពេញ *" : "Full Name *"}</label>
                  <input
                    type="text"
                    required
                    className="settings-input"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">{isKhmer ? "អាសយដ្ឋានអ៊ីមែល *" : "Email Address *"}</label>
                  <input
                    type="email"
                    required
                    className="settings-input"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">{isKhmer ? "ជ្រើសរើសតួនាទី *" : "Assign Role *"}</label>
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
                  <label className="form-label">{isKhmer ? "ស្ថានភាពគណនី" : "Account Status"}</label>
                  <select
                    className="settings-select"
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <option value="Active">{isKhmer ? "សកម្ម (Active)" : "Active"}</option>
                    <option value="Inactive">{isKhmer ? "អសកម្ម (Inactive)" : "Inactive / Suspended"}</option>
                  </select>
                </div>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="btn-outline-secondary" onClick={() => setStaffModalOpen(false)}>
                  {isKhmer ? "បោះបង់" : "Cancel"}
                </button>
                <button type="submit" className="btn-save-primary">
                  {isKhmer ? "រក្សាទុក" : "Save Staff"}
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
