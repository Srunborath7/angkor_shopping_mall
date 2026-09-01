import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";

// Default standard RBAC permissions fallback matrix
export const DEFAULT_ROLE_PRESETS = {
  super_admin: {
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
    staff: ["view", "create", "edit", "delete"],
    reports: ["view", "export"],
    settings: ["view", "edit"]
  },
  admin: {
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
    staff: ["view", "create", "edit", "delete"],
    reports: ["view", "export"],
    settings: ["view", "edit"]
  },
  mall_manager: {
    dashboard: ["view", "export"],
    products: ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit", "delete"],
    brands: ["view", "create", "edit", "delete"],
    flash_sale: ["view", "create", "edit", "delete"],
    trading: ["view", "value", "approve"],
    orders: ["view", "process", "cancel"],
    messages: ["view", "reply"],
    inventory: ["view", "adjust", "reorder"],
    purchases: ["view", "create", "edit"],
    suppliers: ["view", "create"],
    attendance: ["view", "approve", "export"],
    customers: ["view", "edit"],
    staff: ["view", "create", "edit"],
    reports: ["view", "export"],
    settings: []
  },
  manager: {
    dashboard: ["view", "export"],
    products: ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit", "delete"],
    brands: ["view", "create", "edit", "delete"],
    flash_sale: ["view", "create", "edit", "delete"],
    trading: ["view", "value", "approve"],
    orders: ["view", "process", "cancel"],
    messages: ["view", "reply"],
    inventory: ["view", "adjust", "reorder"],
    purchases: ["view", "create", "edit"],
    suppliers: ["view", "create"],
    attendance: ["view", "approve", "export"],
    customers: ["view", "edit"],
    staff: ["view", "create", "edit"],
    reports: ["view", "export"],
    settings: []
  },
  orders_specialist: {
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
    staff: ["view"],
    reports: ["view"],
    settings: []
  },
  inventory_clerk: {
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
    staff: ["view"],
    reports: ["view"],
    settings: []
  },
  customer_support: {
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
    staff: ["view"],
    reports: [],
    settings: []
  },
  staff: {
    dashboard: ["view"],
    products: ["view"],
    orders: ["view", "process"],
    attendance: ["view", "checkin"],
    inventory: ["view"],
    messages: ["view", "reply"],
    staff: ["view"],
    settings: []
  },
  customer: {
    dashboard: [],
    products: ["view"],
    categories: ["view"],
    brands: ["view"],
    orders: ["view"],
    staff: [],
    settings: []
  }
};

/**
 * Custom hook to verify Role-Based Access Control (RBAC) permissions.
 * Usage:
 *   const { can, isSuperAdmin, currentRoleName, permissions } = usePermissions();
 *   if (can("products", "create")) { ... }
 *   if (can("settings", "view")) { ... }
 */
export function usePermissions() {
  const { role, user } = useSelector((state) => state.auth || {});
  const [version, setVersion] = useState(0);

  // Listen for real-time permission configuration updates from Settings
  useEffect(() => {
    const handleRoleUpdate = () => {
      setVersion((v) => v + 1);
    };

    window.addEventListener("angkor_roles_updated", handleRoleUpdate);
    window.addEventListener("storage", handleRoleUpdate);

    return () => {
      window.removeEventListener("angkor_roles_updated", handleRoleUpdate);
      window.removeEventListener("storage", handleRoleUpdate);
    };
  }, []);

  const userRoleStr = useMemo(() => {
    return (
      role ||
      user?.role ||
      user?.role_name ||
      user?.roles?.[0]?.name ||
      (Array.isArray(user?.roles) ? user.roles.map((r) => r.name || r).join(" ") : "") ||
      ""
    ).toLowerCase().trim();
  }, [role, user]);

  const isSuperAdmin = useMemo(() => {
    if (!user && !role) return false;
    const roleId = String(user?.role_id || user?.roles?.[0]?.id || "").toLowerCase();
    return (
      roleId === "super_admin" ||
      roleId === "superadmin" ||
      userRoleStr === "super_admin" ||
      userRoleStr === "superadmin" ||
      userRoleStr === "super admin" ||
      userRoleStr === "super administrator"
    );
  }, [user, role, userRoleStr]);

  const currentRoleName = useMemo(() => {
    return (
      user?.role_name ||
      (Array.isArray(user?.roles) ? user.roles.map((r) => r.name || r).join(", ") : null) ||
      (typeof user?.role === "string" ? user.role : null) ||
      (typeof role === "string" ? role : null) ||
      (isSuperAdmin ? "Super Administrator" : "Staff User")
    );
  }, [user, role, isSuperAdmin]);

  // Load active permissions map for this role
  const permissionsMap = useMemo(() => {
    if (isSuperAdmin) {
      return DEFAULT_ROLE_PRESETS.super_admin;
    }

    // Helper to parse array of permission strings (e.g., ["products:view", "products:create"])
    const parseArrayPerms = (arr) => {
      const map = {};
      arr.forEach((item) => {
        if (typeof item === "string") {
          const delimiter = item.includes(":") ? ":" : ".";
          const [mod, act] = item.split(delimiter);
          if (mod && act) {
            if (!map[mod]) map[mod] = [];
            if (!map[mod].includes(act)) map[mod].push(act);
            // Alias edit -> update
            if (act === "update" && !map[mod].includes("edit")) map[mod].push("edit");
            if (act === "edit" && !map[mod].includes("update")) map[mod].push("update");
          }
        }
      });
      return map;
    };

    // 1. Check user.permissions from Backend API (array of string codes or object)
    if (Array.isArray(user?.permissions) && user.permissions.length > 0) {
      const parsed = parseArrayPerms(user.permissions);
      // Ensure settings is not present for non-superadmin unless explicitly granted
      return parsed;
    }
    if (user?.permissions && typeof user.permissions === "object" && !Array.isArray(user.permissions)) {
      return user.permissions;
    }

    // 2. Check user.roles[].permissions from Backend API
    if (Array.isArray(user?.roles) && user.roles.length > 0) {
      const allRolePerms = user.roles.flatMap((r) => r.permissions || []);
      if (allRolePerms.length > 0) {
        if (typeof allRolePerms[0] === "string") {
          return parseArrayPerms(allRolePerms);
        } else if (typeof allRolePerms[0] === "object") {
          const map = {};
          user.roles.forEach((r) => {
            if (r.permissions && typeof r.permissions === "object" && !Array.isArray(r.permissions)) {
              Object.assign(map, r.permissions);
            }
          });
          if (Object.keys(map).length > 0) return map;
        }
      }
    }

    // 3. Check localStorage custom saved RBAC matrix v2
    try {
      const savedRoles = localStorage.getItem("angkor_admin_roles_v2") || localStorage.getItem("angkor_admin_roles_v1");
      if (savedRoles) {
        const parsed = JSON.parse(savedRoles);
        if (Array.isArray(parsed)) {
          const userRoleId = String(user?.role_id || user?.roles?.[0]?.id || "");
          const matched = parsed.find((r) => {
            if (userRoleId && String(r.id) === userRoleId) return true;
            if (r.name && userRoleStr && r.name.toLowerCase() === userRoleStr) return true;
            if (r.name && userRoleStr && userRoleStr.includes(r.name.toLowerCase())) return true;
            if (r.id && userRoleStr && userRoleStr === String(r.id).toLowerCase()) return true;
            return false;
          });

          if (matched && matched.permissions) {
            let activePerms = matched.permissions;
            if (Array.isArray(matched.permissions)) {
              activePerms = parseArrayPerms(matched.permissions);
            }
            // Strip settings permission if role is not super admin or admin
            const isAdm = isSuperAdmin || String(matched.id) === "super_admin" || String(matched.id) === "admin" || userRoleStr === "admin" || userRoleStr === "administrator";
            if (!isAdm) {
              activePerms = { ...activePerms, settings: activePerms.settings || [] };
            }
            return activePerms;
          }
        }
      }
    } catch (e) {
      console.warn("Could not read local RBAC roles:", e);
    }

    // 4. Fallback to default presets with strict priority matching
    if (userRoleStr === "super_admin" || userRoleStr === "superadmin" || userRoleStr === "super admin") {
      return DEFAULT_ROLE_PRESETS.super_admin;
    }
    if (userRoleStr.includes("manager") || userRoleStr === "mall_manager") {
      return DEFAULT_ROLE_PRESETS.manager;
    }
    if (userRoleStr === "admin" || userRoleStr === "administrator") {
      return DEFAULT_ROLE_PRESETS.admin;
    }
    if (userRoleStr.includes("order") || userRoleStr.includes("sale")) {
      return DEFAULT_ROLE_PRESETS.orders_specialist;
    }
    if (userRoleStr.includes("inventory") || userRoleStr.includes("warehouse") || userRoleStr.includes("stock")) {
      return DEFAULT_ROLE_PRESETS.inventory_clerk;
    }
    if (userRoleStr.includes("support") || userRoleStr.includes("chat") || userRoleStr.includes("service")) {
      return DEFAULT_ROLE_PRESETS.customer_support;
    }
    if (userRoleStr.includes("staff") || userRoleStr.includes("cashier")) {
      return DEFAULT_ROLE_PRESETS.staff;
    }
    if (userRoleStr.includes("customer")) {
      return DEFAULT_ROLE_PRESETS.customer;
    }

    // Default fallback: minimal view access, NO settings
    return {
      dashboard: ["view"],
      products: ["view"],
      categories: ["view"],
      brands: ["view"],
      flash_sale: ["view"],
      trading: ["view"],
      orders: ["view"],
      messages: ["view"],
      inventory: ["view"],
      purchases: [],
      suppliers: [],
      attendance: ["view", "checkin"],
      customers: ["view"],
      reports: [],
      settings: []
    };
  }, [isSuperAdmin, user, userRoleStr, version]);

  /**
   * Check if active user has permission for a module action.
   * @param {string} moduleId - e.g., 'products', 'settings', 'categories', 'orders'
   * @param {string} action - e.g., 'view', 'create', 'edit', 'update', 'delete', 'process', 'approve'
   * @returns {boolean}
   */
  const can = (moduleId, action = "view") => {
    if (isSuperAdmin) return true;
    if (!moduleId) return true;

    // Staff module alias check: if user can view customers or attendance, or has staff perms
    if (moduleId === "staff" && action === "view") {
      if (permissionsMap?.staff?.includes("view")) return true;
      if (permissionsMap?.customers?.includes("view") || permissionsMap?.attendance?.includes("view")) return true;
      const isStaffOrAdminRole = ["admin", "manager", "staff", "supervisor", "super"].some((r) =>
        userRoleStr.includes(r)
      );
      if (isStaffOrAdminRole) return true;
    }

    const modulePerms = permissionsMap?.[moduleId];
    if (!Array.isArray(modulePerms) || modulePerms.length === 0) {
      return false;
    }

    if (action === "view") {
      return modulePerms.includes("view");
    }

    // Check action alias (edit <-> update)
    const targetActions = [action];
    if (action === "edit") targetActions.push("update");
    if (action === "update") targetActions.push("edit");

    return targetActions.some((act) => modulePerms.includes(act));
  };

  return {
    can,
    isSuperAdmin,
    currentRoleName,
    permissions: permissionsMap
  };
}

/**
 * Access Denied Fallback View Component for unpermitted pages
 */
export function AccessDeniedView({ moduleName = "this page" }) {
  const navigate = useNavigate();
  const { currentRoleName } = usePermissions();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65vh",
        padding: "32px 20px",
        textAlign: "center"
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "rgba(220, 38, 38, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#dc2626",
          marginBottom: "20px"
        }}
      >
        <Lock size={40} />
      </div>

      <h2
        style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: "8px"
        }}
      >
        Access Restricted
      </h2>

      <p
        style={{
          fontSize: "1rem",
          color: "#64748b",
          maxWidth: "480px",
          lineHeight: "1.6",
          marginBottom: "16px"
        }}
      >
        Your current role (<strong>{currentRoleName}</strong>) does not have permission to view {moduleName}.
        Please contact your System Administrator if you require access.
      </p>

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#334155",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={16} /> Go Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            background: "#166534",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer"
          }}
        >
          <Home size={16} /> Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default usePermissions;
