import { api } from "../api/api";
import { StaffApi } from "./customerService";

const STORAGE_KEY_ATTENDANCE = "angkor_mall_attendance_records";
const STORAGE_KEY_STAFF = "angkor_mall_attendance_staff";
const STORAGE_KEY_SHIFTS = "angkor_mall_shifts";
const STORAGE_KEY_GEOFENCE = "angkor_mall_geofence_config";

// Default Angkor Shopping Mall Geofence Coordinates
export const DEFAULT_MALL_GEOFENCE = {
  name: "Angkor Shopping Mall (Main Branch)",
  khmerName: "ផ្សារទំនើប អង្គរ ម៉ល (សាខាកណ្តាល)",
  latitude: 11.5564,
  longitude: 104.9282,
  geofenceRadiusMeters: 300,
  address: "Russian Federation Blvd (110), Phnom Penh, Cambodia",
  strictGeofenceEnforcement: false
};

export const getStoredGeofenceConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GEOFENCE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GEOFENCE, JSON.stringify(DEFAULT_MALL_GEOFENCE));
      return DEFAULT_MALL_GEOFENCE;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_MALL_GEOFENCE;
  }
};

export const saveStoredGeofenceConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY_GEOFENCE, JSON.stringify(config));
  } catch (e) {}
};

/**
 * Haversine formula to compute distance in meters between two GPS coordinates
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Acquire device GPS location with accuracy and geofence calculation
 */
export const getCurrentDeviceLocation = () => {
  return new Promise((resolve) => {
    const geofence = getStoredGeofenceConfig();

    if (!navigator.geolocation) {
      resolve({
        success: false,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        accuracy: 10,
        address: `${geofence.name} (Kiosk Terminal)`,
        isWithinGeofence: true,
        distanceMeters: 0,
        source: "Terminal Default"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 15);
        const distance = calculateDistanceMeters(lat, lng, geofence.latitude, geofence.longitude);
        const isWithin = distance <= geofence.geofenceRadiusMeters;

        resolve({
          success: true,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          accuracy,
          address: isWithin
            ? `${geofence.name} (${distance}m from center)`
            : `Outside Mall (${(distance / 1000).toFixed(2)}km away)`,
          isWithinGeofence: isWithin,
          distanceMeters: distance,
          source: "Device GPS"
        });
      },
      (error) => {
        console.warn("GPS tracking fallback:", error.message);
        resolve({
          success: false,
          latitude: geofence.latitude,
          longitude: geofence.longitude,
          accuracy: 30,
          address: `${geofence.name} (IP / On-Site Kiosk)`,
          isWithinGeofence: true,
          distanceMeters: 0,
          error: error.message,
          source: "Terminal IP Fallback"
        });
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 20000 }
    );
  });
};

// Standard Shifts Configuration
export const DEFAULT_SHIFTS = [
  {
    id: "shift_morning",
    name: "Morning Shift (វេនព្រឹក)",
    code: "MORN",
    startTime: "08:00",
    endTime: "17:00",
    breakDurationMinutes: 60,
    graceMinutes: 15,
    color: "#0284c7"
  },
  {
    id: "shift_afternoon",
    name: "Evening Shift (វេនរសៀល/យប់)",
    code: "EVE",
    startTime: "13:00",
    endTime: "22:00",
    breakDurationMinutes: 60,
    graceMinutes: 15,
    color: "#7c3aed"
  },
  {
    id: "shift_fullday",
    name: "Full Day Shift (ពេញមួយថ្ងៃ)",
    code: "FULL",
    startTime: "08:00",
    endTime: "20:00",
    breakDurationMinutes: 90,
    graceMinutes: 15,
    color: "#059669"
  }
];

/**
 * =========================================================================
 * FETCH LIVE USERS / STAFF DIRECTLY FROM BACKEND API (user_role != customer)
 * =========================================================================
 */
export const getStaffListApi = async (currentUser = null) => {
  const defaultStaffRoster = [
    {
      id: "EMP-101",
      name: "Sokha Chan",
      khmerName: "ចាន់ សុខា",
      email: "sokha.chan@angkormall.com",
      phone: "012345678",
      role: "Senior Store Manager",
      user_role: "manager",
      department: "Management",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      pin: "1001",
      defaultShiftId: "shift_morning"
    },
    {
      id: "EMP-102",
      name: "Vireak Bun",
      khmerName: "ប៊ុន វិរៈ",
      email: "vireak.bun@angkormall.com",
      phone: "012345679",
      role: "Lead Cashier",
      user_role: "cashier",
      department: "Cashier",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      pin: "1002",
      defaultShiftId: "shift_morning"
    },
    {
      id: "EMP-103",
      name: "Dara Rath",
      khmerName: "រ័ត្ន តារា",
      email: "dara.rath@angkormall.com",
      phone: "012345680",
      role: "Inventory Supervisor",
      user_role: "inventory",
      department: "Inventory",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      pin: "1003",
      defaultShiftId: "shift_afternoon"
    },
    {
      id: "EMP-104",
      name: "Bopha Khem",
      khmerName: "ខែម បុប្ផា",
      email: "bopha.khem@angkormall.com",
      phone: "012345681",
      role: "Sales Associate",
      user_role: "sales",
      department: "Sales",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      pin: "1004",
      defaultShiftId: "shift_morning"
    },
    {
      id: "EMP-105",
      name: "Rithy Chea",
      khmerName: "ជា រិទ្ធី",
      email: "rithy.chea@angkormall.com",
      phone: "012345682",
      role: "Security Officer",
      user_role: "security",
      department: "Security",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      pin: "1005",
      defaultShiftId: "shift_afternoon"
    }
  ];

  try {
    // 1. Concurrently fetch all users from both /api/users/staff and /api/users
    const [staffRes, usersRes] = await Promise.allSettled([
      StaffApi(),
      api("/api/users", "get")
    ]);

    const staffListRaw =
      staffRes.status === "fulfilled"
        ? staffRes.value?.data || (Array.isArray(staffRes.value) ? staffRes.value : [])
        : [];
    const usersListRaw =
      usersRes.status === "fulfilled"
        ? usersRes.value?.data || (Array.isArray(usersRes.value) ? usersRes.value : [])
        : [];

    // Merge and deduplicate raw API users by id or email
    const rawMap = new Map();
    [...usersListRaw, ...staffListRaw].forEach((u) => {
      if (!u) return;
      const key = String(u.id || u.user_id || u.email || "").trim();
      if (key && !rawMap.has(key)) {
        rawMap.set(key, u);
      }
    });

    const combinedRaw = Array.from(rawMap.values());

    // Strictly filter out any user whose role is customer (Customers must never show in staff select)
    const nonCustomerStaff = combinedRaw.filter((u) => {
      if (!u) return false;

      const userRoleVal = String(u.user_role || "").trim().toLowerCase();
      const roleVal = String(
        u.role_name ||
        u.role?.name ||
        (Array.isArray(u.roles) ? u.roles.map((r) => r.name || r).join(" ") : "") ||
        (typeof u.role === "string" ? u.role : "") ||
        ""
      ).trim().toLowerCase();
      const userTypeVal = String(u.user_type || u.type || "").trim().toLowerCase();

      // Collect all role indicators
      const rolesArray = Array.isArray(u.roles)
        ? u.roles.map((r) => String(typeof r === "object" ? r?.name || "" : r).trim().toLowerCase())
        : [];
      const allRoleValues = [userRoleVal, roleVal, userTypeVal, ...rolesArray].filter(Boolean);

      // Check if user has explicit customer role
      const isCustomer =
        allRoleValues.some((r) => r === "customer" || r === "customers" || r.includes("customer")) &&
        !allRoleValues.some((r) =>
          r.includes("manager") ||
          r.includes("admin") ||
          r.includes("super") ||
          r.includes("staff") ||
          r.includes("cashier") ||
          r.includes("sale") ||
          r.includes("inventory") ||
          r.includes("stock") ||
          r.includes("security") ||
          r.includes("supervisor") ||
          r.includes("lead")
        );

      if (isCustomer) return false;
      if (userRoleVal === "customer" || userRoleVal === "customers") return false;
      if (roleVal === "customer" || roleVal === "customers") return false;
      if (userTypeVal === "customer" || userTypeVal === "customers") return false;

      return true;
    });

    let formattedStaff = nonCustomerStaff.map((u, idx) => {
      const staffName =
        u.name ||
        `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
        u.username ||
        `Staff #${u.id}`;

      const roleTitle =
        u.user_role ||
        (Array.isArray(u.roles) && u.roles.length > 0
          ? u.roles.map((r) => r.name || r).join(", ")
          : null) ||
        u.role?.name ||
        u.role ||
        "Staff Member";

      const departmentName =
        u.department ||
        (roleTitle.toLowerCase().includes("cashier")
          ? "Cashier"
          : roleTitle.toLowerCase().includes("inventory") || roleTitle.toLowerCase().includes("stock")
          ? "Inventory"
          : roleTitle.toLowerCase().includes("sale")
          ? "Sales"
          : roleTitle.toLowerCase().includes("manager") || roleTitle.toLowerCase().includes("admin")
          ? "Management"
          : roleTitle.toLowerCase().includes("it") || roleTitle.toLowerCase().includes("tech")
          ? "IT & Systems"
          : roleTitle.toLowerCase().includes("security")
          ? "Security"
          : "Store Operations");

      const avatarUrl =
        u.avatar ||
        u.image ||
        u.profile_image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(staffName)}&background=0284c7&color=fff&bold=true`;

      const pinCode = String(
        u.pin ||
        (u.phone && u.phone.replace(/\D/g, "").slice(-4)) ||
        (1000 + Number(u.id || idx + 1)).toString().slice(-4)
      );

      return {
        id: String(u.id || u.user_id || `EMP-${idx + 1}`),
        name: staffName,
        khmerName: u.khmer_name || u.khmerName || "",
        email: u.email || "",
        phone: u.phone || "",
        user_role: u.user_role || roleTitle,
        role: roleTitle,
        department: departmentName,
        avatar: avatarUrl,
        pin: pinCode,
        defaultShiftId: u.defaultShiftId || (idx % 2 === 1 ? "shift_afternoon" : "shift_morning")
      };
    });

    // Ensure logged-in currentUser is in the list
    if (currentUser) {
      const curId = String(currentUser.id || currentUser.user_id || "");
      const curName = currentUser.name || `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username;
      const curEmail = currentUser.email || "";

      const existsIdx = formattedStaff.findIndex(
        (s) => (curId && String(s.id) === curId) || (curEmail && s.email === curEmail) || (curName && s.name.toLowerCase() === curName.toLowerCase())
      );

      const curRole =
        (Array.isArray(currentUser.roles) && currentUser.roles.length > 0
          ? currentUser.roles.map((r) => r.name || r).join(", ")
          : null) ||
        currentUser.user_role ||
        currentUser.role?.name ||
        currentUser.role ||
        "Manager";

      const curStaff = {
        id: curId || `USR-${Date.now().toString().slice(-4)}`,
        name: curName || "Manager",
        khmerName: currentUser.khmer_name || currentUser.khmerName || "",
        email: curEmail,
        phone: currentUser.phone || "",
        user_role: curRole,
        role: curRole,
        department: currentUser.department || "Management",
        avatar: currentUser.avatar || currentUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(curName || "Manager")}&background=0284c7&color=fff&bold=true`,
        pin: String(currentUser.pin || "1234"),
        defaultShiftId: "shift_morning"
      };

      if (existsIdx >= 0) {
        formattedStaff[existsIdx] = { ...formattedStaff[existsIdx], ...curStaff };
      } else {
        formattedStaff.unshift(curStaff);
      }
    }

    // Merge default team roster members so managers always have all roles (Cashier, Inventory, Sales, Security) available
    defaultStaffRoster.forEach((defStaff) => {
      const alreadyExists = formattedStaff.some(
        (s) =>
          String(s.id) === String(defStaff.id) ||
          (defStaff.email && s.email === defStaff.email) ||
          s.name.toLowerCase() === defStaff.name.toLowerCase()
      );
      if (!alreadyExists) {
        formattedStaff.push(defStaff);
      }
    });

    if (formattedStaff.length > 0) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(formattedStaff));
      return formattedStaff;
    }
  } catch (err) {
    console.warn("Could not fetch live staff from API, reading fallback roster:", err);
  }

  // Read cached staff if available
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(defaultStaffRoster));
  return defaultStaffRoster;
};

export const getStoredStaff = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const getStoredRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    if (raw) return JSON.parse(raw);
    return [];
  } catch (e) {
    return [];
  }
};

export const saveStoredRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(records));
  } catch (e) {}
};

export const getStoredShifts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHIFTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(DEFAULT_SHIFTS));
      return DEFAULT_SHIFTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_SHIFTS;
  }
};

export const calculateLateStatus = (checkInTimeStr, shift) => {
  if (!shift || !shift.startTime) return { status: "On Time", lateMinutes: 0 };

  const [shiftHour, shiftMinute] = shift.startTime.split(":").map(Number);
  const [inHour, inMinute, inSecond = 0] = checkInTimeStr.split(":").map(Number);

  const shiftTotalMinutes = shiftHour * 60 + shiftMinute;
  const inTotalMinutes = inHour * 60 + inMinute + (inSecond > 0 ? 1 : 0);
  const grace = shift.graceMinutes || 15;

  if (inTotalMinutes > shiftTotalMinutes + grace) {
    return {
      status: "Late",
      lateMinutes: inTotalMinutes - shiftTotalMinutes
    };
  }
  return {
    status: "On Time",
    lateMinutes: 0
  };
};

export const calculateWorkedHours = (checkInTimeStr, checkOutTimeStr, breakMinutes = 0, shift) => {
  if (!checkInTimeStr || !checkOutTimeStr)
    return { totalHours: 0, overtimeHours: 0, earlyMinutes: 0, status: "On Shift" };

  const parseToSeconds = (timeStr) => {
    const [h, m, s = 0] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const inSec = parseToSeconds(checkInTimeStr);
  const outSec = parseToSeconds(checkOutTimeStr);

  let diffSec = outSec - inSec;
  if (diffSec < 0) {
    diffSec += 24 * 3600;
  }

  const effectiveSec = Math.max(0, diffSec - breakMinutes * 60);
  const totalHours = Number((effectiveSec / 3600).toFixed(2));
  const standardHours = 8.0;
  const overtimeHours = totalHours > standardHours ? Number((totalHours - standardHours).toFixed(2)) : 0;

  let earlyMinutes = 0;
  let checkoutStatus = "Completed";

  if (shift && shift.endTime) {
    const shiftEndSec = parseToSeconds(shift.endTime + ":00");
    if (outSec < shiftEndSec - (shift.graceMinutes || 10) * 60) {
      earlyMinutes = Math.round((shiftEndSec - outSec) / 60);
      checkoutStatus = "Early Departure";
    }
  }

  return {
    totalHours,
    overtimeHours,
    earlyMinutes,
    status: checkoutStatus
  };
};

// ==========================================
// CORE ATTENDANCE ACTIONS WITH GPS TRACKING
// ==========================================

/**
 * Check In a staff member with real-time GPS tracking & geofencing
 */
export const checkInStaffApi = async ({
  employeeId,
  shiftId = "shift_morning",
  method = "GPS Mobile / Web",
  location = null,
  notes = "",
  customTime = null,
  customDate = null
}) => {
  // Find staff from live API cache
  let staffList = getStoredStaff();
  if (!staffList || staffList.length === 0) {
    staffList = await getStaffListApi();
  }

  const staff = staffList.find((s) => String(s.id) === String(employeeId));
  if (!staff) {
    throw new Error("Employee not found in active staff roster.");
  }

  const shifts = getStoredShifts();
  const shift = shifts.find((sh) => sh.id === shiftId) || shifts[0];

  const now = new Date();
  const todayStr = customDate || now.toISOString().split("T")[0];
  const timeStr = customTime || now.toTimeString().split(" ")[0];

  const records = getStoredRecords();
  const existingRecord = records.find(
    (r) => String(r.employeeId) === String(employeeId) && r.date === todayStr && !r.checkOutTime
  );

  if (existingRecord) {
    throw new Error(
      `${staff.name} is already checked in for today (${existingRecord.checkInTime}). Please check out first.`
    );
  }

  let locationData = location;
  if (!locationData) {
    locationData = await getCurrentDeviceLocation();
  }

  const { status: checkInStatus, lateMinutes } = calculateLateStatus(timeStr, shift);

  const newRecord = {
    id: "ATT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    employeeId: staff.id,
    userId: staff.id,
    employeeName: staff.name,
    khmerName: staff.khmerName || "",
    department: staff.department || "Store Operations",
    role: staff.role || "Staff Member",
    avatar: staff.avatar,
    date: todayStr,
    shiftId: shift.id,
    shiftName: shift.name,
    checkInTime: timeStr,
    checkInStatus,
    lateMinutes,
    checkInMethod: method,
    checkInLocation: locationData,
    checkOutTime: null,
    checkOutStatus: "On Shift",
    earlyMinutes: 0,
    checkOutMethod: null,
    checkOutLocation: null,
    breakStatus: "None",
    breakStart: null,
    breakEnd: null,
    totalBreakMinutes: 0,
    totalWorkHours: 0,
    overtimeHours: 0,
    status: checkInStatus === "Late" ? "Late" : "Present",
    notes: notes || `Clocked in via ${method} (GPS: ${locationData?.distanceMeters || 0}m from mall)`
  };

  const updatedRecords = [newRecord, ...records];
  saveStoredRecords(updatedRecords);

  // Live API Sync
  try {
    const apiPayload = {
      user_id: staff.id,
      employee_id: staff.id,
      employee_name: staff.name,
      shift_id: shift.id,
      check_in_time: timeStr,
      date: todayStr,
      status: checkInStatus === "Late" ? "Late" : "Present",
      check_in_status: checkInStatus,
      late_minutes: lateMinutes,
      check_in_method: method,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      location_address: locationData?.address,
      is_within_geofence: locationData?.isWithinGeofence,
      distance_meters: locationData?.distanceMeters,
      notes: newRecord.notes
    };
    await api("/api/attendance/check-in", "post", apiPayload).catch(async () => {
      await api("/api/attendance", "post", apiPayload);
    });
  } catch (err) {
    console.warn("Backend API check-in synced locally:", err.message);
  }

  return { success: true, record: newRecord };
};

/**
 * Check Out a staff member with GPS tracking
 */
export const checkOutStaffApi = async ({
  employeeId,
  method = "GPS Mobile / Web",
  location = null,
  notes = "",
  customTime = null,
  customDate = null
}) => {
  const records = getStoredRecords();
  const now = new Date();
  const todayStr = customDate || now.toISOString().split("T")[0];
  const timeStr = customTime || now.toTimeString().split(" ")[0];

  const recordIndex = records.findIndex(
    (r) => String(r.employeeId) === String(employeeId) && r.date === todayStr && !r.checkOutTime
  );

  if (recordIndex === -1) {
    throw new Error("No active check-in record found for this employee today.");
  }

  const currentRecord = records[recordIndex];
  const shifts = getStoredShifts();
  const shift = shifts.find((sh) => sh.id === currentRecord.shiftId);

  let totalBreak = currentRecord.totalBreakMinutes || 0;
  let breakEnd = currentRecord.breakEnd;
  let breakStatus = currentRecord.breakStatus;
  if (breakStatus === "On Break" && currentRecord.breakStart) {
    breakEnd = timeStr;
    breakStatus = "Finished Break";
  }

  let locationData = location;
  if (!locationData) {
    locationData = await getCurrentDeviceLocation();
  }

  const { totalHours, overtimeHours, earlyMinutes, status: checkOutStatus } = calculateWorkedHours(
    currentRecord.checkInTime,
    timeStr,
    totalBreak,
    shift
  );

  const updatedRecord = {
    ...currentRecord,
    checkOutTime: timeStr,
    checkOutStatus,
    earlyMinutes,
    checkOutMethod: method,
    checkOutLocation: locationData,
    breakStatus,
    breakEnd,
    totalBreakMinutes: totalBreak,
    totalWorkHours: totalHours,
    overtimeHours,
    status: "Checked Out",
    notes: notes ? `${currentRecord.notes} | ${notes}` : currentRecord.notes
  };

  records[recordIndex] = updatedRecord;
  saveStoredRecords(records);

  // Live API Sync
  try {
    const apiPayload = {
      user_id: employeeId,
      employee_id: employeeId,
      check_out_time: timeStr,
      date: todayStr,
      status: "Checked Out",
      check_out_status: checkOutStatus,
      total_work_hours: totalHours,
      overtime_hours: overtimeHours,
      early_minutes: earlyMinutes,
      check_out_method: method,
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      notes: updatedRecord.notes
    };
    await api(`/api/attendance/check-out`, "post", apiPayload).catch(async () => {
      await api(`/api/attendance/${updatedRecord.id}`, "put", apiPayload);
    });
  } catch (e) {
    console.warn("Backend API check-out synced locally:", e.message);
  }

  return { success: true, record: updatedRecord };
};

export const toggleBreakApi = async ({ employeeId, notes = "" }) => {
  const records = getStoredRecords();
  const todayStr = new Date().toISOString().split("T")[0];
  const timeStr = new Date().toTimeString().split(" ")[0];

  const recordIndex = records.findIndex(
    (r) => String(r.employeeId) === String(employeeId) && r.date === todayStr && !r.checkOutTime
  );

  if (recordIndex === -1) {
    throw new Error("Cannot take break without an active check-in today.");
  }

  const record = records[recordIndex];
  let updatedRecord;

  if (record.breakStatus === "On Break") {
    const [startH, startM] = (record.breakStart || "12:00:00").split(":").map(Number);
    const [endH, endM] = timeStr.split(":").map(Number);
    const breakDuration = Math.max(5, endH * 60 + endM - (startH * 60 + startM));

    updatedRecord = {
      ...record,
      breakStatus: "Finished Break",
      breakEnd: timeStr,
      totalBreakMinutes: (record.totalBreakMinutes || 0) + breakDuration,
      status: record.checkInStatus === "Late" ? "Late" : "Present",
      notes: notes ? `${record.notes} | Break ended at ${timeStr}` : record.notes
    };
  } else {
    updatedRecord = {
      ...record,
      breakStatus: "On Break",
      breakStart: timeStr,
      status: "On Break",
      notes: notes ? `${record.notes} | Break started at ${timeStr}` : record.notes
    };
  }

  records[recordIndex] = updatedRecord;
  saveStoredRecords(records);

  try {
    await api(`/api/attendance/break`, "post", {
      user_id: employeeId,
      employee_id: employeeId,
      break_status: updatedRecord.breakStatus,
      time: timeStr
    });
  } catch (err) {}

  return { success: true, record: updatedRecord };
};

export const getAttendanceRecordsApi = async ({
  search = "",
  date = "",
  startDate = "",
  endDate = "",
  department = "all",
  status = "all",
  shiftId = "all"
} = {}) => {
  let liveApiRecords = null;
  try {
    const apiRes = await api("/api/attendance", "get", {
      search,
      date,
      startDate,
      endDate,
      department,
      status,
      shiftId
    }).catch(async () => {
      return await api("/api/attendances", "get");
    });

    const rawList = apiRes?.data || (Array.isArray(apiRes) ? apiRes : null);
    if (rawList && Array.isArray(rawList) && rawList.length > 0) {
      liveApiRecords = rawList.map((r, i) => ({
        id: String(r.id || `ATT-${i + 1}`),
        employeeId: String(r.employee_id || r.user_id || r.userId || r.employeeId || `EMP-${i + 1}`),
        employeeName: r.employee_name || r.user?.name || r.name || "Staff Member",
        khmerName: r.khmer_name || r.user?.khmer_name || "",
        department: r.department || r.user?.department || "Store Operations",
        role: r.role || r.user?.role || "Staff",
        avatar: r.avatar || r.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.employee_name || "Staff")}&background=0284c7&color=fff`,
        date: r.date || new Date().toISOString().split("T")[0],
        shiftId: r.shift_id || r.shiftId || "shift_morning",
        shiftName: r.shift_name || r.shiftName || "Morning Shift",
        checkInTime: r.check_in_time || r.checkInTime || r.check_in || "--:--:--",
        checkInStatus: r.check_in_status || r.checkInStatus || "On Time",
        lateMinutes: Number(r.late_minutes || r.lateMinutes || 0),
        checkInMethod: r.check_in_method || r.checkInMethod || "Web App",
        checkInLocation: r.check_in_location || {
          latitude: Number(r.latitude || 11.5564),
          longitude: Number(r.longitude || 104.9282),
          address: r.location_address || "Angkor Mall Center",
          isWithinGeofence: r.is_within_geofence !== false,
          distanceMeters: Number(r.distance_meters || 0)
        },
        checkOutTime: r.check_out_time || r.checkOutTime || r.check_out || null,
        checkOutStatus: r.check_out_status || r.checkOutStatus || (r.check_out_time ? "Completed" : "On Shift"),
        earlyMinutes: Number(r.early_minutes || r.earlyMinutes || 0),
        checkOutMethod: r.check_out_method || r.checkOutMethod || null,
        checkOutLocation: r.check_out_location || null,
        breakStatus: r.break_status || r.breakStatus || "None",
        totalBreakMinutes: Number(r.total_break_minutes || r.totalBreakMinutes || 0),
        totalWorkHours: Number(r.total_work_hours || r.totalWorkHours || 0),
        overtimeHours: Number(r.overtime_hours || r.overtimeHours || 0),
        status: r.status || "Present",
        notes: r.notes || ""
      }));
    }
  } catch (err) {}

  const allRecords = liveApiRecords || getStoredRecords();

  let filtered = allRecords.filter((rec) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        rec.employeeName.toLowerCase().includes(q) ||
        (rec.khmerName && rec.khmerName.toLowerCase().includes(q)) ||
        rec.employeeId.toLowerCase().includes(q) ||
        rec.role.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (date && rec.date !== date) return false;
    if (startDate && rec.date < startDate) return false;
    if (endDate && rec.date > endDate) return false;

    if (department !== "all" && rec.department.toLowerCase() !== department.toLowerCase()) {
      return false;
    }

    if (status !== "all") {
      if (status === "present" && !["Present", "On Shift"].includes(rec.status) && rec.status !== "Late")
        return false;
      if (status === "late" && rec.checkInStatus !== "Late") return false;
      if (status === "break" && rec.breakStatus !== "On Break") return false;
      if (status === "checked_out" && rec.status !== "Checked Out") return false;
      if (status === "absent" && rec.status !== "Absent") return false;
      if (status === "leave" && rec.status !== "On Leave") return false;
    }

    if (shiftId !== "all" && rec.shiftId !== shiftId) return false;

    return true;
  });

  // Sort order: Present / On Duty first, then newest records
  filtered.sort((a, b) => {
    const aIsActive =
      (a.status === "Present" || a.status === "On Shift" || a.breakStatus === "On Break" || a.checkInStatus === "Late") &&
      !a.checkOutTime;
    const bIsActive =
      (b.status === "Present" || b.status === "On Shift" || b.breakStatus === "On Break" || b.checkInStatus === "Late") &&
      !b.checkOutTime;

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    if ((b.date || "") !== (a.date || "")) {
      return (b.date || "").localeCompare(a.date || "");
    }
    return (b.checkInTime || "").localeCompare(a.checkInTime || "");
  });

  return { success: true, data: filtered, count: filtered.length };
};

const STORAGE_KEY_LEAVE_REQUESTS = "angkor_mall_leave_requests";

export const DEFAULT_LEAVE_REQUESTS = [
  {
    id: "LV-2026-001",
    employeeId: "EMP-102",
    employeeName: "Vireak Bun",
    khmerName: "ប៊ុន វិរៈ",
    department: "Cashier",
    role: "Lead Cashier",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    leaveType: "Sick Leave",
    leaveTypeKh: "ច្បាប់ឈឺ (Sick Leave)",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    durationDays: 1,
    reason: "Doctor appointment and severe fever",
    status: "Approved",
    requestDate: new Date().toISOString().split("T")[0],
    reviewedBy: "Sokha Chan (Admin)",
    reviewNotes: "Approved. Medical certificate submitted."
  },
  {
    id: "LV-2026-002",
    employeeId: "EMP-104",
    employeeName: "Bopha Khem",
    khmerName: "ខែម បុប្ផា",
    department: "Sales",
    role: "Sales Associate",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    leaveType: "Annual Leave",
    leaveTypeKh: "ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)",
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    endDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    durationDays: 2,
    reason: "Family trip and personal errands",
    status: "Pending",
    requestDate: new Date().toISOString().split("T")[0],
    reviewedBy: null,
    reviewNotes: ""
  }
];

export const getStoredLeaveRequests = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEAVE_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(DEFAULT_LEAVE_REQUESTS));
      return DEFAULT_LEAVE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_LEAVE_REQUESTS;
  }
};

export const saveStoredLeaveRequests = (requests) => {
  try {
    localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(requests));
  } catch (e) {}
};

export const getLeaveRequestsApi = async () => {
  try {
    const apiRes = await api("/api/attendance/leave-requests", "get").catch(async () => {
      return await api("/api/leave-requests", "get");
    });
    const rawList = apiRes?.data || (Array.isArray(apiRes) ? apiRes : null);
    if (rawList && Array.isArray(rawList) && rawList.length > 0) {
      const formatted = rawList.map((l, i) => ({
        id: String(l.id || `LV-${i + 1}`),
        employeeId: String(l.employee_id || l.user_id || l.employeeId || ""),
        employeeName: l.employee_name || l.user?.name || l.name || "Staff Member",
        khmerName: l.khmer_name || l.user?.khmer_name || "",
        department: l.department || l.user?.department || "Store Operations",
        role: l.role || l.user?.role || "Staff Member",
        avatar: l.avatar || l.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.employee_name || "Staff")}&background=0284c7&color=fff`,
        leaveType: l.leave_type || l.leaveType || "Annual Leave",
        leaveTypeKh: l.leave_type_kh || l.leaveTypeKh || l.leave_type || "ច្បាប់ឈប់សម្រាក",
        startDate: l.start_date || l.startDate,
        endDate: l.end_date || l.endDate || l.start_date || l.startDate,
        durationDays: Number(l.duration_days || l.durationDays || 1),
        reason: l.reason || "",
        status: l.status || "Pending",
        requestDate: l.request_date || l.requestDate || new Date().toISOString().split("T")[0],
        contactNumber: l.contact_number || l.phone_number || l.contactNumber || "",
        reviewedBy: l.reviewed_by || l.reviewedBy || null,
        reviewNotes: l.review_notes || l.reviewNotes || ""
      }));
      localStorage.setItem(STORAGE_KEY_LEAVE_REQUESTS, JSON.stringify(formatted));
      return { success: true, data: formatted };
    }
  } catch (e) {}
  return { success: true, data: getStoredLeaveRequests() };
};

export const submitLeaveRequestApi = async (leaveData) => {
  const staffList = getStoredStaff();
  const staff = staffList.find((s) => String(s.id) === String(leaveData.employeeId));

  const start = new Date(leaveData.startDate || new Date());
  const end = new Date(leaveData.endDate || leaveData.startDate || new Date());
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newLeave = {
    id: "LV-" + Date.now().toString().slice(-6),
    employeeId: staff ? staff.id : leaveData.employeeId,
    employeeName: staff ? staff.name : leaveData.employeeName || "Staff Member",
    khmerName: staff ? staff.khmerName : "",
    department: staff ? staff.department : "Store Operations",
    role: staff ? staff.role : "Staff Member",
    avatar: staff ? staff.avatar : `https://ui-avatars.com/api/?name=Staff&background=0284c7&color=fff`,
    leaveType: leaveData.leaveType || "Annual Leave",
    leaveTypeKh: leaveData.leaveTypeKh || leaveData.leaveType || "ច្បាប់ឈប់សម្រាក",
    startDate: leaveData.startDate,
    endDate: leaveData.endDate || leaveData.startDate,
    durationDays: diffDays || 1,
    reason: leaveData.reason || "Personal Leave Permission",
    status: "Pending",
    requestDate: new Date().toISOString().split("T")[0],
    contactNumber: leaveData.contactNumber || staff?.phone || "",
    reviewedBy: null,
    reviewNotes: ""
  };

  const current = getStoredLeaveRequests();
  const updated = [newLeave, ...current];
  saveStoredLeaveRequests(updated);

  // Live API call
  try {
    const apiPayload = {
      user_id: newLeave.employeeId,
      employee_id: newLeave.employeeId,
      employee_name: newLeave.employeeName,
      leave_type: newLeave.leaveType,
      start_date: newLeave.startDate,
      end_date: newLeave.endDate,
      duration_days: newLeave.durationDays,
      reason: newLeave.reason,
      contact_number: newLeave.contactNumber,
      status: "Pending"
    };
    await api("/api/attendance/leave-requests", "post", apiPayload).catch(async () => {
      await api("/api/leave-requests", "post", apiPayload);
    });
  } catch (err) {
    console.warn("Backend leave request synced locally:", err.message);
  }

  return { success: true, data: newLeave };
};

export const updateLeaveRequestStatusApi = async (id, status, reviewNotes = "", reviewerName = "Admin") => {
  const current = getStoredLeaveRequests();
  const idx = current.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error("Leave request not found");

  const updatedReq = {
    ...current[idx],
    status,
    reviewedBy: reviewerName,
    reviewNotes,
    reviewDate: new Date().toISOString().split("T")[0]
  };

  current[idx] = updatedReq;
  saveStoredLeaveRequests(current);

  // If approved and leave covers today, ensure attendance record reflects On Leave
  if (status === "Approved") {
    const todayStr = new Date().toISOString().split("T")[0];
    if (updatedReq.startDate <= todayStr && updatedReq.endDate >= todayStr) {
      const records = getStoredRecords();
      const existingIdx = records.findIndex(
        (r) => String(r.employeeId) === String(updatedReq.employeeId) && r.date === todayStr
      );

      if (existingIdx !== -1) {
        records[existingIdx] = {
          ...records[existingIdx],
          status: "On Leave",
          checkInStatus: "On Leave",
          notes: `Approved Leave: ${updatedReq.leaveType} (${updatedReq.reason})`
        };
      } else {
        const staffList = getStoredStaff();
        const staff = staffList.find((s) => String(s.id) === String(updatedReq.employeeId));
        const geofence = getStoredGeofenceConfig();
        const leaveAttRecord = {
          id: "ATT-LV-" + Date.now().toString().slice(-6),
          employeeId: updatedReq.employeeId,
          employeeName: updatedReq.employeeName,
          khmerName: updatedReq.khmerName,
          department: updatedReq.department,
          role: updatedReq.role,
          avatar: updatedReq.avatar,
          date: todayStr,
          shiftId: "shift_morning",
          shiftName: "Scheduled (On Leave)",
          checkInTime: "--:--:--",
          checkInStatus: "On Leave",
          lateMinutes: 0,
          checkInMethod: "Leave Permission",
          checkInLocation: {
            latitude: geofence.latitude,
            longitude: geofence.longitude,
            address: "Approved Leave Permission",
            isWithinGeofence: true,
            distanceMeters: 0,
            source: "Leave Request Approval"
          },
          checkOutTime: null,
          checkOutStatus: "On Leave",
          earlyMinutes: 0,
          checkOutMethod: null,
          checkOutLocation: null,
          breakStatus: "None",
          totalBreakMinutes: 0,
          totalWorkHours: 0,
          overtimeHours: 0,
          status: "On Leave",
          notes: `Official Leave: ${updatedReq.leaveType} - ${updatedReq.reason}`
        };
        records.unshift(leaveAttRecord);
      }
      saveStoredRecords(records);
    }
  }

  // Live API call
  try {
    const apiPayload = {
      status,
      reviewed_by: reviewerName,
      review_notes: reviewNotes,
      review_date: updatedReq.reviewDate
    };
    await api(`/api/attendance/leave-requests/${id}`, "put", apiPayload).catch(async () => {
      await api(`/api/leave-requests/${id}`, "put", apiPayload);
    });
  } catch (e) {
    console.warn("Backend leave update status synced locally:", e.message);
  }

  return { success: true, data: updatedReq };
};

export const deleteLeaveRequestApi = async (id) => {
  const current = getStoredLeaveRequests();
  const filtered = current.filter((l) => l.id !== id);
  saveStoredLeaveRequests(filtered);

  try {
    await api(`/api/attendance/leave-requests/${id}`, "delete").catch(async () => {
      await api(`/api/leave-requests/${id}`, "delete");
    });
  } catch (e) {}

  return { success: true };
};

export const getAttendanceKPIsApi = async (selectedDate = null) => {
  const targetDate = selectedDate || new Date().toISOString().split("T")[0];

  // Attempt live API KPI call first
  try {
    const apiRes = await api(`/api/attendance/kpi?date=${targetDate}`, "get");
    if (apiRes && apiRes.data && apiRes.data.totalStaff !== undefined) {
      return apiRes.data;
    }
  } catch (err) {}

  const records = getStoredRecords().filter((r) => r.date === targetDate);
  const staffList = getStoredStaff();
  const totalStaffCount = staffList.length > 0 ? staffList.length : records.length;
  const leaveRequests = getStoredLeaveRequests();

  const onLeaveToday = leaveRequests.filter(
    (l) => l.status === "Approved" && l.startDate <= targetDate && l.endDate >= targetDate
  ).length;

  const presentCount = records.filter((r) =>
    ["Present", "On Shift", "On Break", "Checked Out", "Late"].includes(r.status)
  ).length;
  const onTimeCount = records.filter((r) => r.checkInStatus === "On Time").length;
  const lateCount = records.filter((r) => r.checkInStatus === "Late").length;
  const onBreakCount = records.filter((r) => r.breakStatus === "On Break").length;
  const checkedOutCount = records.filter((r) => r.status === "Checked Out" || r.checkOutTime).length;
  const absentCount = Math.max(0, totalStaffCount - presentCount - onLeaveToday);

  const totalHoursWorked = records.reduce((acc, r) => acc + (Number(r.totalWorkHours) || 0), 0);
  const totalOvertimeHours = records.reduce((acc, r) => acc + (Number(r.overtimeHours) || 0), 0);

  const attendanceRate = totalStaffCount > 0 ? Math.round(((presentCount + onLeaveToday) / totalStaffCount) * 100) : 0;

  return {
    totalStaff: totalStaffCount,
    presentCount,
    onTimeCount,
    lateCount,
    onBreakCount,
    checkedOutCount,
    onLeaveCount: onLeaveToday,
    absentCount,
    attendanceRate,
    totalHoursWorked: Number(totalHoursWorked.toFixed(1)),
    totalOvertimeHours: Number(totalOvertimeHours.toFixed(1))
  };
};

export const addManualAttendanceRecordApi = async (recordData) => {
  const staffList = getStoredStaff();
  const staff = staffList.find((s) => String(s.id) === String(recordData.employeeId));
  const shifts = getStoredShifts();
  const shift = shifts.find((sh) => sh.id === recordData.shiftId) || shifts[0];
  const geofence = getStoredGeofenceConfig();

  const { status: checkInStatus, lateMinutes } = calculateLateStatus(
    recordData.checkInTime || "08:00:00",
    shift
  );

  let totalWorkHours = 0;
  let overtimeHours = 0;
  let earlyMinutes = 0;
  let checkOutStatus = recordData.checkOutTime ? "Completed" : "On Shift";

  if (recordData.checkInTime && recordData.checkOutTime) {
    const calc = calculateWorkedHours(
      recordData.checkInTime,
      recordData.checkOutTime,
      Number(recordData.totalBreakMinutes) || 0,
      shift
    );
    totalWorkHours = calc.totalHours;
    overtimeHours = calc.overtimeHours;
    earlyMinutes = calc.earlyMinutes;
    checkOutStatus = calc.status;
  }

  const defaultLocation = {
    latitude: geofence.latitude,
    longitude: geofence.longitude,
    accuracy: 10,
    address: `${geofence.name} (Admin Portal Punch)`,
    isWithinGeofence: true,
    distanceMeters: 0,
    source: "Admin Manual"
  };

  const newRecord = {
    id: "ATT-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    employeeId: staff ? staff.id : recordData.employeeId,
    employeeName: staff ? staff.name : recordData.employeeName || "Staff Member",
    khmerName: staff ? staff.khmerName : "",
    department: staff ? staff.department : recordData.department || "General",
    role: staff ? staff.role : recordData.role || "Staff",
    avatar: staff ? staff.avatar : `https://ui-avatars.com/api/?name=Staff&background=0284c7&color=fff`,
    date: recordData.date,
    shiftId: shift.id,
    shiftName: shift.name,
    checkInTime: recordData.checkInTime,
    checkInStatus,
    lateMinutes,
    checkInMethod: "Admin Manual",
    checkInLocation: defaultLocation,
    checkOutTime: recordData.checkOutTime || null,
    checkOutStatus,
    earlyMinutes,
    checkOutMethod: recordData.checkOutTime ? "Admin Manual" : null,
    checkOutLocation: recordData.checkOutTime ? defaultLocation : null,
    breakStatus: Number(recordData.totalBreakMinutes) > 0 ? "Finished Break" : "None",
    breakStart: null,
    breakEnd: null,
    totalBreakMinutes: Number(recordData.totalBreakMinutes) || 0,
    totalWorkHours,
    overtimeHours,
    status: recordData.checkOutTime ? "Checked Out" : checkInStatus === "Late" ? "Late" : "Present",
    notes: recordData.notes || "Manually added by Admin."
  };

  const records = getStoredRecords();
  records.unshift(newRecord);
  saveStoredRecords(records);

  // Live API Sync
  try {
    await api("/api/attendance/manual", "post", newRecord).catch(async () => {
      await api("/api/attendance", "post", newRecord);
    });
  } catch (e) {
    console.warn("Manual record synced locally:", e.message);
  }

  return { success: true, record: newRecord };
};

export const updateAttendanceRecordApi = async (id, updatedFields) => {
  const records = getStoredRecords();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error("Attendance record not found");
  }

  const current = records[idx];
  const shifts = getStoredShifts();
  const shift = shifts.find((sh) => sh.id === (updatedFields.shiftId || current.shiftId)) || shifts[0];

  const inTime = updatedFields.checkInTime !== undefined ? updatedFields.checkInTime : current.checkInTime;
  const outTime = updatedFields.checkOutTime !== undefined ? updatedFields.checkOutTime : current.checkOutTime;
  const breakMin =
    updatedFields.totalBreakMinutes !== undefined
      ? Number(updatedFields.totalBreakMinutes)
      : current.totalBreakMinutes;

  const { status: checkInStatus, lateMinutes } = calculateLateStatus(inTime, shift);

  let totalWorkHours = current.totalWorkHours;
  let overtimeHours = current.overtimeHours;
  let earlyMinutes = current.earlyMinutes;
  let checkOutStatus = current.checkOutStatus;

  if (inTime && outTime) {
    const calc = calculateWorkedHours(inTime, outTime, breakMin, shift);
    totalWorkHours = calc.totalHours;
    overtimeHours = calc.overtimeHours;
    earlyMinutes = calc.earlyMinutes;
    checkOutStatus = calc.status;
  }

  const merged = {
    ...current,
    ...updatedFields,
    checkInTime: inTime,
    checkOutTime: outTime,
    totalBreakMinutes: breakMin,
    checkInStatus,
    lateMinutes,
    totalWorkHours,
    overtimeHours,
    earlyMinutes,
    checkOutStatus,
    status: outTime ? "Checked Out" : checkInStatus === "Late" ? "Late" : "Present"
  };

  records[idx] = merged;
  saveStoredRecords(records);

  // Live API Sync
  try {
    await api(`/api/attendance/${id}`, "put", merged);
  } catch (e) {
    console.warn("Attendance record updated locally:", e.message);
  }

  return { success: true, record: merged };
};

export const deleteAttendanceRecordApi = async (id) => {
  const records = getStoredRecords();
  const filtered = records.filter((r) => r.id !== id);
  saveStoredRecords(filtered);

  // Live API Sync
  try {
    await api(`/api/attendance/${id}`, "delete");
  } catch (e) {}

  return { success: true };
};

export const verifyStaffPin = (pin) => {
  const staff = getStoredStaff();
  const cleanedPin = String(pin || "").trim();
  if (!cleanedPin) return null;

  const matched = staff.find((s) => {
    if (String(s.pin || "").trim() === cleanedPin) return true;
    if (String(s.id || "").trim() === cleanedPin) return true;
    if (s.phone && String(s.phone).replace(/\D/g, "").slice(-4) === cleanedPin) return true;
    return false;
  });

  return matched || null;
};

export const exportAttendanceToCSV = (records, filename = "Angkor_Mall_Attendance_Report.csv") => {
  if (!records || !records.length) return;

  const headers = [
    "ID",
    "Employee ID",
    "Employee Name",
    "Department",
    "Role",
    "Date",
    "Shift",
    "Check-In Time",
    "Check-In Status",
    "Late (Mins)",
    "GPS Distance (m)",
    "Geofence Status",
    "Check-In Coordinates",
    "Check-Out Time",
    "Check-Out Status",
    "Break (Mins)",
    "Total Worked Hours",
    "Overtime Hours",
    "Method",
    "Status",
    "Notes"
  ];

  const rows = records.map((r) => {
    const inLoc = r.checkInLocation;
    const distanceStr = inLoc ? `${inLoc.distanceMeters || 0}m` : "-";
    const geofenceStr = inLoc ? (inLoc.isWithinGeofence ? "Inside Mall" : "Outside Geofence") : "-";
    const coordsStr = inLoc && inLoc.latitude ? `${inLoc.latitude},${inLoc.longitude}` : "-";

    return [
      r.id,
      r.employeeId,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.role}"`,
      r.date,
      `"${r.shiftName}"`,
      r.checkInTime || "-",
      r.checkInStatus || "-",
      r.lateMinutes || 0,
      distanceStr,
      geofenceStr,
      `"${coordsStr}"`,
      r.checkOutTime || "-",
      r.checkOutStatus || "-",
      r.totalBreakMinutes || 0,
      r.totalWorkHours || 0,
      r.overtimeHours || 0,
      `"${r.checkInMethod || "-"}"`,
      r.status,
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
