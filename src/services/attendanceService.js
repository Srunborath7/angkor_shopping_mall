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
export const getStaffListApi = async () => {
  try {
    let res = null;

    // 1. Try StaffApi (/api/users/staff)
    try {
      res = await StaffApi();
    } catch (e) {
      // 2. Fallback to /api/users
      try {
        res = await api("/api/users", "get");
      } catch (err) {}
    }

    let rawList = res?.data || (Array.isArray(res) ? res : []);

    // 3. If rawList is empty, attempt /api/users directly
    if (!rawList || rawList.length === 0) {
      try {
        const usersRes = await api("/api/users", "get");
        rawList = usersRes?.data || (Array.isArray(usersRes) ? usersRes : []);
      } catch (e) {}
    }

    if (Array.isArray(rawList) && rawList.length > 0) {
      // Strictly filter users where user_role != 'customer'
      const nonCustomerStaff = rawList.filter((u) => {
        const userRoleVal = String(u.user_role || "").trim().toLowerCase();
        const roleVal = String(
          u.role_name ||
          u.role?.name ||
          (Array.isArray(u.roles) ? u.roles.map((r) => r.name || r).join(" ") : "") ||
          (typeof u.role === "string" ? u.role : "") ||
          ""
        ).trim().toLowerCase();
        const userTypeVal = String(u.user_type || u.type || "").trim().toLowerCase();

        // Exclude if role is customer
        if (userRoleVal === "customer" || userRoleVal === "customers") return false;
        if (roleVal === "customer" || roleVal === "customers") return false;
        if (userTypeVal === "customer" || userTypeVal === "customers") return false;

        return true;
      });

      const formattedStaff = nonCustomerStaff.map((u, idx) => {
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

        // Generate 4-digit PIN based on ID or index
        const pinCode = String(u.pin || (1000 + Number(u.id || idx + 1)).toString().slice(-4));

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

      // Save live API staff to local cache
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(formattedStaff));
      return formattedStaff;
    }
  } catch (err) {
    console.warn("Could not fetch live staff from API, reading cache:", err);
  }

  // Read cached staff if available
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
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

  try {
    await api("/api/attendance/check-in", "post", newRecord);
  } catch (err) {}

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

  try {
    await api(`/api/attendance/check-out/${updatedRecord.id}`, "put", updatedRecord);
  } catch (e) {}

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
  try {
    const apiRes = await api("/api/attendance", "get", {
      search,
      date,
      startDate,
      endDate,
      department,
      status,
      shiftId
    });
    if (apiRes && apiRes.data && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      return { success: true, data: apiRes.data, count: apiRes.data.length };
    }
  } catch (err) {}

  const allRecords = getStoredRecords();

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

  return { success: true, data: filtered, count: filtered.length };
};

export const getAttendanceKPIsApi = async (selectedDate = null) => {
  const targetDate = selectedDate || new Date().toISOString().split("T")[0];
  const records = getStoredRecords().filter((r) => r.date === targetDate);
  const staffList = getStoredStaff();
  const totalStaffCount = staffList.length > 0 ? staffList.length : records.length;

  const presentCount = records.filter((r) =>
    ["Present", "On Shift", "On Break", "Checked Out", "Late"].includes(r.status)
  ).length;
  const onTimeCount = records.filter((r) => r.checkInStatus === "On Time").length;
  const lateCount = records.filter((r) => r.checkInStatus === "Late").length;
  const onBreakCount = records.filter((r) => r.breakStatus === "On Break").length;
  const checkedOutCount = records.filter((r) => r.status === "Checked Out" || r.checkOutTime).length;
  const absentCount = Math.max(0, totalStaffCount - presentCount);

  const totalHoursWorked = records.reduce((acc, r) => acc + (Number(r.totalWorkHours) || 0), 0);
  const totalOvertimeHours = records.reduce((acc, r) => acc + (Number(r.overtimeHours) || 0), 0);

  const attendanceRate = totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0;

  return {
    totalStaff: totalStaffCount,
    presentCount,
    onTimeCount,
    lateCount,
    onBreakCount,
    checkedOutCount,
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
  return { success: true, record: merged };
};

export const deleteAttendanceRecordApi = async (id) => {
  const records = getStoredRecords();
  const filtered = records.filter((r) => r.id !== id);
  saveStoredRecords(filtered);
  return { success: true };
};

export const verifyStaffPin = (pin) => {
  const staff = getStoredStaff();
  const matched = staff.find((s) => String(s.pin) === String(pin) || String(s.id) === String(pin));
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
