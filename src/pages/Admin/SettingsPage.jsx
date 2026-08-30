import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
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
  Layers
} from "lucide-react";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "../../context/LanguageContext";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import {
  adminChangeUserPasswordApi,
  StaffApi,
  createStaffApi,
  updateStaffApi,
  deleteStaffApi,
  RolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
  enableStaff2FAApi,
  disableStaff2FAApi
} from "../../services/customerService";
import "./style/SettingsPage.css";

// 1. Initial Permission Modules Configuration (Full RBAC Matrix)
const PERMISSION_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard & Analytics",
    nameKm: "áž•áŸ’áž‘áž¶áŸ†áž„áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„ & ážŸáŸ’ážáž·ážáž·",
    desc: "View business metrics, revenue charts, order analytics and sales stats",
    actions: ["view", "export"]
  },
  {
    id: "products",
    name: "Products & Catalog",
    nameKm: "áž•áž›áž·ážáž•áž› & áž€áž¶ážáž¶áž¡áž»áž€",
    desc: "Manage item listings, prices, SKU, specs, variants and gallery images",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "categories",
    name: "Product Categories",
    nameKm: "áž”áŸ’ážšáž—áŸáž‘áž•áž›áž·ážáž•áž›",
    desc: "Organize category trees, hierarchies and department taxonomy",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "brands",
    name: "Brands & Partners",
    nameKm: "áž˜áŸ‰áž¶áž€ & áž™áž¸áž áŸ„",
    desc: "Manage partner brands, manufacturer logos and official endorsements",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "flash_sale",
    name: "Flash Sale & Deals",
    nameKm: "áž”áŸ’ážšáž¼áž˜áŸ‰áž¼ážŸáž·áž“ & Flash Sale",
    desc: "Create limited-time deals, discount countdown timers and campaign banners",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "trading",
    name: "Trade-In & Exchange",
    nameKm: "áž”áŸ’ážáž¼ážšážŸáŸážšáž¸áž‘áž¼ážšážŸáŸáž–áŸ’áž‘ (Trade-In)",
    desc: "Review trade-in requests, evaluate second-hand gadgets, approve cash payouts",
    actions: ["view", "value", "approve", "reject"]
  },
  {
    id: "orders",
    name: "Orders & Invoicing",
    nameKm: "áž€áž¶ážšáž”áž‰áŸ’áž‡áž¶áž‘áž·áž‰ & ážœáž·áž€áŸ’áž€áž™áž”ážáŸ’ážš",
    desc: "Process customer orders, generate invoices, handle dispatch and refunds",
    actions: ["view", "process", "cancel", "refund"]
  },
  {
    id: "messages",
    name: "Customer Support & Chat",
    nameKm: "ážŸáž¶ážš & áž‡áŸ†áž“áž½áž™áž¢ážáž·ážáž·áž‡áž“",
    desc: "Respond to customer inquiries, support tickets and live customer chat",
    actions: ["view", "reply", "delete"]
  },
  {
    id: "inventory",
    name: "Inventory & Warehouses",
    nameKm: "ážŸáŸ’ážáž»áž€áž‘áŸ†áž“áž·áž‰ & ážƒáŸ’áž›áž¶áŸ†áž„",
    desc: "Track real-time stock levels, low-stock alerts, stock count adjustments",
    actions: ["view", "adjust", "reorder"]
  },
  {
    id: "purchases",
    name: "Purchases & Stock In",
    nameKm: "áž€áž¶ážšáž‘áž·áž‰áž…áž¼áž› & áž“áž¶áŸ†áž…áž¼áž›ážŸáŸ’ážáž»áž€",
    desc: "Manage supplier purchase orders, inward goods receipts, cost tracking",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "suppliers",
    name: "Suppliers & Vendors",
    nameKm: "áž¢áŸ’áž“áž€áž•áŸ’áž‚ážáŸ‹áž•áŸ’áž‚áž„áŸ‹",
    desc: "Manage vendor contacts, payment agreements, and supplier directories",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "attendance",
    name: "Staff Attendance & Leave",
    nameKm: "ážœážáŸ’ážáž˜áž¶áž“ & ážŸáž»áŸ†áž…áŸ’áž”áž¶áž”áŸ‹áž”áž»áž‚áŸ’áž‚áž›áž·áž€",
    desc: "QR code check-ins, attendance logs, leave requests approval, work shifts",
    actions: ["view", "checkin", "approve", "export"]
  },
  {
    id: "customers",
    name: "Customers & Accounts",
    nameKm: "áž¢ážáž·ážáž·áž‡áž“ & áž‚ážŽáž“áž¸",
    desc: "Manage customer accounts, VIP tiers, loyalty points, user ban status",
    actions: ["view", "edit", "ban"]
  },
  {
    id: "reports",
    name: "Reports & Financials",
    nameKm: "ážšáž”áž¶áž™áž€áž¶ážšážŽáŸ & áž áž·ážšáž‰áŸ’áž‰ážœážáŸ’ážáž»",
    desc: "Export financial statements, profit margins, sales breakdown reports",
    actions: ["view", "export"]
  },
  {
    id: "settings",
    name: "System Settings & RBAC",
    nameKm: "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž”áŸ’ážšáž–áŸáž“áŸ’áž’ & RBAC",
    desc: "Store config, payment keys, security, role-based access permissions",
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
      categories: ["view", "create", "edit", "delete"],
      brands: ["view", "create", "edit", "delete"],
      flash_sale: ["view", "create", "edit", "delete"],
      trading: ["view", "value", "approve", "reject"],
      orders: ["view", "process", "cancel", "refund"],
      messages: ["view", "reply", "delete"],
      inventory: ["view", "adjust", "reorder"],
      purchases: ["view", "create", "edit", "delete"],
      suppliers: ["view", "create", "edit", "delete"],
      attendance: ["view", "checkin", "approve", "export"],
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
      categories: ["view", "create", "edit"],
      brands: ["view", "create", "edit"],
      flash_sale: ["view", "create", "edit"],
      trading: ["view", "value", "approve"],
      orders: ["view", "process", "cancel"],
      messages: ["view", "reply"],
      inventory: ["view", "adjust", "reorder"],
      purchases: ["view", "create", "edit"],
      suppliers: ["view", "create"],
      attendance: ["view", "approve", "export"],
      customers: ["view", "edit"],
      reports: ["view", "export"],
      settings: []
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
      categories: ["view"],
      brands: ["view"],
      flash_sale: ["view"],
      trading: ["view"],
      orders: ["view", "process"],
      messages: ["view", "reply"],
      inventory: ["view"],
      purchases: ["view"],
      suppliers: ["view"],
      attendance: ["view", "checkin"],
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
      categories: ["view"],
      brands: ["view"],
      flash_sale: ["view"],
      trading: ["view"],
      orders: ["view"],
      messages: ["view"],
      inventory: ["view", "adjust", "reorder"],
      purchases: ["view", "create"],
      suppliers: ["view", "create"],
      attendance: ["view", "checkin"],
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
      categories: ["view"],
      brands: ["view"],
      flash_sale: ["view"],
      trading: ["view"],
      orders: ["view"],
      messages: ["view", "reply", "delete"],
      inventory: ["view"],
      purchases: [],
      suppliers: [],
      attendance: ["view", "checkin"],
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
  abaApiKey: "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
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
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePermissions();
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, isKhmer, t } = useTranslation();

  // Guard: if user does not have view permission for settings, block rendering and show AccessDeniedView
  if (!isSuperAdmin && !can("settings", "view")) {
    return <AccessDeniedView moduleName={isKhmer ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž”áŸ’ážšáž–áŸáž“áŸ’áž’ (System Settings)" : "System Settings & RBAC"} />;
  }

  const [activeTab, setActiveTab] = useState("appearance_language");

  // State Management with LocalStorage Fallback
  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem("angkor_admin_roles_v2") || localStorage.getItem("angkor_admin_roles_v1");
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
  const [staffForm, setStaffForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    roleId: "1", 
    status: "Active" 
  });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // 6-Digit Security PIN States
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const [pinForm, setPinForm] = useState({
    pin: "",
    confirmPin: "",
  });
  const [showPinInput, setShowPinInput] = useState(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const handleSavePin = async () => {
    if (!currentUser?.id) {
      Swal.fire({
        icon: "error",
        title: isKhmer ? "áž˜áž·áž“ážŸáŸ’áž‚áž¶áž›áŸ‹áž¢áŸ’áž“áž€áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹" : "User Not Found",
        text: isKhmer ? "ážŸáž¼áž˜áž…áž¼áž›áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹áž˜áŸ’ážáž„áž‘áŸ€áž" : "Please re-login to update security PIN",
      });
      return;
    }

    const cleanPin = String(pinForm.pin || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      Swal.fire({
        icon: "warning",
        title: isKhmer ? "áž€áž¼ážŠ PIN ážáŸ’ážšáž¼ážœážáŸ‚áž˜áž¶áž“ áŸ¦ ážáŸ’áž‘áž„áŸ‹" : "6-Digit PIN Required",
        text: isKhmer ? "áž€áž¼ážŠ PIN ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž–ážáŸ’ážšáž¼ážœážáŸ‚áž‡áž¶áž›áŸáž áŸ¦ ážáŸ’áž‘áž„áŸ‹áž‚ážáŸ‹ (áž§. 123456)" : "Security PIN must be exactly 6 numeric digits (e.g. 123456).",
      });
      return;
    }

    if (pinForm.pin !== pinForm.confirmPin) {
      Swal.fire({
        icon: "warning",
        title: isKhmer ? "áž€áž¼ážŠ PIN áž˜áž·áž“ážáŸ’ážšáž¼ážœáž‚áŸ’áž“áž¶" : "PINs Do Not Match",
        text: isKhmer ? "ážŸáž¼áž˜áž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹áž€áž¼ážŠ PIN áž‘áž¶áŸ†áž„áž–áž¸ážšáž”áŸ’ážšáž¢áž”áŸ‹áž±áŸ’áž™ážŠáž¼áž…áž‚áŸ’áž“áž¶" : "Please ensure both PIN fields match exactly.",
      });
      return;
    }

    try {
      setIsUpdatingPin(true);
      await enableStaff2FAApi(currentUser.id, cleanPin);
      localStorage.setItem("angkor_staff_pin", cleanPin);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      Swal.fire({
        icon: "success",
        title: isKhmer ? "áž”áž¶áž“áž€áŸ†ážŽážáŸ‹áž€áž¼ážŠ PIN áŸ¦ ážáŸ’áž‘áž„áŸ‹áž‡áŸ„áž‚áž‡áŸáž™!" : "6-Digit Security PIN Saved!",
        text: isKhmer
          ? "áž€áž¼ážŠ PIN áŸ¦ ážáŸ’áž‘áž„áŸ‹ážáŸ’ážšáž¼ážœáž”áž¶áž“áž”áž¾áž€ážŠáŸ†ážŽáž¾ážšáž€áž¶ážšážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž‚ážŽáž“áž¸ážšáž”ážŸáŸ‹áž¢áŸ’áž“áž€ážšáž½áž…ážšáž¶áž›áŸ‹áŸ”"
          : "Your 6-digit security PIN has been activated for this account.",
        timer: 2000,
        showConfirmButton: false,
      });

      setPinForm({ pin: "", confirmPin: "" });
      loadStaffAndRoles();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: isKhmer ? "áž”ážšáž¶áž‡áŸáž™áž€áŸ’áž“áž»áž„áž€áž¶ážšáž€áŸ†ážŽážáŸ‹ PIN" : "Failed to Set PIN",
        text: err?.response?.data?.message || err?.message || "Could not configure security PIN.",
      });
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleDisablePin = async () => {
    if (!currentUser?.id) return;

    Swal.fire({
      title: isKhmer ? "áž”áž·áž‘áž€áž¼ážŠ PIN ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž–?" : "Disable Security PIN?",
      text: isKhmer ? "ážáž¾áž¢áŸ’áž“áž€áž…áž„áŸ‹áž”áž·áž‘áž€áž¶ážšáž‘áž¶áž˜áž‘áž¶ážšáž€áž¼ážŠ PIN áž–áŸáž›áž…áž¼áž›áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹áž˜áŸ‚áž“áž‘áŸ?" : "Are you sure you want to remove 2FA PIN protection from this account?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "áž”áž¶áž‘/áž…áž¶ážŸ áž”áž·áž‘ PIN" : "Yes, Disable PIN",
      cancelButtonText: isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          setIsUpdatingPin(true);
          await disableStaff2FAApi(currentUser.id);
          localStorage.removeItem("angkor_staff_pin");
          Swal.fire({
            icon: "success",
            title: isKhmer ? "áž”áž¶áž“áž”áž·áž‘ PIN ážšáž½áž…ážšáž¶áž›áŸ‹" : "PIN Disabled",
            text: isKhmer ? "áž€áž¶ážšáž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹ PIN ážáŸ’ážšáž¼ážœáž”áž¶áž“áž”áž·áž‘ážŠáŸ„áž™áž‡áŸ„áž‚áž‡áŸáž™áŸ”" : "Security PIN verification has been disabled.",
          });
          loadStaffAndRoles();
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err?.response?.data?.message || err?.message || "Could not disable PIN.",
          });
        } finally {
          setIsUpdatingPin(false);
        }
      }
    });
  };

  const loadStaffAndRoles = async () => {
    try {
      setStaffLoading(true);
      const [staffRes, rolesRes] = await Promise.allSettled([
        StaffApi(),
        RolesApi()
      ]);

      if (rolesRes.status === "fulfilled" && rolesRes.value) {
        const payload = rolesRes.value?.data || rolesRes.value?.roles || rolesRes.value;
        const rawRoles = Array.isArray(payload) ? payload : [];
        if (rawRoles.length > 0) {
          const apiRoles = rawRoles.map((r) => {
            const roleType =
              String(r.name).toLowerCase().includes("super")
                ? "super"
                : String(r.name).toLowerCase().includes("admin")
                ? "super"
                : String(r.name).toLowerCase().includes("manager")
                ? "manager"
                : "staff";

            let permissionsMap = {};
            if (r.permissions) {
              if (typeof r.permissions === "string") {
                try {
                  permissionsMap = JSON.parse(r.permissions);
                } catch {
                  permissionsMap = {};
                }
              } else if (typeof r.permissions === "object" && !Array.isArray(r.permissions)) {
                permissionsMap = r.permissions;
              } else if (Array.isArray(r.permissions)) {
                r.permissions.forEach((item) => {
                  if (typeof item === "string") {
                    const parts = item.includes(".") ? item.split(".") : item.split(":");
                    const mod = parts[0];
                    const act = parts[1] || "view";
                    if (mod && act) {
                      if (!permissionsMap[mod]) permissionsMap[mod] = [];
                      if (!permissionsMap[mod].includes(act)) permissionsMap[mod].push(act);
                    }
                  }
                });
              }
            }

            // Fallback to default presets if backend returns empty permissions
            if (Object.keys(permissionsMap).length === 0) {
              const matchedDefault = DEFAULT_ROLES.find(
                (dr) => dr.name.toLowerCase() === String(r.name).toLowerCase()
              );
              if (matchedDefault) {
                permissionsMap = matchedDefault.permissions;
              } else if (roleType === "super") {
                PERMISSION_MODULES.forEach((m) => {
                  permissionsMap[m.id] = [...m.actions];
                });
              } else {
                permissionsMap = {
                  dashboard: ["view"],
                  products: ["view", "create"],
                  categories: ["view"],
                  brands: ["view"],
                  flash_sale: ["view"],
                  trading: ["view"],
                  orders: ["view", "process"],
                  messages: ["view", "reply"],
                  inventory: ["view"],
                  purchases: ["view"],
                  suppliers: ["view"],
                  attendance: ["view", "checkin"],
                  customers: ["view"],
                  reports: ["view"],
                  settings: []
                };
              }
            }

            return {
              id: r.id,
              name: r.name,
              desc: r.description || `${r.name} role`,
              type: roleType,
              permissions: permissionsMap
            };
          });

          setRoles(apiRoles);
          setSelectedRoleId((prevId) => {
            if (prevId && apiRoles.some((ar) => String(ar.id) === String(prevId))) {
              return prevId;
            }
            return apiRoles[0]?.id;
          });
        }
      }

      if (staffRes.status === "fulfilled" && staffRes.value) {
        const payload = staffRes.value?.data || staffRes.value?.users || staffRes.value;
        const rawStaff = Array.isArray(payload) ? payload : [];
        const staffData = rawStaff.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          roleId: u.roles?.[0]?.id || u.role_id || "1",
          roleName: u.roles?.map((r) => r.name).join(", ") || (u.role || "Staff"),
          status: u.is_active ? "Active" : "Inactive",
          lastLogin: u.last_login ? new Date(u.last_login).toLocaleDateString() : "Active recently"
        }));
        setStaff(staffData);
      }
    } catch (err) {
      console.warn("Could not sync staff/roles from API:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndRoles();
  }, []);

  const currentRole = roles.find((r) => String(r.id) === String(selectedRoleId)) || roles[0] || {
    id: "default",
    name: "Role",
    permissions: {}
  };

  // Dedicated Save Role Permissions to Backend API (/api/roles/:id)
  const handleSaveRolePermissions = async (roleIdToSave = selectedRoleId) => {
    const targetRole = roles.find((r) => String(r.id) === String(roleIdToSave));
    if (!targetRole) return;

    if (targetRole.id === "super_admin" || String(targetRole.name).toLowerCase().includes("super")) {
      Swal.fire({
        icon: "info",
        title: isKhmer ? "ážŠáŸ†ážŽáž¹áž„" : "Super Admin Permissions",
        text: isKhmer
          ? "Super Administrator áž˜áž¶áž“ážŸáž·áž‘áŸ’áž’áž·áž–áŸáž‰áž›áŸáž‰áž›áž¾áž‚áŸ’ážšáž”áŸ‹áž•áŸ’áž“áŸ‚áž€áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹áž“áŸƒáž”áŸ’ážšáž–áŸáž“áŸ’áž’áž‡áž¶ážŸáŸ’ážœáŸáž™áž”áŸ’ážšážœážáŸ’ážáž·áŸ”"
          : "Super Administrator holds permanent full system permissions across all modules.",
        confirmButtonColor: "#166534"
      });
      return;
    }

    try {
      setIsSavingRole(true);
      // Persist to local state
      localStorage.setItem("angkor_admin_roles_v2", JSON.stringify(roles));
      localStorage.removeItem("angkor_admin_roles_v1");
      window.dispatchEvent(new Event("angkor_roles_updated"));

      // Call Backend API PUT /api/roles/:id
      await updateRoleApi(targetRole.id, {
        name: targetRole.name,
        description: targetRole.desc,
        permissions: targetRole.permissions
      });

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      Swal.fire({
        icon: "success",
        title: isKhmer ? "áž”áž¶áž“ážšáž€áŸ’ážŸáž¶áž‘áž»áž€ážŸáž·áž‘áŸ’áž’áž·áž‡áŸ„áž‚áž‡áŸáž™!" : "Role Permissions Saved!",
        text: isKhmer
          ? `ážŸáž·áž‘áŸ’áž’áž·ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ážáž½áž“áž¶áž‘áž¸ "${targetRole.name}" ážáŸ’ážšáž¼ážœáž”áž¶áž“áž’áŸ’ážœáž¾áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áž—áž¶áž–áž€áŸ’áž“áž»áž„ Database ážáž¶áž˜ážšáž™áŸˆ Backend API ážšáž½áž…ážšáž¶áž›áŸ‹áŸ”`
          : `Permissions for "${targetRole.name}" have been updated and synced to backend database (/api/roles/${targetRole.id}).`,
        timer: 2200,
        showConfirmButton: false,
        confirmButtonColor: "#166534"
      });
    } catch (error) {
      console.error("Failed to sync role permissions to API:", error);
      Swal.fire({
        icon: "error",
        title: isKhmer ? "áž”ážšáž¶áž‡áŸáž™áž€áŸ’áž“áž»áž„áž€áž¶ážšážšáž€áŸ’ážŸáž¶áž‘áž»áž€" : "Failed to Sync with API",
        text: error?.response?.data?.message || error?.message || "Could not sync role permissions to backend database.",
        confirmButtonColor: "#dc2626"
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  // Grant All actions for the active role
  const handleGrantAllForRole = () => {
    if (selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super")) return;
    const fullPermissions = {};
    PERMISSION_MODULES.forEach((m) => {
      fullPermissions[m.id] = [...m.actions];
    });
    setRoles((prev) =>
      prev.map((r) =>
        String(r.id) === String(selectedRoleId)
          ? { ...r, permissions: fullPermissions }
          : r
      )
    );
  };

  // Revoke All actions for the active role
  const handleRevokeAllForRole = () => {
    if (selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super")) return;
    const emptyPermissions = {};
    PERMISSION_MODULES.forEach((m) => {
      emptyPermissions[m.id] = [];
    });
    setRoles((prev) =>
      prev.map((r) =>
        String(r.id) === String(selectedRoleId)
          ? { ...r, permissions: emptyPermissions }
          : r
      )
    );
  };

  // Save changes to localStorage & backend API
  const handleSaveAll = async () => {
    try {
      localStorage.setItem("angkor_admin_roles_v1", JSON.stringify(roles));
      localStorage.setItem("angkor_admin_staff_v1", JSON.stringify(staff));
      localStorage.setItem("angkor_admin_settings_v1", JSON.stringify(settings));
      window.dispatchEvent(new Event("angkor_roles_updated"));

      // Sync updated role permissions to backend API (/api/roles/:id)
      const roleUpdates = roles.map((r) => {
        if (!r.id || r.id === "super_admin") return Promise.resolve();
        return updateRoleApi(r.id, {
          name: r.name,
          description: r.desc,
          permissions: r.permissions
        }).catch((err) => console.warn(`Could not sync role ${r.name} to API:`, err));
      });
      await Promise.allSettled(roleUpdates);

      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      Swal.fire({
        icon: "success",
        title: isKhmer ? "áž”áž¶áž“ážšáž€áŸ’ážŸáž¶áž‘áž»áž€áž‡áŸ„áž‚áž‡áŸáž™!" : "Settings Saved!",
        text: isKhmer
          ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹ážšáž¼áž”ážšáž¶áž„ áž—áž¶ážŸáž¶ ážŸáž·áž‘áŸ’áž’áž·áž”áž»áž‚áŸ’áž‚áž›áž·áž€ áž“áž·áž„áž–áŸážáŸŒáž˜áž¶áž“áž‘áž¼áž‘áŸ…ážáŸ’ážšáž¼ážœáž”áž¶áž“áž’áŸ’ážœáž¾áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áž—áž¶áž–áž€áŸ’áž“áž»áž„áž”áŸ’ážšáž–áŸáž“áŸ’áž’ áž“áž·áž„ DatabaseáŸ”"
          : "Appearance, language, RBAC permissions, and store configurations have been updated and synced to database.",
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
      title: isKhmer ? "áž€áŸ†ážŽážáŸ‹áž¡áž¾áž„ážœáž·áž‰ážŠáž¼áž…ážŠáž¾áž˜?" : "Reset to System Defaults?",
      text: isKhmer
        ? "ážœáž¶áž“áž¹áž„ážŸáŸ’ážŠáž¶ážšáž€áž¶ážšáž€áŸ†ážŽážáŸ‹ážšáž¼áž”ážšáž¶áž„ áž—áž¶ážŸáž¶ ážáž½áž“áž¶áž‘áž¸ áž“áž·áž„áž”áŸ’ážšáž–áŸáž“áŸ’áž’áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹áž‘áŸ…áž€áž¶áž“áŸ‹áž›áŸ†áž“áž¶áŸ†ážŠáž¾áž˜ážœáž·áž‰áŸ”"
        : "This will restore all default appearances, roles, permissions, and system configurations.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "áž”áž¶áž‘/áž…áž¶ážŸ áž€áŸ†ážŽážáŸ‹áž¡áž¾áž„ážœáž·áž‰" : "Yes, Reset",
      cancelButtonText: isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel"
    }).then((res) => {
      if (res.isConfirmed) {
        setTheme("system");
        setLanguage("km");
        setRoles(DEFAULT_ROLES);
        setStaff(DEFAULT_STAFF);
        setSettings(DEFAULT_SYSTEM_SETTINGS);
        setSelectedRoleId(DEFAULT_ROLES[0].id);

        localStorage.removeItem("angkor_admin_roles_v2");
        localStorage.removeItem("angkor_admin_roles_v1");
        localStorage.removeItem("angkor_admin_staff_v1");
        localStorage.removeItem("angkor_admin_settings_v1");
        window.dispatchEvent(new Event("angkor_roles_updated"));

        Swal.fire(
          isKhmer ? "áž”áž¶áž“ážŸáŸ’ážŠáž¶ážšážšáž½áž…ážšáž¶áž›áŸ‹" : "Reset Completed",
          isKhmer ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž›áŸ†áž“áž¶áŸ†ážŠáž¾áž˜ážáŸ’ážšáž¼ážœáž”áž¶áž“ážŸáŸ’ážŠáž¶ážšáž‡áŸ„áž‚áž‡áŸáž™áŸ”" : "Default configuration restored.",
          "success"
        );
      }
    });
  };

  // Toggle single action permission
  const handleTogglePermission = (moduleId, action) => {
    if (selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super")) {
      Swal.fire(
        isKhmer ? "ážŠáŸ†ážŽáž¹áž„" : "Notice",
        isKhmer
          ? "Super Administrator áž˜áž¶áž“ážŸáž·áž‘áŸ’áž’áž·áž–áŸáž‰áž›áŸáž‰áž›áž¾áž‚áŸ’ážšáž”áŸ‹áž•áŸ’áž“áŸ‚áž€áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹áž“áŸƒáž”áŸ’ážšáž–áŸáž“áŸ’áž’áž‡áž¶áž¢áž…áž·áž“áŸ’ážáŸ’ážšáŸƒáž™áŸáŸ”"
          : "Super Administrator holds permanent full system permissions.",
        "info"
      );
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRoleId) return role;

        const currentModulePerms = role.permissions?.[moduleId] || [];
        const hasAction = currentModulePerms.includes(action);

        const updatedModulePerms = hasAction
          ? currentModulePerms.filter((a) => a !== action)
          : [...currentModulePerms, action];

        return {
          ...role,
          permissions: {
            ...(role.permissions || {}),
            [moduleId]: updatedModulePerms
          }
        };
      })
    );
  };

  // Toggle all actions for a module
  const handleToggleModuleAll = (module) => {
    if (selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super")) return;

    const currentModulePerms = currentRole?.permissions?.[module.id] || [];
    const allActions = module.actions;
    const isAllChecked = allActions.every((a) => currentModulePerms.includes(a));

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRoleId) return role;
        return {
          ...role,
          permissions: {
            ...(role.permissions || {}),
            [module.id]: isAllChecked ? [] : [...allActions]
          }
        };
      })
    );
  };

  // Add new Role to DB with API (POST /api/roles)
  const handleCreateRole = async (e) => {
    e.preventDefault();
    const roleName = newRoleForm.name.trim();
    if (!roleName) {
      Swal.fire("Warning", isKhmer ? "ážŸáž¼áž˜áž”áž‰áŸ’áž…áž¼áž›ážˆáŸ’áž˜áŸ„áŸ‡ážáž½áž“áž¶áž‘áž¸" : "Please enter role title", "warning");
      return;
    }

    try {
      const res = await createRoleApi({
        name: roleName,
        description: newRoleForm.desc.trim() || undefined
      });

      const createdRole = res?.data || res?.role || res;
      const createdId = createdRole?.id;

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}

      await loadStaffAndRoles();

      if (createdId) {
        setSelectedRoleId(createdId);
      }

      setNewRoleForm({ name: "", desc: "" });
      setRoleModalOpen(false);

      Swal.fire({
        title: isKhmer ? "áž”áž„áŸ’áž€áž¾ážážáž½áž“áž¶áž‘áž¸áž‡áŸ„áž‚áž‡áŸáž™!" : "Role Created Successfully!",
        text: isKhmer
          ? `ážáž½áž“áž¶áž‘áž¸ "${roleName}" ážáŸ’ážšáž¼ážœáž”áž¶áž“ážšáž€áŸ’ážŸáž¶áž‘áž»áž€áž€áŸ’áž“áž»áž„ Database ážáž¶áž˜ážšáž™áŸˆ API (/api/roles)áŸ”`
          : `Role "${roleName}" was created and saved to database via /api/roles.`,
        icon: "success",
        timer: 2500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Failed to create role via API:", error);
      Swal.fire({
        title: isKhmer ? "áž”ážšáž¶áž‡áŸáž™áž€áŸ’áž“áž»áž„áž€áž¶ážšáž”áž„áŸ’áž€áž¾ážážáž½áž“áž¶áž‘áž¸" : "Failed to Create Role",
        text: error?.response?.data?.message || error?.message || "Could not save role to database via /api/roles.",
        icon: "error",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  // Delete Role from DB with API (DELETE /api/roles/:id)
  const handleDeleteRole = (roleId, roleName) => {
    const isProtected =
      String(roleName).toLowerCase().includes("super") ||
      String(roleName).toLowerCase().includes("admin");

    if (isProtected) {
      Swal.fire("Action Blocked", "Super Admin and Admin roles cannot be deleted.", "warning");
      return;
    }

    Swal.fire({
      title: isKhmer ? `áž›áž»áž”ážáž½áž“áž¶áž‘áž¸ "${roleName}"?` : `Delete "${roleName}"?`,
      text: isKhmer ? "ážáž½áž“áž¶áž‘áž¸áž“áŸáŸ‡áž“áž¹áž„ážáŸ’ážšáž¼ážœáž›áž»áž”áž…áŸáž‰áž–áž¸ Database ážáž¶áž˜ážšáž™áŸˆ API (/api/roles)áŸ”" : "This role will be deleted from the database via /api/roles.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: isKhmer ? "áž”áž¶áž‘/áž…áž¶ážŸ áž›áž»áž”" : "Delete Role",
      cancelButtonText: isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteRoleApi(roleId);
          await loadStaffAndRoles();
          Swal.fire(isKhmer ? "áž”áž¶áž“áž›áž»áž”!" : "Deleted!", `Role "${roleName}" removed.`, "success");
        } catch (error) {
          Swal.fire("Error", error?.response?.data?.message || error?.message || "Failed to delete role", "error");
        }
      }
    });
  };

  // Save / Edit Staff via API
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    const matchedRole = roles.find((r) => String(r.id) === String(staffForm.roleId));
    const roleName = matchedRole ? matchedRole.name : "Custom Role";

    try {
      if (selectedStaff) {
        // Update staff via API
        await updateStaffApi(selectedStaff.id, {
          name: staffForm.name,
          email: staffForm.email,
          phone: staffForm.phone,
          role_id: staffForm.roleId,
          is_active: staffForm.status === "Active"
        });

        setStaff((prev) =>
          prev.map((s) =>
            s.id === selectedStaff.id
              ? {
                  ...s,
                  name: staffForm.name,
                  email: staffForm.email,
                  phone: staffForm.phone,
                  roleId: staffForm.roleId,
                  roleName,
                  status: staffForm.status
                }
              : s
          )
        );
        Swal.fire(isKhmer ? "áž‡áŸ„áž‚áž‡áŸáž™!" : "Staff Updated", isKhmer ? "áž–áŸážáŸŒáž˜áž¶áž“áž”áž»áž‚áŸ’áž‚áž›áž·áž€ážáŸ’ážšáž¼ážœáž”áž¶áž“áž€áŸ‚áž”áŸ’ážšáŸ‚áŸ”" : "User details and role refreshed.", "success");
      } else {
        if (!staffForm.password || staffForm.password.length < 6) {
          Swal.fire("Warning", isKhmer ? "áž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážáŸ’ážšáž¼ážœáž˜áž¶áž“áž™áŸ‰áž¶áž„ážáž·áž… áŸ¦ ážáž½!" : "Password must be at least 6 characters long.", "warning");
          return;
        }

        // Create new staff via API
        const res = await createStaffApi({
          name: staffForm.name,
          email: staffForm.email,
          phone: staffForm.phone || "",
          password: staffForm.password,
          role_id: staffForm.roleId,
          is_active: staffForm.status === "Active"
        });

        const createdId = res?.data?.id || Date.now();
        const newMember = {
          id: createdId,
          name: staffForm.name,
          email: staffForm.email,
          phone: staffForm.phone,
          roleId: staffForm.roleId,
          roleName,
          status: staffForm.status,
          lastLogin: "Never"
        };
        setStaff((prev) => [newMember, ...prev]);
        Swal.fire(isKhmer ? "áž‡áŸ„áž‚áž‡áŸáž™!" : "Staff Added", isKhmer ? "áž‚ážŽáž“áž¸áž”áž»áž‚áŸ’áž‚áž›áž·áž€ážáŸ’áž˜áž¸ážáŸ’ážšáž¼ážœáž”áž¶áž“áž”áž„áŸ’áž€áž¾ážáŸ”" : "New administrator user created.", "success");
      }

      setStaffModalOpen(false);
      loadStaffAndRoles();
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to save staff member", "error");
    }
  };

  // Delete Staff via API
  const handleDeleteStaff = (member) => {
    Swal.fire({
      title: isKhmer ? `áž›áž»áž”áž”áž»áž‚áŸ’áž‚áž›áž·áž€ ${member.name}?` : `Delete Staff ${member.name}?`,
      text: isKhmer ? "ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–áž“áŸáŸ‡áž˜áž·áž“áž¢áž¶áž…ážáŸ’ážšáž¡áž”áŸ‹ážœáž·áž‰áž”áž¶áž“áž‘áŸáŸ”" : "This staff account will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "áž”áž¶áž‘/áž…áž¶ážŸ áž›áž»áž”" : "Yes, Delete",
      cancelButtonText: isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteStaffApi(member.id);
          setStaff((prev) => prev.filter((s) => s.id !== member.id));
          Swal.fire(isKhmer ? "áž”áž¶áž“áž›áž»áž”!" : "Deleted!", isKhmer ? "áž”áž»áž‚áŸ’áž‚áž›áž·áž€ážáŸ’ážšáž¼ážœáž”áž¶áž“áž›áž»áž”áž…áŸáž‰áž–áž¸áž”áŸ’ážšáž–áŸáž“áŸ’áž’áŸ”" : "Staff member has been removed.", "success");
        } catch (error) {
          Swal.fire("Error", error.message || "Failed to delete staff", "error");
        }
      }
    });
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
            <h1>{isKhmer ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž”áŸ’ážšáž–áŸáž“áŸ’áž’ & ážŸáž·áž‘áŸ’áž’áž·áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„ Admin" : "Admin Settings & RBAC Control"}</h1>
            <p>
              {isKhmer
                ? "áž€áŸ†ážŽážáŸ‹ážšáž¼áž”ážšáž¶áž„ ážŸáŸ’áž”áŸ‚áž€áž–ážŽáŸŒ áž—áž¶ážŸáž¶ ážŸáž·áž‘áŸ’áž’áž·ážáž½áž“áž¶áž‘áž¸áž”áž»áž‚áŸ’áž‚áž›áž·áž€ áž’áž“áž¶áž‚áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹ áž“áž·áž„ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž–áž‘áž¼áž‘áŸ…áž“áŸƒáž”áŸ’ážšáž–áŸáž“áŸ’áž’áŸ”"
                : "Configure appearance theme, language, role-based access permissions, payment gateways, and security preferences."}
            </p>
          </div>
        </div>

        {can("settings", "edit") && (
          <div className="settings-header-actions">
            <button type="button" className="btn-outline-secondary" onClick={handleResetDefaults}>
              <RotateCcw size={15} />
              <span>{isKhmer ? "áž€áŸ†ážŽážáŸ‹ážŠáž¾áž˜áž¡áž¾áž„ážœáž·áž‰" : "Reset Defaults"}</span>
            </button>
            <button type="button" className="btn-save-primary" onClick={handleSaveAll}>
              <Save size={16} />
              <span>{isKhmer ? "ážšáž€áŸ’ážŸáž¶áž‘áž»áž€áž€áž¶ážšáž•áŸ’áž›áž¶ážŸáŸ‹áž”áŸ’ážáž¼ážš" : "Save All Changes"}</span>
            </button>
          </div>
        )}
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
          <span>{isKhmer ? "ážšáž¼áž”ážšáž¶áž„ & áž—áž¶ážŸáž¶" : "Theme & Language"}</span>
          <span className="tab-pill-badge">{language === "km" ? "ðŸ‡°ðŸ‡­ KM" : "ðŸ‡ºðŸ‡¸ EN"}</span>
        </button>

        {/* Tab 2: Roles & Permissions */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "roles_permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("roles_permissions")}
        >
          <Shield size={16} />
          <span>{isKhmer ? "ážáž½áž“áž¶áž‘áž¸ & ážŸáž·áž‘áŸ’áž’áž· (RBAC)" : "Roles & RBAC Matrix"}</span>
        </button>

        {/* Tab 3: Staff Users */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "staff_users" ? "active" : ""}`}
          onClick={() => setActiveTab("staff_users")}
        >
          <Users size={16} />
          <span>{isKhmer ? `áž”áž‰áŸ’áž‡áž¸áž”áž»áž‚áŸ’áž‚áž›áž·áž€ (${staff.length})` : `Staff Directory (${staff.length})`}</span>
        </button>

        {/* Tab 4: Store Profile */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          <Store size={16} />
          <span>{isKhmer ? "áž–áŸážáŸŒáž˜áž¶áž“áž‘áž¼áž‘áŸ…áž áž¶áž„" : "Store & Mall Profile"}</span>
        </button>

        {/* Tab 5: Payments */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          <CreditCard size={16} />
          <span>{isKhmer ? "áž’áž“áž¶áž‚áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹" : "Payment Gateways"}</span>
        </button>

        {/* Tab 6: Shipping */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
          onClick={() => setActiveTab("shipping")}
        >
          <Truck size={16} />
          <span>{isKhmer ? "áž€áž¶ážšážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“" : "Delivery & Shipping"}</span>
        </button>

        {/* Tab 7: Security */}
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Lock size={16} />
          <span>{isKhmer ? "ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž– & áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„" : "Security & Alerts"}</span>
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
                  <span>{isKhmer ? "ážŸáŸ’áž”áŸ‚áž€áž–ážŽáŸŒ áž“áž·áž„ážšáž¼áž”ážšáž¶áž„ (Theme & Appearance Mode)" : "Theme & Appearance Mode"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "áž•áŸ’áž›áž¶ážŸáŸ‹áž”áŸ’ážáž¼ážšážšáž¼áž”ážšáž¶áž„áž—áŸ’áž›ážº áž„áž„áž¹áž áž¬ážáž¶áž˜áž”áŸ’ážšáž–áŸáž“áŸ’áž’áž€áž»áŸ†áž–áŸ’áž™áž¼áž‘áŸážš/áž‘áž¼ážšážŸáŸáž–áŸ’áž‘ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž•áŸ’áž‘áž¶áŸ†áž„ Admin áž“áž·áž„áž‚áŸáž áž‘áŸ†áž–áŸážšáž‘áž¶áŸ†áž„áž˜áž¼áž›áŸ”"
                    : "Select your preferred visual mode for the admin suite and storefront. Instant real-time toggle."}
                </p>
              </div>
              <div className="theme-current-pill">
                <span className="dot-pulse" />
                <span>
                  {isKhmer ? "ážŸáŸ’áž”áŸ‚áž€áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áŸ– " : "Active Mode: "}
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
                      <h4>{isKhmer ? "áž–áž“áŸ’áž›ážº (Light Mode)" : "Light Mode"}</h4>
                      <small>{isKhmer ? "áž•áŸ’áž‘áŸƒážŸáž—áŸ’áž›ážºáž…áŸ’áž”áž¶ážŸáŸ‹ áž„áž¶áž™ážŸáŸ’ážšáž½áž›áž˜áž¾áž›áž–áŸáž›ážáŸ’áž„áŸƒ" : "Clean, crisp bright presentation"}</small>
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
                      <h4>{isKhmer ? "áž„áž„áž¹áž (Dark Mode)" : "Dark Mode"}</h4>
                      <small>{isKhmer ? "áž•áŸ’áž‘áŸƒážáŸ’áž˜áŸ…áž”áŸ’ážšážŽáž·áž áž€áž¶ážáŸ‹áž”áž“áŸ’ážáž™áž…áŸ†ážŽáž¶áŸ†áž„áž–áž“áŸ’áž›ážº" : "Deep luxury dark theme for reduced eye strain"}</small>
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
                      <h4>{isKhmer ? "ážáž¶áž˜áž§áž”áž€ážšážŽáŸ (System Auto)" : "System Default"}</h4>
                      <small>{isKhmer ? "áž•áŸ’áž›áž¶ážŸáŸ‹áž”áŸ’ážáž¼ážšážŸáŸ’ážœáŸáž™áž”áŸ’ážšážœážáŸ’ážáž·ážáž¶áž˜áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž§áž”áž€ážšážŽáŸ" : "Automatically syncs with device OS theme"}</small>
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
                  <span>{isKhmer ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž—áž¶ážŸáž¶ (Language & Localization)" : "Language & Localization Selection"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸáž—áž¶ážŸáž¶áž…áž˜áŸ’áž”áž„ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„áž‘áž·áž“áŸ’áž“áž“áŸáž™ ážšáž”áž¶áž™áž€áž¶ážšážŽáŸ áž“áž·áž„áž€áž¶ážšáž”áž„áŸ’áž áž¶áž‰áž›áž¾áž‚áŸáž áž‘áŸ†áž–áŸážšáŸ”"
                    : "Select your active language. Changes apply immediately across all modules, sidebar, tables, and AI assistant."}
                </p>
              </div>
              <div className="theme-current-pill">
                <span>
                  {isKhmer ? "áž—áž¶ážŸáž¶ážŸáž€áž˜áŸ’áž˜áŸ– " : "Active Language: "}
                  <strong>{language === "km" ? "ðŸ‡°ðŸ‡­ áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážš (Khmer)" : "ðŸ‡ºðŸ‡¸ English (US)"}</strong>
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
                  <span className="lang-flag-emoji">ðŸ‡°ðŸ‡­</span>
                  <span className="lang-code-pill">KM</span>
                </div>
                <div className="lang-card-details">
                  <h4>áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážš (Khmer)</h4>
                  <p>áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážšáž–áŸáž‰áž›áŸáž‰ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž•áŸ’áž‘áž¶áŸ†áž„ Admin áž•áž›áž·ážáž•áž› áž€áž¶ážšáž”áž‰áŸ’áž‡áž¶áž‘áž·áž‰ áž“áž·áž„ážŸáž¶ážšáž‡áŸ†áž“áž½áž™áž€áž¶ážš AI</p>
                  <div className="lang-feature-tags">
                    <span className="lang-tag">âœ“ áž•áŸ’áž‘áž¶áŸ†áž„áž”áž‰áŸ’áž‡áž¶áž‡áž¶áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážš</span>
                    <span className="lang-tag">âœ“ ážŸáŸ†áž¡áŸáž„ AI ážáŸ’áž˜áŸ‚ážš</span>
                    <span className="lang-tag">âœ“ áž‘áŸ’ážšáž„áŸ‹áž‘áŸ’ážšáž¶áž™áž”áŸ’ážšáž¶áž€áŸ‹ážšáŸ€áž› (KHR)</span>
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
                  <span className="lang-flag-emoji">ðŸ‡ºðŸ‡¸</span>
                  <span className="lang-code-pill">EN</span>
                </div>
                <div className="lang-card-details">
                  <h4>English (US)</h4>
                  <p>Standard International English interface for back-office administration, inventory, and analytics.</p>
                  <div className="lang-feature-tags">
                    <span className="lang-tag">âœ“ Full English UI</span>
                    <span className="lang-tag">âœ“ AI Voice in English</span>
                    <span className="lang-tag">âœ“ USD ($) Standards</span>
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
                  <span>{isKhmer ? "áž€áž¶ážšáž€áŸ†ážŽážáŸ‹áž›áŸ†áž“áž¶áŸ†ážŠáž¾áž˜ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž¢ážáž·ážáž·áž‡áž“ áž“áž·áž„ AI" : "Storefront & AI Assistant Defaults"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "áž€áŸ†ážŽážáŸ‹áž—áž¶ážŸáž¶ áž“áž·áž„ážŸáŸ’áž”áŸ‚áž€áž–ážŽáŸŒážŠáŸ†áž”áž¼áž„áž–áŸáž›ážŠáŸ‚áž›áž¢ážáž·ážáž·áž‡áž“ážáŸ’áž˜áž¸áž…áž¼áž›áž‘ážŸáŸ’ážŸáž“áž¶áž‚áŸáž áž‘áŸ†áž–áŸážšážšáž”ážŸáŸ‹áž¢áŸ’áž“áž€"
                    : "Specify default preferences presented to first-time shoppers and guest visitors."}
                </p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "áž—áž¶ážŸáž¶ážŠáŸ†áž”áž¼áž„ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž¢ážáž·ážáž·áž‡áž“ážáŸ’áž˜áž¸" : "Default Storefront Language"}</label>
                <select
                  className="settings-select"
                  value={settings.defaultStoreLanguage || "km"}
                  onChange={(e) => setSettings({ ...settings, defaultStoreLanguage: e.target.value })}
                >
                  <option value="km">ðŸ‡°ðŸ‡­ áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážš (Khmer) - Recommended</option>
                  <option value="en">ðŸ‡ºðŸ‡¸ English (US)</option>
                </select>
                <span className="form-helper-text">
                  {isKhmer ? "áž—áž¶ážŸáž¶ážŠáŸ‚áž›ážáŸ’ážšáž¼ážœáž”áž„áŸ’áž áž¶áž‰áž–áŸáž›áž¢ážáž·ážáž·áž‡áž“áž”áž¾áž€áž‚áŸáž áž‘áŸ†áž–áŸážšáž›áž¾áž€ážŠáŸ†áž”áž¼áž„" : "Default language shown to new visitors on first launch"}
                </span>
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "ážŸáŸ’áž”áŸ‚áž€áž–ážŽáŸŒážŠáŸ†áž”áž¼áž„ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž¢ážáž·ážáž·áž‡áž“ážáŸ’áž˜áž¸" : "Default Storefront Theme"}</label>
                <select
                  className="settings-select"
                  value={settings.defaultStoreTheme || "system"}
                  onChange={(e) => setSettings({ ...settings, defaultStoreTheme: e.target.value })}
                >
                  <option value="system">ðŸ’» System Auto-Match (Recommended)</option>
                  <option value="light">â˜€ï¸ Light Theme Mode</option>
                  <option value="dark">ðŸŒ™ Dark Theme Mode</option>
                </select>
                <span className="form-helper-text">
                  {isKhmer ? "ážŸáŸ’áž”áŸ‚áž€áž–ážŽáŸŒážŠáŸ‚áž›ážáŸ’ážšáž¼ážœáž”áž¶áž“áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážŸáŸ’ážœáŸáž™áž”áŸ’ážšážœážáŸ’ážážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž—áŸ’áž‰áŸ€ážœ" : "Initial theme mode applied for non-logged-in shoppers"}
                </span>
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "ážáŸ†áž”áž“áŸ‹áž˜áŸ‰áŸ„áž„áž”áŸ’ážšáž–áŸáž“áŸ’áž’ (Timezone)" : "System Timezone"}</label>
                <input
                  type="text"
                  className="settings-input"
                  value="Asia/Phnom_Penh (GMT+7:00)"
                  readOnly
                  style={{ background: isDark ? "#1e293b" : "#f1f5f9", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group-item">
                <label className="form-label">{isKhmer ? "áž€áž¶ážšáž”áž„áŸ’áž áž¶áž‰ážšáž¼áž”áž·áž™áž”áŸážŽáŸ’ážŽáž‘áŸ’ážœáŸážš (USD & KHR)" : "Dual Currency Display"}</label>
                <select
                  className="settings-select"
                  value={settings.dualCurrencyDisplay ? "yes" : "no"}
                  onChange={(e) => setSettings({ ...settings, dualCurrencyDisplay: e.target.value === "yes" })}
                >
                  <option value="yes">{isKhmer ? "áž”áž„áŸ’áž áž¶áž‰áž‘áž¶áŸ†áž„ ážŠáž»áž›áŸ’áž›áž¶ážš ($) áž“áž·áž„ ážšáŸ€áž› (áŸ›)" : "Show both USD ($) and KHR (áŸ›)"}</option>
                  <option value="no">{isKhmer ? "áž”áž„áŸ’áž áž¶áž‰ážáŸ‚ ážŠáž»áž›áŸ’áž›áž¶ážš ($)" : "Show USD ($) only"}</option>
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
                  <span>{isKhmer ? "áž€áž¶ážšáž”áž„áŸ’áž áž¶áž‰áž‚áŸ†ážšáž¼áž‡áž¶áž€áŸ‹ážŸáŸ’ážáŸ‚áž„ (Live UI Preview)" : "Live Interactive UI Simulation"}</span>
                </h3>
                <p>
                  {isKhmer
                    ? "áž‘áž·ážŠáŸ’áž‹áž—áž¶áž–áž‡áž¶áž€áŸ‹ážŸáŸ’ážáŸ‚áž„áž“áŸƒáž”áŸŠáž¼ážáž»áž„ ážŸáŸ’áž›áž¶áž€ážŸáž‰áŸ’áž‰áž¶ áž“áž·áž„áž¢ážáŸ’ážáž”áž‘ážáž¶áž˜áž€áž¶ážšáž€áŸ†ážŽážáŸ‹ážšáž¼áž”ážšáž¶áž„áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“"
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
                  <span className="preview-badge success">â— System Online</span>
                  <span className="preview-badge theme-tag">
                    {resolvedTheme === "dark" ? "ðŸŒ™ Dark Theme" : "â˜€ï¸ Light Theme"}
                  </span>
                  <span className="preview-badge lang-tag">
                    {language === "km" ? "ðŸ‡°ðŸ‡­ áž—áž¶ážŸáž¶ážáŸ’áž˜áŸ‚ážš" : "ðŸ‡ºðŸ‡¸ English"}
                  </span>
                </div>
              </div>

              <div className="preview-simulation-grid">
                {/* Metric Card 1 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "áž…áŸ†ážŽáž¼áž›ážŸážšáž»áž”áž”áŸ’ážšáž…áž¶áŸ†ážáŸ’áž„áŸƒ" : "Today's Total Revenue"}</span>
                    <span className="preview-metric-growth">+18.4%</span>
                  </div>
                  <div className="preview-metric-value">$4,850.00</div>
                  <div className="preview-metric-sub">{isKhmer ? "ážŸáŸ’áž˜áž¾áž“áž¹áž„ â‰ˆ 19,885,000 áŸ›" : "Approx â‰ˆ 19,885,000 KHR"}</div>
                </div>

                {/* Metric Card 2 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "áž€áž¶ážšáž”áž‰áŸ’áž‡áž¶áž‘áž·áž‰ážáŸ’áž˜áž¸" : "New Orders Today"}</span>
                    <span className="preview-metric-growth blue">+12</span>
                  </div>
                  <div className="preview-metric-value">48 {isKhmer ? "áž€áž‰áŸ’áž…áž”áŸ‹" : "Orders"}</div>
                  <div className="preview-metric-sub">{isKhmer ? "ABA KHQR: 36 | COD: 12" : "ABA KHQR: 36 | COD: 12"}</div>
                </div>

                {/* Metric Card 3 */}
                <div className="preview-metric-card">
                  <div className="preview-metric-top">
                    <span className="preview-metric-label">{isKhmer ? "áž‡áŸ†áž“áž½áž™áž€áž¶ážšáž†áŸ’áž›áž¶ážážœáŸƒ" : "AI Voice Assistant"}</span>
                    <span className="preview-metric-growth green">{isKhmer ? "ážŠáŸ†ážŽáž¾ážšáž€áž¶ážš" : "Active"}</span>
                  </div>
                  <div className="preview-metric-value">Angkor AI 2.0</div>
                  <div className="preview-metric-sub">
                    {isKhmer ? "áž—áž¶ážŸáž¶ážŸáŸ†áž¡áŸáž„áŸ– ážáŸ’áž˜áŸ‚ážš (ážŸáŸ’ážáž„áŸ‹ážŠáž¶ážš)" : "Voice Engine: English (US)"}
                  </div>
                </div>
              </div>

              <div className="preview-action-row">
                <button type="button" className="btn-save-primary">
                  <Sparkles size={15} />
                  <span>{isKhmer ? "ážŸáž¶áž€áž›áŸ’áž”áž„áž˜áž»ážáž„áž¶ážšážáŸ’áž˜áž¸" : "Interactive Action"}</span>
                </button>
                <button type="button" className="btn-outline-secondary">
                  <span>{isKhmer ? "áž˜áž¾áž›ážšáž”áž¶áž™áž€áž¶ážšážŽáŸáž›áž˜áŸ’áž¢áž·áž" : "Export Report"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ROLES & PERMISSION RBAC MATRIX
         ========================================================================= */}
      {activeTab === "roles_permissions" && (() => {
        const totalSystemActions = PERMISSION_MODULES.reduce((acc, m) => acc + m.actions.length, 0);
        const currentGrantedCount = PERMISSION_MODULES.reduce((acc, m) => {
          const p = (currentRole?.permissions && currentRole.permissions[m.id]) || [];
          return acc + p.length;
        }, 0);
        const currentPercentage = Math.round((currentGrantedCount / (totalSystemActions || 1)) * 100);
        const isSuperAdmin = selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super");

        return (
          <>
            {/* Roles Selector Section */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-header-left">
                  <h3>
                    <Shield size={18} color="#166534" />
                    <span>{isKhmer ? "áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážáž½áž“áž¶áž‘áž¸ážŠáž¾áž˜áŸ’áž”áž¸áž€áŸ†ážŽážáŸ‹ážŸáž·áž‘áŸ’áž’áž·" : "Select Role to Configure Permissions"}</span>
                  </h3>
                  <p>{isKhmer ? "áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážáž½áž“áž¶áž‘áž¸ážŠáž¾áž˜áŸ’áž”áž¸áž˜áž¾áž› áž¬áž€áŸ‚áž”áŸ’ážšáŸ‚ážŸáž·áž‘áŸ’áž’áž·áž“áž¸áž˜áž½áž™áŸ—áž€áŸ’áž“áž»áž„áž”áŸ’ážšáž–áŸáž“áŸ’áž’ ážšáž½áž… Sync áž‘áŸ…áž€áž¶áž“áŸ‹ Database Backend API" : "Choose a role to inspect or adjust module privileges and save directly to backend API."}</p>
                </div>
                {can("settings", "edit") && (
                  <button
                    type="button"
                    className="btn-save-primary"
                    onClick={() => {
                      setNewRoleForm({ name: "", desc: "" });
                      setRoleModalOpen(true);
                    }}
                  >
                    <Plus size={15} />
                    <span>{isKhmer ? "áž”áž“áŸ’ážáŸ‚áž˜ážáž½áž“áž¶áž‘áž¸ážáŸ’áž˜áž¸" : "Add New Role"}</span>
                  </button>
                )}
              </div>

              <div className="roles-grid">
                {roles.map((role) => {
                  const rolePermCount = PERMISSION_MODULES.reduce((acc, m) => {
                    const p = (role.permissions && role.permissions[m.id]) || [];
                    return acc + p.length;
                  }, 0);
                  const isSelected = String(selectedRoleId) === String(role.id);

                  return (
                    <div
                      key={role.id}
                      className={`role-card-item ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className="role-card-top">
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span className={`role-badge-tag ${role.type || "staff"}`}>{role.type || "Role"}</span>
                          <span className="role-perms-tag" style={{ fontSize: "11px", fontWeight: 600, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Check size={11} /> {rolePermCount}/{totalSystemActions}
                          </span>
                        </div>
                        {can("settings", "edit") && role.id !== "super_admin" && (
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
                        <span>{isKhmer ? "áž”áž»áž‚áŸ’áž‚áž›áž·áž€áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹áŸ–" : "Assigned Staff:"}</span>
                        <span className="role-user-count">
                          {staff.filter((s) => String(s.roleId) === String(role.id)).length} {isKhmer ? "áž“áž¶áž€áŸ‹" : "Users"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Permission Matrix for Selected Role */}
            <div className="settings-card">
              <div className="settings-card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
                <div className="settings-card-header-left">
                  <h3>
                    <Key size={18} color="#166534" />
                    <span>{isKhmer ? `ážáž¶ážšáž¶áž„ážŸáž·áž‘áŸ’áž’áž·ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áŸ– ${currentRole.name}` : `Permissions Matrix for: ${currentRole.name}`}</span>
                  </h3>
                  <p>{isKhmer ? "áž’áž¸áž€ áž¬ážŠáŸ„áŸ‡áž’áž¸áž€áž›áž¾ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–áž“áž¸áž˜áž½áž™áŸ— ážšáž½áž…áž…áž»áž… 'ážšáž€áŸ’ážŸáž¶áž‘áž»áž€ážŸáž·áž‘áŸ’áž’áž·' ážŠáž¾áž˜áŸ’áž”áž¸áž”áž‰áŸ’áž‡áž¼áž“áž‘áŸ… API (/api/roles)" : "Configure capabilities below and click 'Save Role Permissions' to sync to database."}</p>
                </div>
                {can("settings", "edit") && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-outline-secondary"
                      style={{ fontSize: "12px", padding: "7px 12px" }}
                      onClick={handleGrantAllForRole}
                      disabled={isSuperAdmin}
                      title="Grant all permissions across all modules"
                    >
                      <Check size={14} color="#166534" />
                      <span>{isKhmer ? "áž•áŸ’ážáž›áŸ‹ážŸáž·áž‘áŸ’áž’áž·áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹" : "Grant All"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-outline-secondary"
                      style={{ fontSize: "12px", padding: "7px 12px" }}
                      onClick={handleRevokeAllForRole}
                      disabled={isSuperAdmin}
                      title="Revoke all permissions for this role"
                    >
                      <X size={14} color="#dc2626" />
                      <span>{isKhmer ? "ážŠáž€ážŸáž·áž‘áŸ’áž’áž·áž‘áž¶áŸ†áž„áž¢ážŸáŸ‹" : "Revoke All"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-save-primary"
                      style={{ fontSize: "12px", padding: "7px 14px" }}
                      disabled={isSavingRole || isSuperAdmin}
                      onClick={() => handleSaveRolePermissions(currentRole.id)}
                    >
                      {isSavingRole ? (
                        <>
                          <RotateCcw size={14} className="spin-animate" />
                          <span>{isKhmer ? "áž€áŸ†áž–áž»áž„ážšáž€áŸ’ážŸáž¶áž‘áž»áž€..." : "Saving..."}</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>{isKhmer ? "ážšáž€áŸ’ážŸáž¶áž‘áž»áž€ážŸáž·áž‘áŸ’áž’áž·ážáž½áž“áž¶áž‘áž¸áž“áŸáŸ‡" : "Save Role Permissions"}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Role Matrix Summary Bar */}
              <div
                style={{
                  background: isSuperAdmin ? "rgba(22, 101, 52, 0.08)" : "rgba(241, 245, 249, 0.7)",
                  border: `1px solid ${isSuperAdmin ? "rgba(22, 101, 52, 0.2)" : "#e2e8f0"}`,
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
                      {currentRole.name}
                    </span>
                    <span className={`role-badge-tag ${currentRole.type || "staff"}`}>
                      {currentRole.type || "role"}
                    </span>
                    {isSuperAdmin && (
                      <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: 600 }}>
                        {isKhmer ? "ðŸ›¡ï¸ ážŸáž·áž‘áŸ’áž’áž·áž–áŸáž‰áž›áŸáž‰áž¢áž…áž·áž“áŸ’ážáŸ’ážšáŸƒáž™áŸ" : "ðŸ›¡ï¸ Permanent Unrestricted Master Access"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569" }}>
                    {isKhmer
                      ? `ážŸáž·áž‘áŸ’áž’áž·áž¢áž“áž»áž‰áŸ’áž‰áž¶ážáŸ– ${currentGrantedCount} / ${totalSystemActions} (${currentPercentage}%)`
                      : `Privileges Granted: ${currentGrantedCount} of ${totalSystemActions} (${currentPercentage}%)`}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${currentPercentage}%`,
                      height: "100%",
                      background: isSuperAdmin ? "linear-gradient(90deg, #166534, #22c55e)" : "linear-gradient(90deg, #0284c7, #166534)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
              </div>

              <div className="matrix-table-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>{isKhmer ? "áž•áŸ’áž“áŸ‚áž€ / áž˜áž»ážáž„áž¶ážš" : "Module Name"}</th>
                      <th style={{ width: "15%", textAlign: "center" }}>{isKhmer ? "áž‡áŸ’ážšáž¾ážŸáž‘áž¶áŸ†áž„áž¢ážŸáŸ‹" : "Select All"}</th>
                      <th>{isKhmer ? "ážŸáž·áž‘áŸ’áž’áž·áž¢áž“áž»áž‰áŸ’áž‰áž¶áž" : "Permissions & Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((module) => {
                      const currentPerms = (currentRole?.permissions && currentRole.permissions[module.id]) || [];
                      const isAllChecked = module.actions.every((a) => currentPerms.includes(a));
                      const moduleActiveCount = currentPerms.length;

                      return (
                        <tr key={module.id}>
                          <td>
                            <div className="matrix-module-cell">
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="matrix-module-name">
                                  {isKhmer && module.nameKm ? module.nameKm : module.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    padding: "1px 6px",
                                    borderRadius: "10px",
                                    fontWeight: 600,
                                    background: moduleActiveCount === module.actions.length ? "#dcfce7" : moduleActiveCount > 0 ? "#e0f2fe" : "#f1f5f9",
                                    color: moduleActiveCount === module.actions.length ? "#166534" : moduleActiveCount > 0 ? "#0369a1" : "#94a3b8"
                                  }}
                                >
                                  {moduleActiveCount}/{module.actions.length}
                                </span>
                              </div>
                              <span className="matrix-module-desc">{module.desc}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <label className="perm-toggle-wrapper" style={{ justifyContent: "center" }}>
                              <input
                                type="checkbox"
                                className="perm-checkbox"
                                checked={isAllChecked}
                                disabled={isSuperAdmin}
                                onChange={() => handleToggleModuleAll(module)}
                              />
                            </label>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                              {module.actions.map((act) => {
                                const checked = currentPerms.includes(act);
                                return (
                                  <label
                                    key={act}
                                    className="perm-toggle-wrapper"
                                    style={{
                                      gap: "6px",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      background: checked ? "rgba(22, 101, 52, 0.08)" : "transparent",
                                      border: checked ? "1px solid rgba(22, 101, 52, 0.2)" : "1px solid transparent",
                                      transition: "all 0.15s ease"
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="perm-checkbox"
                                      checked={checked}
                                      disabled={isSuperAdmin}
                                      onChange={() => handleTogglePermission(module.id, act)}
                                    />
                                    <span style={{ textTransform: "capitalize", fontSize: "12.5px", fontWeight: checked ? 600 : 500, color: checked ? "#166534" : "inherit" }}>
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
        );
      })()}

      {/* =========================================================================
          TAB 3: STAFF DIRECTORY & ROLE ASSIGNMENT
         ========================================================================= */}
      {activeTab === "staff_users" && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3>
                <Users size={18} color="#166534" />
                <span>{isKhmer ? "áž‚ážŽáž“áž¸ Admin & áž”áž»áž‚áŸ’áž‚áž›áž·áž€áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„" : "Admin & Staff Accounts"}</span>
              </h3>
              <p>{isKhmer ? "áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„áž¢áŸ’áž“áž€áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹ áž“áž·áž„ážáž½áž“áž¶áž‘áž¸ážšáž”ážŸáŸ‹áž–áž½áž€áž‚áŸáž€áŸ’áž“áž»áž„áž”áŸ’ážšáž–áŸáž“áŸ’áž’" : "Manage back-office users and their designated system roles."}</p>
            </div>
            {can("settings", "edit") && (
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
                <span>{isKhmer ? "áž”áž“áŸ’ážáŸ‚áž˜áž”áž»áž‚áŸ’áž‚áž›áž·áž€ážáŸ’áž˜áž¸" : "Add Staff User"}</span>
              </button>
            )}
          </div>

          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{isKhmer ? "ážˆáŸ’áž˜áŸ„áŸ‡áž¢áŸ’áž“áž€áž”áŸ’ážšáž¾" : "User"}</th>
                  <th>{isKhmer ? "ážáž½áž“áž¶áž‘áž¸" : "Assigned Role"}</th>
                  <th>{isKhmer ? "ážŸáŸ’ážáž¶áž“áž—áž¶áž–" : "Status"}</th>
                  <th>{isKhmer ? "ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–áž…áž»áž„áž€áŸ’ážšáŸ„áž™" : "Last Active"}</th>
                  {can("settings", "edit") && <th style={{ textAlign: "right" }}>{isKhmer ? "ážŸáž€áž˜áŸ’áž˜áž—áž¶áž–" : "Actions"}</th>}
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
                    {can("settings", "edit") && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", marginRight: "6px", color: "#f57c00", borderColor: "#ffe082" }}
                          onClick={async () => {
                            const { value: newPassword } = await Swal.fire({
                              title: isKhmer ? `áž”áŸ’ážáž¼ážšáž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `Change Password for ${member.name}`,
                              input: "password",
                              inputLabel: isKhmer ? "áž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážáŸ’áž˜áž¸ (áž™áŸ‰áž¶áž„ážáž·áž… áŸ¦ ážáž½áž¢áž€áŸ’ážŸážš)" : "New Password (min 6 characters)",
                              inputPlaceholder: isKhmer ? "áž”áž‰áŸ’áž…áž¼áž›áž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážáŸ’áž˜áž¸..." : "Enter new password...",
                              showCancelButton: true,
                              confirmButtonText: isKhmer ? "áž•áŸ’áž›áž¶ážŸáŸ‹áž”áŸ’ážáž¼ážš" : "Update Password",
                              confirmButtonColor: "#f57c00",
                              inputValidator: (val) => {
                                if (!val || val.length < 6) return isKhmer ? "áž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážáŸ’ážšáž¼ážœáž˜áž¶áž“áž™áŸ‰áž¶áž„ážáž·áž… áŸ¦ ážáž½!" : "Password must be at least 6 characters!";
                              }
                            });
                            if (newPassword) {
                              try {
                                await adminChangeUserPasswordApi(member.id, newPassword).catch(() => null);
                                Swal.fire(isKhmer ? "áž‡áŸ„áž‚áž‡áŸáž™!" : "Success!", isKhmer ? `áž”áž¶áž“áž•áŸ’áž›áž¶ážŸáŸ‹áž”áŸ’ážáž¼ážšáž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `Password updated for ${member.name}`, "success");
                              } catch (err) {
                                Swal.fire("Error", err.message || "Failed to update password", "error");
                              }
                            }
                          }}
                        >
                          <Key size={13} />
                          <span>{isKhmer ? "áž”áŸ’ážáž¼ážšáž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹" : "Password"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", marginRight: "6px" }}
                          onClick={() => {
                            setSelectedStaff(member);
                            setStaffForm({
                              name: member.name,
                              email: member.email,
                              phone: member.phone || "",
                              password: "",
                              roleId: member.roleId,
                              status: member.status
                            });
                            setStaffModalOpen(true);
                          }}
                        >
                          <Edit2 size={13} />
                          <span>{isKhmer ? "áž€áŸ‚áž”áŸ’ážšáŸ‚" : "Edit"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", marginRight: "6px" }}
                          onClick={async () => {
                            const action = await Swal.fire({
                              title: isKhmer ? `áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„ 2FA ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `Manage 2FA for ${member.name}`,
                              text: isKhmer ? "áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážŸáž€áž˜áŸ’áž˜áž—áž¶áž– 2FA ážŠáŸ‚áž›áž¢áŸ’áž“áž€áž…áž„áŸ‹áž¢áž“áž»ážœážáŸ’áž" : "Choose a 2FA action to perform",
                              icon: "question",
                              showCancelButton: true,
                              confirmButtonText: isKhmer ? "áž”áž“áŸ’ážáŸ‚áž˜/áž€áŸ‚áž”áŸ’ážšáŸ‚ PIN" : "Set / Update PIN",
                              cancelButtonText: isKhmer ? "áž”áž·áž‘" : "Cancel",
                              showDenyButton: true,
                              denyButtonText: isKhmer ? "áž”áž·áž‘áž•áŸ’áž¢áž¶áž€ 2FA" : "Disable 2FA",
                              confirmButtonColor: "#f57c00",
                              denyButtonColor: "#dc2626"
                            });

                            if (action.isConfirmed) {
                              const { value: pin } = await Swal.fire({
                                title: isKhmer ? `áž€áŸ†ážŽážáŸ‹ 2FA PIN ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `Set 2FA PIN for ${member.name}`,
                                input: "password",
                                inputLabel: isKhmer ? "PIN (áž™áŸ‰áž¶áž„ážáž·áž… áŸ¤ ážáž½ážáŸ’áž‘áž„áŸ‹)" : "PIN (min 4 digits)",
                                inputPlaceholder: isKhmer ? "áž”áž‰áŸ’áž…áž¼áž› PIN..." : "Enter PIN...",
                                showCancelButton: true,
                                confirmButtonText: isKhmer ? "ážšáž€áŸ’ážŸáž¶áž‘áž»áž€" : "Save PIN",
                                confirmButtonColor: "#f57c00",
                                inputValidator: (val) => {
                                  if (!val || val.length < 4) return isKhmer ? "PIN ážáŸ’ážšáž¼ážœáž˜áž¶áž“áž™áŸ‰áž¶áž„ážáž·áž… áŸ¤ ážáž½!" : "PIN must be at least 4 digits!";
                                }
                              });

                              if (pin) {
                                try {
                                  await enableStaff2FAApi(member.id, pin);
                                  Swal.fire(isKhmer ? "áž‡áŸ„áž‚áž‡áŸáž™!" : "Success!", isKhmer ? `2FA PIN ážáŸ’ážšáž¼ážœáž”áž¶áž“áž€áŸ†ážŽážáŸ‹ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `2FA PIN configured for ${member.name}`, "success");
                                } catch (err) {
                                  Swal.fire("Error", err.message || "Failed to enable 2FA", "error");
                                }
                              }
                            } else if (action.isDenied) {
                              try {
                                await disableStaff2FAApi(member.id);
                                Swal.fire(isKhmer ? "áž‡áŸ„áž‚áž‡áŸáž™!" : "Success!", isKhmer ? `2FA ážáŸ’ážšáž¼ážœáž”áž¶áž“áž”áž·áž‘ážŸáž˜áŸ’ážšáž¶áž”áŸ‹ ${member.name}` : `2FA disabled for ${member.name}`, "success");
                              } catch (err) {
                                Swal.fire("Error", err.message || "Failed to disable 2FA", "error");
                              }
                            }
                          }}
                        >
                          <Shield size={13} />
                          <span>{isKhmer ? "2FA" : "2FA"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", color: "#dc2626", borderColor: "#fecaca" }}
                          onClick={() => handleDeleteStaff(member)}
                        >
                          <Trash2 size={13} />
                          <span>{isKhmer ? "áž›áž»áž”" : "Delete"}</span>
                        </button>
                      </td>
                    )}
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
                <span>{isKhmer ? "áž–áŸážáŸŒáž˜áž¶áž“áž‘áž¼áž‘áŸ…ážšáž”ážŸáŸ‹áž áž¶áž„" : "Store Profile & Official Information"}</span>
              </h3>
              <p>{isKhmer ? "áž€áŸ†ážŽážáŸ‹ážˆáŸ’áž˜áŸ„áŸ‡áž áž¶áž„ áž–áž¶áž€áŸ’áž™ážŸáŸ’áž›áŸ„áž€ áž–áŸážáŸŒáž˜áž¶áž“áž‘áŸ†áž“áž¶áž€áŸ‹áž‘áŸ†áž“áž„ áž“áž·áž„ážšáž¼áž”áž·áž™áž”áŸážŽáŸ’ážŽ" : "Customize store branding, operating details, contact channels, and currency."}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ážˆáŸ’áž˜áŸ„áŸ‡áž áž¶áž„ / áž•áŸ’ážŸáž¶ážšáž‘áŸ†áž“áž¾áž”" : "Mall / Store Name"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž–áž¶áž€áŸ’áž™ážŸáŸ’áž›áŸ„áž€áž•áŸ’áž›áž¼ážœáž€áž¶ážš" : "Official Tagline"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž¢áŸŠáž¸áž˜áŸ‚áž›áž‡áŸ†áž“áž½áž™áž€áž¶ážš" : "Support Email"}</label>
              <input
                type="email"
                className="settings-input"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž›áŸážáž‘áž¼ážšážŸáŸáž–áŸ’áž‘ Hotline" : "Hotline Phone"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž†áž¶áž“áŸ‚áž› Telegram áž•áŸ’áž›áž¼ážœáž€áž¶ážš" : "Official Telegram Channel"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.supportTelegram}
                onChange={(e) => setSettings({ ...settings, supportTelegram: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ážšáž¼áž”áž·áž™áž”áŸážŽáŸ’ážŽáž…áž˜áŸ’áž”áž„" : "Primary Currency"}</label>
              <select
                className="settings-select"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="KHR">KHR (áŸ›) - Cambodian Riel</option>
              </select>
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž¢ážáŸ’ážšáž¶áž”áŸ’ážáž¼ážšáž”áŸ’ážšáž¶áž€áŸ‹ážšáŸ€áž› (1 USD = X KHR)" : "KHR Exchange Rate (1 USD = X KHR)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.khrRate}
                onChange={(e) => setSettings({ ...settings, khrRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž¢ážáŸ’ážšáž¶áž–áž“áŸ’áž’ VAT (%)" : "VAT / Tax Rate (%)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item full-width">
              <label className="form-label">{isKhmer ? "áž¢áž¶ážŸáž™ážŠáŸ’áž‹áž¶áž“áž‘áž¸ážŸáŸ’áž“áž¶áž€áŸ‹áž€áž¶ážšáž€ážŽáŸ’ážáž¶áž›" : "Physical Store / Headquarters Address"}</label>
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
                <span>{isKhmer ? "áž’áž“áž¶áž‚áž¶ážšáž‘áž¼áž‘áž¶ážáŸ‹áž”áŸ’ážšáž¶áž€áŸ‹ & KHQR" : "Payment Gateways & Checkout Methods"}</span>
              </h3>
              <p>{isKhmer ? "áž€áŸ†ážŽážáŸ‹ ABA KHQR, Wing Bank, Cash on Delivery áž“áž·áž„áž€áž¶ážáž’áž“áž¶áž‚áž¶ážš" : "Configure ABA KHQR, Wing Bank, Cash on Delivery, and Credit/Debit cards."}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* ABA Payway Card */}
            <div className="payment-gateway-item">
              <div className="payment-gateway-top">
                <div className="payment-gateway-info">
                  <div className="gateway-icon-badge">ðŸ¦</div>
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
                  <div className="gateway-icon-badge" style={{ color: "#84cc16" }}>ðŸ’¸</div>
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
                  <div className="gateway-icon-badge">ðŸ“¦</div>
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
                  <div className="gateway-icon-badge">ðŸ’³</div>
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
                <span>{isKhmer ? "áž€áž¶ážšážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“ & ážáž˜áŸ’áž›áŸƒážŸáŸážœáž¶" : "Delivery Zones & Shipping Rates"}</span>
              </h3>
              <p>{isKhmer ? "áž€áŸ†ážŽážáŸ‹ážáž˜áŸ’áž›áŸƒážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“áž€áŸ’áž“áž»áž„ážšáž¶áž‡áž’áž¶áž“áž¸áž—áŸ’áž“áŸ†áž–áŸáž‰ áž“áž·áž„ážáž¶áž˜áž”ážŽáŸ’ážáž¶ážáŸážáŸ’áž" : "Configure Phnom Penh express delivery and nationwide province dispatch fees."}</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ážáž˜áŸ’áž›áŸƒážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“áž—áŸ’áž“áŸ†áž–áŸáž‰ ($)" : "Express Delivery Fee - Phnom Penh ($)"}</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.expressShippingFee}
                onChange={(e) => setSettings({ ...settings, expressShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ážšáž™áŸˆáž–áŸáž›áž”áŸ‰áž¶áž“áŸ‹ážŸáŸ’áž˜áž¶áž“ážŠáž¹áž€ážŠáž›áŸ‹" : "Estimated Delivery Timeframe"}</label>
              <input
                type="text"
                className="settings-input"
                value={settings.expressHours}
                onChange={(e) => setSettings({ ...settings, expressHours: e.target.value })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "ážáž˜áŸ’áž›áŸƒážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“ážáž¶áž˜áž”ážŽáŸ’ážáž¶ážáŸážáŸ’áž ($)" : "Provinces Shipping Fee ($)"}</label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={settings.provinceShippingFee}
                onChange={(e) => setSettings({ ...settings, provinceShippingFee: Number(e.target.value) })}
              />
            </div>

            <div className="form-group-item">
              <label className="form-label">{isKhmer ? "áž€áž˜áŸ’ážšáž·ážáž‘áž¹áž€áž”áŸ’ážšáž¶áž€áŸ‹ážŠáž¾áž˜áŸ’áž”áž¸áž‘áž‘áž½áž›áž”áž¶áž“ážŠáž¹áž€áž¥ážáž‚áž·ážážáŸ’áž›áŸƒ ($)" : "Free Shipping Minimum Threshold ($)"}</label>
              <input
                type="number"
                className="settings-input"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              />
              <span className="form-helper-text">
                {isKhmer ? "áž€áž¶ážšáž”áž‰áŸ’áž‡áž¶áž‘áž·áž‰áž…áž¶áž”áŸ‹áž–áž¸áž…áŸ†áž“áž½áž“áž“áŸáŸ‡áž¡áž¾áž„áž‘áŸ…áž“áž¹áž„áž‘áž‘áž½áž›áž”áž¶áž“áž€áž¶ážšážŠáž¹áž€áž‡áž‰áŸ’áž‡áž¼áž“áž¥ážáž‚áž·ážážáŸ’áž›áŸƒ" : "Orders above this amount receive free shipping automatically."}
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
                <span>{isKhmer ? "ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž– áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„ & áž€áž¶ážšážáŸ‚áž‘áž¶áŸ†áž”áŸ’ážšáž–áŸáž“áŸ’áž’" : "Security Policies, Alerts & Maintenance"}</span>
              </h3>
              <p>{isKhmer ? "áž€áŸ†ážŽážáŸ‹áž€áž˜áŸ’ážšáž·ážáž–áŸ’ážšáž˜áž¶áž“ážŸáŸ’ážáž»áž€ Telegram Webhook áž“áž·áž„ážšáž”áŸ€áž”ážáŸ‚áž‘áž¶áŸ†áž”áŸ’ážšáž–áŸáž“áŸ’áž’" : "Configure stock alert thresholds, Telegram webhooks, and maintenance mode."}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Low Stock Alert */}
            <div className="switch-container">
              <div className="switch-label-group">
                <span className="switch-title">{isKhmer ? "áž€áž˜áŸ’ážšáž·ážáž–áŸ’ážšáž˜áž¶áž“ážŸáŸ’ážáž»áž€áž‘áž¶áž” (áž…áŸ†áž“áž½áž“áž¯áž€ážáž¶)" : "Low Stock Alert Threshold (Units)"}</span>
                <span className="switch-desc">{isKhmer ? "áž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„áž‘áŸ…áž€áž¶áž“áŸ‹áž¢áŸ’áž“áž€áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„ážŸáŸ’ážáž»áž€áž“áŸ…áž–áŸáž›áž…áŸ†áž“áž½áž“áž•áž›áž·ážáž•áž›áž’áŸ’áž›áž¶áž€áŸ‹áž…áž»áŸ‡áž€áŸ’ážšáŸ„áž˜áž…áŸ†áž“áž½áž“áž“áŸáŸ‡" : "Notify warehouse managers when item quantity drops below this number"}</span>
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
                <span className="switch-title">{isKhmer ? "áž€áž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„ážáž¶áž˜ Telegram áž—áŸ’áž›áž¶áž˜áŸ—áž–áŸáž›áž˜áž¶áž“áž€áž¶ážšáž€áž»áž˜áŸ’áž˜áŸ‰áž„áŸ‹ & áž”áŸ’ážáž¼ážšážŸáŸážšáž¸" : "Instant Telegram Order & Trade-In Webhook"}</span>
                <span className="switch-desc">{isKhmer ? "áž•áŸ’áž‰áž¾ážŸáž¶ážšážŠáŸ†ážŽáž¹áž„áž‘áŸ…áž€áž¶áž“áŸ‹áž‚áŸ’ážšáž»áž” Telegram áž”áž»áž‚áŸ’áž‚áž›áž·áž€áž—áŸ’áž›áž¶áž˜áŸ—áž“áŸ…áž–áŸáž›áž˜áž¶áž“áž€áž¶ážšáž”áž‰áŸ’áž‡áž¶áž‘áž·áž‰ážáŸ’áž˜áž¸" : "Receive real-time alerts in your staff Telegram group whenever an order or trade is placed"}</span>
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
                <span className="switch-title">{isKhmer ? "áž‘áž¶áž˜áž‘áž¶ážšáž€áž¶ážšáž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹ áŸ¢ áž‡áŸ†áž áž¶áž“ (2FA) ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž”áž»áž‚áŸ’áž‚áž›áž·áž€" : "Enforce Two-Factor Authentication (2FA) for Staff"}</span>
                <span className="switch-desc">{isKhmer ? "áž‘áž¶áž˜áž‘áž¶ážšáž›áŸážáž€áž¼ážŠ OTP áž˜áž»áž“áž–áŸáž›áž…áž¼áž›áž”áŸ’ážšáž¾áž”áŸ’ážšáž¶ážŸáŸ‹áž•áŸ’áž‘áž¶áŸ†áž„áž‚áŸ’ážšáž”áŸ‹áž‚áŸ’ážšáž„" : "Require OTP or authenticator verification on all admin/manager logins"}</span>
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

            {/* 6-Digit Staff Security PIN Configuration */}
            <div className="security-pin-card" style={{
              background: isDark ? "rgba(245, 158, 11, 0.06)" : "#fffbeb",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "16px",
              padding: "20px",
              marginTop: "4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a" }}>
                      {isKhmer ? "áž€áž¼ážŠ PIN ážŸáž»ážœážáŸ’ážáž·áž—áž¶áž– áŸ¦ ážáŸ’áž‘áž„áŸ‹ (6-Digit Security PIN)" : "6-Digit Staff Security PIN"}
                    </h4>
                    <small style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      {isKhmer
                        ? "áž€áŸ†ážŽážáŸ‹ áž¬áž”áŸ’ážáž¼ážšáž€áž¼ážŠ PIN áŸ¦ ážáŸ’áž‘áž„áŸ‹ážŸáž˜áŸ’ážšáž¶áž”áŸ‹áž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹áž–áŸáž›áž…áž¼áž›áž”áŸ’ážšáž–áŸáž“áŸ’áž’ Admin"
                        : "Set or update your 6-digit PIN required during staff authentication"}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: currentUser?.two_fa_enabled ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                    color: currentUser?.two_fa_enabled ? "#10b981" : "#64748b",
                    border: currentUser?.two_fa_enabled ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(148, 163, 184, 0.3)"
                  }}>
                    {currentUser?.two_fa_enabled
                      ? (isKhmer ? "â— áž€áŸ†áž–áž»áž„áž”áž¾áž€ážŠáŸ†ážŽáž¾ážšáž€áž¶ážš PIN áŸ¦ ážáŸ’áž‘áž„áŸ‹" : "â— 6-Digit PIN Active")
                      : (isKhmer ? "â—‹ áž˜áž·áž“áž‘áž¶áž“áŸ‹áž€áŸ†ážŽážáŸ‹ PIN" : "â—‹ No PIN Active")}
                  </span>

                  {currentUser?.two_fa_enabled && (
                    <button
                      type="button"
                      className="btn-outline-secondary"
                      style={{ fontSize: "12px", padding: "4px 10px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
                      onClick={handleDisablePin}
                      disabled={isUpdatingPin}
                    >
                      {isKhmer ? "áž”áž·áž‘ PIN" : "Disable PIN"}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "14px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "13px" }}>
                    {isKhmer ? "áž”áž‰áŸ’áž…áž¼áž›áž€áž¼ážŠ PIN ážáŸ’áž˜áž¸ (áŸ¦ ážáŸ’áž‘áž„áŸ‹)" : "New 6-Digit PIN"}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="settings-input"
                    placeholder="e.g. 123456"
                    value={pinForm.pin}
                    onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: "13px" }}>
                    {isKhmer ? "áž•áŸ’áž‘áŸ€áž„áž•áŸ’áž‘áž¶ážáŸ‹áž€áž¼ážŠ PIN áž˜áŸ’ážáž„áž‘áŸ€áž" : "Confirm 6-Digit PIN"}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="settings-input"
                    placeholder="Confirm 6 digits"
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  type="button"
                  className="btn-save-primary"
                  onClick={handleSavePin}
                  disabled={isUpdatingPin || pinForm.pin.length !== 6}
                  style={{ fontSize: "13px", padding: "8px 18px" }}
                >
                  <Key size={14} />
                  <span>{isUpdatingPin ? (isKhmer ? "áž€áŸ†áž–áž»áž„ážšáž€áŸ’ážŸáž¶áž‘áž»áž€..." : "Saving...") : (isKhmer ? "ážšáž€áŸ’ážŸáž¶áž‘áž»áž€áž€áž¼ážŠ PIN áŸ¦ ážáŸ’áž‘áž„áŸ‹" : "Save 6-Digit Security PIN")}</span>
                </button>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="switch-container" style={{ borderLeft: "4px solid #ef4444" }}>
              <div className="switch-label-group">
                <span className="switch-title" style={{ color: "#dc2626" }}>{isKhmer ? "ážšáž”áŸ€áž”ážáŸ‚áž‘áž¶áŸ†áž”áŸ’ážšáž–áŸáž“áŸ’áž’ (Maintenance Mode)" : "Store Maintenance Mode"}</span>
                <span className="switch-desc">{isKhmer ? "áž”áž·áž‘áž‚áŸáž áž‘áŸ†áž–áŸážšáž‡áž¶áž”ážŽáŸ’ážáŸ„áŸ‡áž¢áž¶ážŸáž“áŸ’áž“áž–áŸáž›áž€áŸ†áž–áž»áž„áž’áŸ’ážœáž¾áž”áž…áŸ’áž…áž»áž”áŸ’áž”áž“áŸ’áž“áž—áž¶áž–áž‘áž·áž“áŸ’áž“áž“áŸáž™" : "Temporarily lock the customer-facing storefront during database or inventory audits"}</span>
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
                <label className="form-label">{isKhmer ? "ážŸáž¶ážšáž‡áž¼áž“ážŠáŸ†ážŽáž¹áž„áž‘áŸ…áž€áž¶áž“áŸ‹áž¢ážáž·ážáž·áž‡áž“áž–áŸáž›áž”áž·áž‘ážáŸ‚áž‘áž¶áŸ†" : "Customer Maintenance Notice Banner"}</label>
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
              <h3>{isKhmer ? "áž”áž„áŸ’áž€áž¾ážážáž½áž“áž¶áž‘áž¸ážáŸ’áž˜áž¸" : "Create New Role"}</h3>
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
                  <label className="form-label">{isKhmer ? "ážˆáŸ’áž˜áŸ„áŸ‡ážáž½áž“áž¶áž‘áž¸ *" : "Role Title *"}</label>
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
                  <label className="form-label">{isKhmer ? "áž€áž¶ážšáž–áž·áž–ážŽáŸŒáž“áž¶" : "Description"}</label>
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
                  {isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel"}
                </button>
                <button type="submit" className="btn-save-primary">
                  {isKhmer ? "áž”áž„áŸ’áž€áž¾ážážáž½áž“áž¶áž‘áž¸" : "Create Role"}
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
              <h3>{selectedStaff ? (isKhmer ? "áž€áŸ‚áž”áŸ’ážšáŸ‚áž–áŸážáŸŒáž˜áž¶áž“áž”áž»áž‚áŸ’áž‚áž›áž·áž€" : "Edit Staff User") : (isKhmer ? "áž”áž“áŸ’ážáŸ‚áž˜áž”áž»áž‚áŸ’áž‚áž›áž·áž€ážáŸ’áž˜áž¸" : "Add New Staff Member")}</h3>
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
                  <label className="form-label">{isKhmer ? "ážˆáŸ’áž˜áŸ„áŸ‡áž–áŸáž‰ *" : "Full Name *"}</label>
                  <input
                    type="text"
                    required
                    className="settings-input"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">{isKhmer ? "áž¢áž¶ážŸáž™ážŠáŸ’áž‹áž¶áž“áž¢áŸŠáž¸áž˜áŸ‚áž› *" : "Email Address *"}</label>
                  <input
                    type="email"
                    required
                    className="settings-input"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group-item">
                  <label className="form-label">{isKhmer ? "áž›áŸážáž‘áž¼ážšážŸáŸáž–áŸ’áž‘" : "Phone Number"}</label>
                  <input
                    type="tel"
                    className="settings-input"
                    placeholder="012 345 678"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
                {!selectedStaff && (
                  <div className="form-group-item">
                    <label className="form-label">{isKhmer ? "áž›áŸážážŸáž˜áŸ’áž„áž¶ážáŸ‹ážŠáŸ†áž”áž¼áž„ *" : "Initial Password *"}</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showStaffPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder={isKhmer ? "áž™áŸ‰áž¶áž„ážáž·áž… áŸ¦ ážáž½áž¢áž€áŸ’ážŸážš" : "Min 6 characters"}
                        className="settings-input"
                        style={{ paddingRight: "40px" }}
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b"
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="form-group-item">
                  <label className="form-label">{isKhmer ? "áž‡áŸ’ážšáž¾ážŸážšáž¾ážŸážáž½áž“áž¶áž‘áž¸ *" : "Assign Role *"}</label>
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
                  <label className="form-label">{isKhmer ? "ážŸáŸ’ážáž¶áž“áž—áž¶áž–áž‚ážŽáž“áž¸" : "Account Status"}</label>
                  <select
                    className="settings-select"
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <option value="Active">{isKhmer ? "ážŸáž€áž˜áŸ’áž˜ (Active)" : "Active"}</option>
                    <option value="Inactive">{isKhmer ? "áž¢ážŸáž€áž˜áŸ’áž˜ (Inactive)" : "Inactive / Suspended"}</option>
                  </select>
                </div>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="btn-outline-secondary" onClick={() => setStaffModalOpen(false)}>
                  {isKhmer ? "áž”áŸ„áŸ‡áž”áž„áŸ‹" : "Cancel"}
                </button>
                <button type="submit" className="btn-save-primary">
                  {isKhmer ? "ážšáž€áŸ’ážŸáž¶áž‘áž»áž€" : "Save Staff"}
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
