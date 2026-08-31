import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuth } from "../../store/authSlice";
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
    nameKm: "ផ្ទាំងគ្រប់គ្រង & ស្ថិតិ",
    desc: "View business metrics, revenue charts, order analytics and sales stats",
    actions: ["view", "export"]
  },
  {
    id: "products",
    name: "Products & Catalog",
    nameKm: "ផលិតផល & កាតាឡុក",
    desc: "Manage item listings, prices, SKU, specs, variants and gallery images",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "categories",
    name: "Product Categories",
    nameKm: "ប្រភេទផលិតផល",
    desc: "Organize category trees, hierarchies and department taxonomy",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "brands",
    name: "Brands & Partners",
    nameKm: "ម៉ាក & យីហោ",
    desc: "Manage partner brands, manufacturer logos and official endorsements",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "flash_sale",
    name: "Flash Sale & Deals",
    nameKm: "ប្រូម៉ូសិន & Flash Sale",
    desc: "Create limited-time deals, discount countdown timers and campaign banners",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "trading",
    name: "Trade-In & Exchange",
    nameKm: "ប្តូរសេរីទូរស័ព្ទ (Trade-In)",
    desc: "Review trade-in requests, evaluate second-hand gadgets, approve cash payouts",
    actions: ["view", "value", "approve", "reject"]
  },
  {
    id: "orders",
    name: "Orders & Invoicing",
    nameKm: "ការបញ្ជាទិញ & វិក្កយបត្រ",
    desc: "Process customer orders, generate invoices, handle dispatch and refunds",
    actions: ["view", "process", "cancel", "refund"]
  },
  {
    id: "messages",
    name: "Customer Support & Chat",
    nameKm: "សារ & ជំនួយអតិថិជន",
    desc: "Respond to customer inquiries, support tickets and live customer chat",
    actions: ["view", "reply", "delete"]
  },
  {
    id: "inventory",
    name: "Inventory & Warehouses",
    nameKm: "ស្តុកទំនិញ & ឃ្លាំង",
    desc: "Track real-time stock levels, low-stock alerts, stock count adjustments",
    actions: ["view", "adjust", "reorder"]
  },
  {
    id: "purchases",
    name: "Purchases & Stock In",
    nameKm: "ការទិញចូល & នាំចូលស្តុក",
    desc: "Manage supplier purchase orders, inward goods receipts, cost tracking",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "suppliers",
    name: "Suppliers & Vendors",
    nameKm: "អ្នកផ្គត់ផ្គង់",
    desc: "Manage vendor contacts, payment agreements, and supplier directories",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    id: "attendance",
    name: "Staff Attendance & Leave",
    nameKm: "វត្តមាន & សុំច្បាប់បុគ្គលិក",
    desc: "QR code check-ins, attendance logs, leave requests approval, work shifts",
    actions: ["view", "checkin", "approve", "export"]
  },
  {
    id: "customers",
    name: "Customers & Accounts",
    nameKm: "អតិថិជន & គណនី",
    desc: "Manage customer accounts, VIP tiers, loyalty points, user ban status",
    actions: ["view", "edit", "ban"]
  },
  {
    id: "reports",
    name: "Reports & Financials",
    nameKm: "របាយការណ៍ & ហិរញ្ញវត្ថុ",
    desc: "Export financial statements, profit margins, sales breakdown reports",
    actions: ["view", "export"]
  },
  {
    id: "settings",
    name: "System Settings & RBAC",
    nameKm: "ការកំណត់ប្រព័ន្ធ & RBAC",
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

// Safe localStorage loader that discards corrupted legacy cache containing mojibake
function getCleanLocalStorage(keys, fallback) {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        // If the stored data contains corrupted mojibake bytes, purge it
        if (raw.includes("áž") || raw.includes("áŸ") || raw.includes("ðŸ")) {
          localStorage.removeItem(key);
          continue;
        }

        return JSON.parse(raw);
      }
    } catch {
      // ignore parse errors
    }
  }
  return fallback;
}

function SettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { can, isSuperAdmin } = usePermissions();
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, isKhmer, t } = useTranslation();

  // Clean any legacy corrupted localStorage entries on mount
  useEffect(() => {
    try {
      const allKeys = Object.keys(localStorage);
      for (const k of allKeys) {
        if (k.startsWith("angkor_admin_")) {
          const val = localStorage.getItem(k);
          if (val && (val.includes("áž") || val.includes("áŸ") || val.includes("ðŸ"))) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Guard: if user does not have view permission for settings, block rendering and show AccessDeniedView
  if (!isSuperAdmin && !can("settings", "view")) {
    return <AccessDeniedView moduleName={isKhmer ? "ការកំណត់ប្រព័ន្ធ (System Settings)" : "System Settings & RBAC"} />;
  }

  const [activeTab, setActiveTab] = useState("appearance_language");

  // State Management with LocalStorage Fallback and Auto-Sanitization
  const [roles, setRoles] = useState(() => {
    return getCleanLocalStorage(["angkor_admin_roles_v3", "angkor_admin_roles_v2", "angkor_admin_roles_v1"], DEFAULT_ROLES);
  });

  const [selectedRoleId, setSelectedRoleId] = useState(DEFAULT_ROLES[0].id);

  const [staff, setStaff] = useState(() => {
    return getCleanLocalStorage(["angkor_admin_staff_v2", "angkor_admin_staff_v1"], DEFAULT_STAFF);
  });

  const [settings, setSettings] = useState(() => {
    return getCleanLocalStorage(["angkor_admin_settings_v2", "angkor_admin_settings_v1"], DEFAULT_SYSTEM_SETTINGS);
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
        title: isKhmer ? "មិនស្គាល់អ្នកប្រើប្រាស់" : "User Not Found",
        text: isKhmer ? "សូមចូលប្រើប្រាស់ម្តងទៀត" : "Please re-login to update security PIN",
      });
      return;
    }

    const cleanPin = String(pinForm.pin || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      Swal.fire({
        icon: "warning",
        title: isKhmer ? "កូដ PIN ត្រូវតែមាន ៦ ខ្ទង់" : "6-Digit PIN Required",
        text: isKhmer ? "កូដ PIN សុវត្ថិភាពត្រូវតែជាលេខ ៦ ខ្ទង់គត់ (ឧ. 123456)" : "Security PIN must be exactly 6 numeric digits (e.g. 123456).",
      });
      return;
    }

    if (pinForm.pin !== pinForm.confirmPin) {
      Swal.fire({
        icon: "warning",
        title: isKhmer ? "កូដ PIN មិនត្រូវគ្នា" : "PINs Do Not Match",
        text: isKhmer ? "សូមផ្ទៀងផ្ទាត់កូដ PIN ទាំងពីរប្រអប់ឱ្យដូចគ្នា" : "Please ensure both PIN fields match exactly.",
      });
      return;
    }

    try {
      setIsUpdatingPin(true);
      await enableStaff2FAApi(currentUser.id, cleanPin);
      localStorage.setItem("angkor_staff_pin", cleanPin);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (e) { }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានកំណត់កូដ PIN ៦ ខ្ទង់ជោគជ័យ!" : "6-Digit Security PIN Saved!",
        text: isKhmer
          ? "កូដ PIN ៦ ខ្ទង់ត្រូវបានបើកដំណើរការសម្រាប់គណនីរបស់អ្នករួចរាល់។"
          : "Your 6-digit security PIN has been activated for this account.",
        timer: 2000,
        showConfirmButton: false,
      });

      setPinForm({ pin: "", confirmPin: "" });
      dispatch(setAuth({ user: { ...currentUser, two_fa_enabled: true } }));
      loadStaffAndRoles();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: isKhmer ? "បរាជ័យក្នុងការកំណត់ PIN" : "Failed to Set PIN",
        text: err?.response?.data?.message || err?.message || "Could not configure security PIN.",
      });
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleDisablePin = async () => {
    if (!currentUser?.id) return;

    Swal.fire({
      title: isKhmer ? "បិទកូដ PIN សុវត្ថិភាព?" : "Disable Security PIN?",
      text: isKhmer ? "តើអ្នកចង់បិទការទាមទារកូដ PIN ពេលចូលប្រើប្រាស់មែនទេ?" : "Are you sure you want to remove 2FA PIN protection from this account?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "បាទ/ចាស បិទ PIN" : "Yes, Disable PIN",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          setIsUpdatingPin(true);
          await disableStaff2FAApi(currentUser.id);
          localStorage.removeItem("angkor_staff_pin");
          dispatch(setAuth({ user: { ...currentUser, two_fa_enabled: false } }));
          Swal.fire({
            icon: "success",
            title: isKhmer ? "បានបិទ PIN រួចរាល់" : "PIN Disabled",
            text: isKhmer ? "ការផ្ទៀងផ្ទាត់ PIN ត្រូវបានបិទដោយជោគជ័យ។" : "Security PIN verification has been disabled.",
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
        title: isKhmer ? "ដំណឹង" : "Super Admin Permissions",
        text: isKhmer
          ? "Super Administrator មានសិទ្ធិពេញលេញលើគ្រប់ផ្នែកទាំងអស់នៃប្រព័ន្ធជាស្វ័យប្រវត្តិ។"
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
      } catch (e) { }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានរក្សាទុកសិទ្ធិជោគជ័យ!" : "Role Permissions Saved!",
        text: isKhmer
          ? `សិទ្ធិសម្រាប់តួនាទី "${targetRole.name}" ត្រូវបានធ្វើបច្ចុប្បន្នភាពក្នុង Database តាមរយៈ Backend API រួចរាល់។`
          : `Permissions for "${targetRole.name}" have been updated and synced to backend database (/api/roles/${targetRole.id}).`,
        timer: 2200,
        showConfirmButton: false,
        confirmButtonColor: "#166534"
      });
    } catch (error) {
      console.error("Failed to sync role permissions to API:", error);
      Swal.fire({
        icon: "error",
        title: isKhmer ? "បរាជ័យក្នុងការរក្សាទុក" : "Failed to Sync with API",
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
      } catch (e) { }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានរក្សាទុកជោគជ័យ!" : "Settings Saved!",
        text: isKhmer
          ? "ការកំណត់រូបរាង ភាសា សិទ្ធិបុគ្គលិក និងព័ត៌មានទូទៅត្រូវបានធ្វើបច្ចុប្បន្នភាពក្នុងប្រព័ន្ធ និង Database។"
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

        localStorage.removeItem("angkor_admin_roles_v2");
        localStorage.removeItem("angkor_admin_roles_v1");
        localStorage.removeItem("angkor_admin_staff_v1");
        localStorage.removeItem("angkor_admin_settings_v1");
        window.dispatchEvent(new Event("angkor_roles_updated"));

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
    if (selectedRoleId === "super_admin" || String(currentRole?.name).toLowerCase().includes("super")) {
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
      Swal.fire("Warning", isKhmer ? "សូមបញ្ចូលឈ្មោះតួនាទី" : "Please enter role title", "warning");
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
      } catch (e) { }

      await loadStaffAndRoles();

      if (createdId) {
        setSelectedRoleId(createdId);
      }

      setNewRoleForm({ name: "", desc: "" });
      setRoleModalOpen(false);

      Swal.fire({
        title: isKhmer ? "បង្កើតតួនាទីជោគជ័យ!" : "Role Created Successfully!",
        text: isKhmer
          ? `តួនាទី "${roleName}" ត្រូវបានរក្សាទុកក្នុង Database តាមរយៈ API (/api/roles)។`
          : `Role "${roleName}" was created and saved to database via /api/roles.`,
        icon: "success",
        timer: 2500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Failed to create role via API:", error);
      Swal.fire({
        title: isKhmer ? "បរាជ័យក្នុងការបង្កើតតួនាទី" : "Failed to Create Role",
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
      title: isKhmer ? `លុបតួនាទី "${roleName}"?` : `Delete "${roleName}"?`,
      text: isKhmer ? "តួនាទីនេះនឹងត្រូវលុបចេញពី Database តាមរយៈ API (/api/roles)។" : "This role will be deleted from the database via /api/roles.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: isKhmer ? "បាទ/ចាស លុប" : "Delete Role",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteRoleApi(roleId);
          await loadStaffAndRoles();
          Swal.fire(isKhmer ? "បានលុប!" : "Deleted!", `Role "${roleName}" removed.`, "success");
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
        Swal.fire(isKhmer ? "ជោគជ័យ!" : "Staff Updated", isKhmer ? "ព័ត៌មានបុគ្គលិកត្រូវបានកែប្រែ។" : "User details and role refreshed.", "success");
      } else {
        if (!staffForm.password || staffForm.password.length < 6) {
          Swal.fire("Warning", isKhmer ? "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ!" : "Password must be at least 6 characters long.", "warning");
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
        Swal.fire(isKhmer ? "ជោគជ័យ!" : "Staff Added", isKhmer ? "គណនីបុគ្គលិកថ្មីត្រូវបានបង្កើត។" : "New administrator user created.", "success");
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
      title: isKhmer ? `លុបបុគ្គលិក ${member.name}?` : `Delete Staff ${member.name}?`,
      text: isKhmer ? "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។" : "This staff account will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: isKhmer ? "បាទ/ចាស លុប" : "Yes, Delete",
      cancelButtonText: isKhmer ? "បោះបង់" : "Cancel"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await deleteStaffApi(member.id);
          setStaff((prev) => prev.filter((s) => s.id !== member.id));
          Swal.fire(isKhmer ? "បានលុប!" : "Deleted!", isKhmer ? "បុគ្គលិកត្រូវបានលុបចេញពីប្រព័ន្ធ។" : "Staff member has been removed.", "success");
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
            <h1>{isKhmer ? "ការកំណត់ប្រព័ន្ធ & សិទ្ធិគ្រប់គ្រង Admin" : "Admin Settings & RBAC Control"}</h1>
            <p>
              {isKhmer
                ? "កំណត់រូបរាង ស្បែកពណ៌ ភាសា សិទ្ធិតួនាទីបុគ្គលិក ធនាគារទូទាត់ និងសុវត្ថិភាពទូទៅនៃប្រព័ន្ធ។"
                : "Configure appearance theme, language, role-based access permissions, payment gateways, and security preferences."}
            </p>
          </div>
        </div>

        {can("settings", "edit") && (
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
                  <option value="light">☀️ Light Theme Mode</option>
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
                    {resolvedTheme === "dark" ? "🌙 Dark Theme" : "☀️ Light Theme"}
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
                    <span>{isKhmer ? "ជ្រើសរើសតួនាទីដើម្បីកំណត់សិទ្ធិ" : "Select Role to Configure Permissions"}</span>
                  </h3>
                  <p>{isKhmer ? "ជ្រើសរើសតួនាទីដើម្បីមើល ឬកែប្រែសិទ្ធិនីមួយៗក្នុងប្រព័ន្ធ រួច Sync ទៅកាន់ Database Backend API" : "Choose a role to inspect or adjust module privileges and save directly to backend API."}</p>
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
                    <span>{isKhmer ? "បន្ថែមតួនាទីថ្មី" : "Add New Role"}</span>
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
                        <span>{isKhmer ? "បុគ្គលិកប្រើប្រាស់៖" : "Assigned Staff:"}</span>
                        <span className="role-user-count">
                          {staff.filter((s) => String(s.roleId) === String(role.id)).length} {isKhmer ? "នាក់" : "Users"}
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
                    <span>{isKhmer ? `តារាងសិទ្ធិសម្រាប់៖ ${currentRole.name}` : `Permissions Matrix for: ${currentRole.name}`}</span>
                  </h3>
                  <p>{isKhmer ? "ធីក ឬដោះធីកលើសកម្មភាពនីមួយៗ រួចចុច 'រក្សាទុកសិទ្ធិ' ដើម្បីបញ្ជូនទៅ API (/api/roles)" : "Configure capabilities below and click 'Save Role Permissions' to sync to database."}</p>
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
                      <span>{isKhmer ? "ផ្តល់សិទ្ធិទាំងអស់" : "Grant All"}</span>
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
                      <span>{isKhmer ? "ដកសិទ្ធិទាំងអស់" : "Revoke All"}</span>
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
                          <span>{isKhmer ? "កំពុងរក្សាទុក..." : "Saving..."}</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>{isKhmer ? "រក្សាទុកសិទ្ធិតួនាទីនេះ" : "Save Role Permissions"}</span>
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
                        {isKhmer ? "🛡️ សិទ្ធិពេញលេញអចិន្ត្រៃយ៍" : "🛡️ Permanent Unrestricted Master Access"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569" }}>
                    {isKhmer
                      ? `សិទ្ធិអនុញ្ញាត៖ ${currentGrantedCount} / ${totalSystemActions} (${currentPercentage}%)`
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
                      <th style={{ width: "35%" }}>{isKhmer ? "ផ្នែក / មុខងារ" : "Module Name"}</th>
                      <th style={{ width: "15%", textAlign: "center" }}>{isKhmer ? "ជ្រើសទាំងអស់" : "Select All"}</th>
                      <th>{isKhmer ? "សិទ្ធិអនុញ្ញាត" : "Permissions & Actions"}</th>
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
                <span>{isKhmer ? "គណនី Admin & បុគ្គលិកគ្រប់គ្រង" : "Admin & Staff Accounts"}</span>
              </h3>
              <p>{isKhmer ? "គ្រប់គ្រងអ្នកប្រើប្រាស់ និងតួនាទីរបស់ពួកគេក្នុងប្រព័ន្ធ" : "Manage back-office users and their designated system roles."}</p>
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
                <span>{isKhmer ? "បន្ថែមបុគ្គលិកថ្មី" : "Add Staff User"}</span>
              </button>
            )}
          </div>

          <div className="staff-table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>{isKhmer ? "ឈ្មោះអ្នកប្រើ" : "User"}</th>
                  <th>{isKhmer ? "តួនាទី" : "Assigned Role"}</th>
                  <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                  <th>{isKhmer ? "សកម្មភាពចុងក្រោយ" : "Last Active"}</th>
                  {can("settings", "edit") && <th style={{ textAlign: "right" }}>{isKhmer ? "សកម្មភាព" : "Actions"}</th>}
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
                              title: isKhmer ? `ប្តូរលេខសម្ងាត់សម្រាប់ ${member.name}` : `Change Password for ${member.name}`,
                              input: "password",
                              inputLabel: isKhmer ? "លេខសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួអក្សរ)" : "New Password (min 6 characters)",
                              inputPlaceholder: isKhmer ? "បញ្ចូលលេខសម្ងាត់ថ្មី..." : "Enter new password...",
                              showCancelButton: true,
                              confirmButtonText: isKhmer ? "ផ្លាស់ប្តូរ" : "Update Password",
                              confirmButtonColor: "#f57c00",
                              inputValidator: (val) => {
                                if (!val || val.length < 6) return isKhmer ? "លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ!" : "Password must be at least 6 characters!";
                              }
                            });
                            if (newPassword) {
                              try {
                                await adminChangeUserPasswordApi(member.id, newPassword).catch(() => null);
                                Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", isKhmer ? `បានផ្លាស់ប្តូរលេខសម្ងាត់សម្រាប់ ${member.name}` : `Password updated for ${member.name}`, "success");
                              } catch (err) {
                                Swal.fire("Error", err.message || "Failed to update password", "error");
                              }
                            }
                          }}
                        >
                          <Key size={13} />
                          <span>{isKhmer ? "ប្តូរលេខសម្ងាត់" : "Password"}</span>
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
                          <span>{isKhmer ? "កែប្រែ" : "Edit"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px", marginRight: "6px" }}
                          onClick={async () => {
                            const action = await Swal.fire({
                              title: isKhmer ? `គ្រប់គ្រង 2FA សម្រាប់ ${member.name}` : `Manage 2FA for ${member.name}`,
                              text: isKhmer ? "ជ្រើសរើសសកម្មភាព 2FA ដែលអ្នកចង់អនុវត្ត" : "Choose a 2FA action to perform",
                              icon: "question",
                              showCancelButton: true,
                              confirmButtonText: isKhmer ? "បន្ថែម/កែប្រែ PIN" : "Set / Update PIN",
                              cancelButtonText: isKhmer ? "បិទ" : "Cancel",
                              showDenyButton: true,
                              denyButtonText: isKhmer ? "បិទផ្អាក 2FA" : "Disable 2FA",
                              confirmButtonColor: "#f57c00",
                              denyButtonColor: "#dc2626"
                            });

                            if (action.isConfirmed) {
                              const { value: pin } = await Swal.fire({
                                title: isKhmer ? `កំណត់ 2FA PIN សម្រាប់ ${member.name}` : `Set 2FA PIN for ${member.name}`,
                                input: "password",
                                inputLabel: isKhmer ? "PIN (យ៉ាងតិច ៤ តួខ្ទង់)" : "PIN (min 4 digits)",
                                inputPlaceholder: isKhmer ? "បញ្ចូល PIN..." : "Enter PIN...",
                                showCancelButton: true,
                                confirmButtonText: isKhmer ? "រក្សាទុក" : "Save PIN",
                                confirmButtonColor: "#f57c00",
                                inputValidator: (val) => {
                                  if (!val || val.length < 4) return isKhmer ? "PIN ត្រូវមានយ៉ាងតិច ៤ តួ!" : "PIN must be at least 4 digits!";
                                }
                              });

                              if (pin) {
                                try {
                                  await enableStaff2FAApi(member.id, pin);
                                  Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", isKhmer ? `2FA PIN ត្រូវបានកំណត់សម្រាប់ ${member.name}` : `2FA PIN configured for ${member.name}`, "success");
                                } catch (err) {
                                  Swal.fire("Error", err.message || "Failed to enable 2FA", "error");
                                }
                              }
                            } else if (action.isDenied) {
                              try {
                                await disableStaff2FAApi(member.id);
                                Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", isKhmer ? `2FA ត្រូវបានបិទសម្រាប់ ${member.name}` : `2FA disabled for ${member.name}`, "success");
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
                          <span>{isKhmer ? "លុប" : "Delete"}</span>
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
                      {isKhmer ? "កូដ PIN សុវត្ថិភាព ៦ ខ្ទង់ (6-Digit Security PIN)" : "6-Digit Staff Security PIN"}
                    </h4>
                    <small style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      {isKhmer
                        ? "កំណត់ ឬប្តូរកូដ PIN ៦ ខ្ទង់សម្រាប់ផ្ទៀងផ្ទាត់ពេលចូលប្រព័ន្ធ Admin"
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
                      ? (isKhmer ? "● កំពុងបើកដំណើរការ PIN ៦ ខ្ទង់" : "● 6-Digit PIN Active")
                      : (isKhmer ? "○ មិនទាន់កំណត់ PIN" : "○ No PIN Active")}
                  </span>

                  {currentUser?.two_fa_enabled && (
                    <button
                      type="button"
                      className="btn-outline-secondary"
                      style={{ fontSize: "12px", padding: "4px 10px", color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
                      onClick={handleDisablePin}
                      disabled={isUpdatingPin}
                    >
                      {isKhmer ? "បិទ PIN" : "Disable PIN"}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "14px" }}>
                <div>
                  <label className="form-label" style={{ fontSize: "13px" }}>
                    {isKhmer ? "បញ្ចូលកូដ PIN ថ្មី (៦ ខ្ទង់)" : "New 6-Digit PIN"}
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
                    {isKhmer ? "ផ្ទៀងផ្ទាត់កូដ PIN ម្តងទៀត" : "Confirm 6-Digit PIN"}
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
                  <span>{isUpdatingPin ? (isKhmer ? "កំពុងរក្សាទុក..." : "Saving...") : (isKhmer ? "រក្សាទុកកូដ PIN ៦ ខ្ទង់" : "Save 6-Digit Security PIN")}</span>
                </button>
              </div>
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
                  <label className="form-label">{isKhmer ? "លេខទូរស័ព្ទ" : "Phone Number"}</label>
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
                    <label className="form-label">{isKhmer ? "លេខសម្ងាត់ដំបូង *" : "Initial Password *"}</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showStaffPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder={isKhmer ? "យ៉ាងតិច ៦ តួអក្សរ" : "Min 6 characters"}
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
