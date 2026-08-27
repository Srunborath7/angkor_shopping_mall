import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaCoffee,
  FaSignOutAlt,
  FaSignInAlt,
  FaQrcode,
  FaFileDownload,
  FaPrint,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaSlidersH,
  FaCalendarDay,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaBusinessTime,
  FaStopwatch,
  FaTimes,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaExternalLinkAlt,
  FaCog,
  FaThList,
  FaThLarge,
  FaInfoCircle,
  FaQuestionCircle,
  FaUserTie,
  FaShieldAlt,
  FaMobileAlt,
  FaUmbrellaBeach,
  FaCalendarCheck,
  FaClipboardList,
  FaCheck,
  FaBan,
  FaFileAlt,
  FaHistory
} from "react-icons/fa";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import Modal from "../../components/Modal";
import { TableSkeleton, KpiCardSkeleton } from "../../components/loading/LoadingSkeleton";
import { useTranslation } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import {
  getStaffListApi,
  getStoredStaff,
  getStoredShifts,
  getStoredGeofenceConfig,
  saveStoredGeofenceConfig,
  getCurrentDeviceLocation,
  getAttendanceRecordsApi,
  getAttendanceKPIsApi,
  checkInStaffApi,
  checkOutStaffApi,
  toggleBreakApi,
  addManualAttendanceRecordApi,
  updateAttendanceRecordApi,
  deleteAttendanceRecordApi,
  getLeaveRequestsApi,
  submitLeaveRequestApi,
  updateLeaveRequestStatusApi,
  deleteLeaveRequestApi,
  exportAttendanceToCSV
} from "../../services/attendanceService";
import "./style/AttendancePage.css";

function AttendancePage() {
  const { isKhmer } = useTranslation();
  const { isDark } = useTheme();
  const authState = useSelector((state) => state.auth);
  const currentUser = authState?.user;
  const userRole = (
    authState?.role ||
    currentUser?.role ||
    currentUser?.role_name ||
    currentUser?.roles?.[0]?.name ||
    ""
  ).toLowerCase();

  // Role authorization: ONLY accounts with role name "manager" can select other staff members (Manager Mode)
  const isManager = useMemo(() => {
    if (!currentUser) return false;

    // Check roles array e.g. [{ id: "...", name: "manager" }]
    const rolesList = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r) =>
          String(typeof r === "object" ? r?.name || "" : r)
            .toLowerCase()
            .trim()
        )
      : [];

    const roleName = String(
      currentUser?.role_name ||
      currentUser?.role?.name ||
      (typeof currentUser?.role === "string" ? currentUser.role : "") ||
      authState?.role ||
      ""
    )
      .toLowerCase()
      .trim();

    const userRoleField = String(currentUser?.user_role || "").toLowerCase().trim();

    const allRoles = [...rolesList, roleName, userRoleField].filter(Boolean);

    // Strictly check if the user has "manager" role name
    return allRoles.some((r) => r === "manager" || r.includes("manager"));
  }, [currentUser, authState?.role]);

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time GPS Location state for Kiosk Terminal
  const [deviceGps, setDeviceGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Responsive display mode: Window / Laptop shows List (Table), Mobile shows Kanban only
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  // Data states
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [records, setRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [geofenceConfig, setGeofenceConfig] = useState(getStoredGeofenceConfig());

  const [kpiMetrics, setKpiMetrics] = useState({
    totalStaff: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    onBreakCount: 0,
    checkedOutCount: 0,
    onLeaveCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    totalHoursWorked: 0,
    totalOvertimeHours: 0
  });

  // Kiosk Terminal Selected Staff (Auto-selects current logged-in user if available)
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("shift_morning");
  const [terminalNotes, setTerminalNotes] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState("today"); // today, yesterday, this_month, custom
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatusTab, setSelectedStatusTab] = useState("present");

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaveManagerOpen, setIsLeaveManagerOpen] = useState(false);
  const [leaveFilterTab, setLeaveFilterTab] = useState("all"); // all, pending, approved, rejected
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Manual Punch Form
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    shiftId: "shift_morning",
    date: new Date().toISOString().split("T")[0],
    checkInTime: "08:00:00",
    checkOutTime: "",
    totalBreakMinutes: 0,
    notes: ""
  });

  // Leave Request Form (Ask Permission)
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveType: "Sick Leave",
    leaveTypeKh: "ច្បាប់ឈឺ",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
    contactNumber: ""
  });

  // Geofence Edit Form
  const [geofenceForm, setGeofenceForm] = useState({ ...geofenceConfig });

  // Responsive listener: List on Window/Laptop (>768px), Kanban on Mobile (<=768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Device GPS Location
  const fetchCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      const loc = await getCurrentDeviceLocation();
      setDeviceGps(loc);
    } catch (e) {
      console.warn(e);
    } finally {
      setGpsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Initial Load
  const loadData = async () => {
    try {
      setLoading(true);
      const staff = await getStaffListApi(currentUser);
      const shiftData = getStoredShifts();
      const geo = getStoredGeofenceConfig();
      setStaffList(staff);
      setShifts(shiftData);
      setGeofenceConfig(geo);

      // Auto-Select Current Logged-in User if not selected
      if (staff && staff.length > 0) {
        setSelectedStaffId((prev) => {
          if (prev && staff.some((s) => s.id === prev)) return prev;

          // Try matching logged in currentUser
          if (currentUser) {
            const curId = String(currentUser.id || currentUser.user_id || "");
            const curEmail = currentUser.email || "";
            const curName = currentUser.name || `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username;

            const matchedCur = staff.find(
              (s) =>
                (curId && String(s.id) === curId) ||
                (curEmail && s.email === curEmail) ||
                (curName && s.name.toLowerCase() === curName.toLowerCase())
            );
            if (matchedCur) return matchedCur.id;
          }

          return staff[0].id;
        });
      }

      let queryDate = "";
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (dateFilterMode === "today") queryDate = todayStr;
      else if (dateFilterMode === "yesterday") queryDate = yesterdayStr;
      else if (dateFilterMode === "custom") queryDate = customDate;

      const [res, kpis, leaveRes] = await Promise.all([
        getAttendanceRecordsApi({
          search: searchQuery,
          date: queryDate,
          department: selectedDepartment,
          status: selectedStatusTab
        }),
        getAttendanceKPIsApi(queryDate || todayStr),
        getLeaveRequestsApi()
      ]);

      setRecords(res.data || []);
      setKpiMetrics(kpis);
      setLeaveRequests(leaveRes.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: isKhmer ? "មានបញ្ហា" : "Error",
        text: err.message || "Failed to load attendance logs",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilterMode, customDate, selectedDepartment, selectedStatusTab, searchQuery]);

  const activeLoggedInStaff = useMemo(() => {
    if (!currentUser || !staffList.length) return null;
    const curId = String(currentUser.id || currentUser.user_id || "");
    const curEmail = currentUser.email || "";
    const curName = (
      currentUser.name ||
      `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
      currentUser.username ||
      ""
    ).toLowerCase();

    return (
      staffList.find(
        (s) =>
          (curId && String(s.id) === curId) ||
          (curEmail && s.email === curEmail) ||
          (curName && s.name.toLowerCase() === curName)
      ) || null
    );
  }, [currentUser, staffList]);

  // Staff list available in select dropdowns:
  // - Managers see ALL staff members to select anyone
  // - Non-managers (without manager role) see ONLY their own logged-in user account
  const selectableStaffList = useMemo(() => {
    if (isManager) {
      return staffList;
    }
    if (activeLoggedInStaff) {
      return [activeLoggedInStaff];
    }
    if (currentUser) {
      const curId = String(currentUser.id || currentUser.user_id || "");
      const curEmail = currentUser.email || "";
      const curName = (
        currentUser.name ||
        `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
        currentUser.username ||
        ""
      ).toLowerCase();

      const matched = staffList.filter(
        (s) =>
          (curId && String(s.id) === curId) ||
          (curEmail && s.email === curEmail) ||
          (curName && s.name.toLowerCase() === curName)
      );
      if (matched.length > 0) return matched;

      return [
        {
          id: curId || "CURRENT_USER",
          name: currentUser.name || "You",
          khmerName: currentUser.khmer_name || "",
          email: curEmail,
          role: currentUser.roles?.[0]?.name || currentUser.role || "Staff",
          department: currentUser.department || "Operations",
          avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "You")}&background=0284c7&color=fff&bold=true`
        }
      ];
    }
    return [];
  }, [isManager, staffList, activeLoggedInStaff, currentUser]);

  // Auto-sync selectedStaffId to logged-in user when user is not a manager
  useEffect(() => {
    if (!isManager && activeLoggedInStaff?.id) {
      setSelectedStaffId(activeLoggedInStaff.id);
    }
  }, [isManager, activeLoggedInStaff]);

  const activeSelectedStaff = useMemo(() => {
    if (!isManager && activeLoggedInStaff) {
      return activeLoggedInStaff;
    }
    return staffList.find((s) => s.id === selectedStaffId) || activeLoggedInStaff || staffList[0] || null;
  }, [staffList, selectedStaffId, isManager, activeLoggedInStaff]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const activeStaffRecordToday = useMemo(() => {
    if (!selectedStaffId) return null;
    return records.find((r) => r.employeeId === selectedStaffId && r.date === todayStr);
  }, [records, selectedStaffId, todayStr]);

  const pendingLeavesCount = useMemo(() => {
    return leaveRequests.filter((l) => l.status === "Pending").length;
  }, [leaveRequests]);

  // Order records: Present & On Duty first, then other records
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
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
  }, [records]);

  // Kanban Columns Calculation (Present, On Break, Late, On Leave, Checked Out, Not Checked In)
  const kanbanColumns = useMemo(() => {
    const presentList = records.filter(
      (r) => (r.status === "Present" || r.status === "On Shift") && r.breakStatus !== "On Break"
    );
    const onBreakList = records.filter(
      (r) => r.status === "On Break" || r.breakStatus === "On Break"
    );
    const lateList = records.filter((r) => r.checkInStatus === "Late" && !r.checkOutTime && r.status !== "On Leave");
    const onLeaveList = records.filter(
      (r) => r.status === "On Leave" || r.checkInStatus === "On Leave"
    );
    const checkedOutList = records.filter((r) => (r.status === "Checked Out" || !!r.checkOutTime) && r.status !== "On Leave");

    // Unscheduled / Not checked in today from staff list
    const checkedInStaffIds = new Set(records.map((r) => String(r.employeeId)));
    const notCheckedInStaff = staffList.filter((s) => !checkedInStaffIds.has(String(s.id)));

    return [
      {
        id: "present",
        title: isKhmer ? "កំពុងបំពេញការងារ" : "On Duty / Present",
        icon: "🟢",
        badgeClass: "badge-present",
        records: presentList,
        type: "attendance"
      },
      {
        id: "break",
        title: isKhmer ? "កំពុងសម្រាក" : "On Break",
        icon: "☕",
        badgeClass: "badge-break",
        records: onBreakList,
        type: "attendance"
      },
      {
        id: "late",
        title: isKhmer ? "មកយឺតថ្ងៃនេះ" : "Late Arrivals",
        icon: "🟡",
        badgeClass: "badge-late",
        records: lateList,
        type: "attendance"
      },
      {
        id: "leave",
        title: isKhmer ? "សុំច្បាប់ឈប់សម្រាក" : "On Leave",
        icon: "🏖️",
        badgeClass: "badge-leave",
        records: onLeaveList,
        type: "attendance"
      },
      {
        id: "checked_out",
        title: isKhmer ? "បាន Check-Out" : "Checked Out",
        icon: "🔵",
        badgeClass: "badge-checkout",
        records: checkedOutList,
        type: "attendance"
      },
      {
        id: "not_in",
        title: isKhmer ? "មិនទាន់ Check-In" : "Not Checked In",
        icon: "⚪",
        badgeClass: "badge-notin",
        records: notCheckedInStaff,
        type: "staff"
      }
    ];
  }, [records, staffList, isKhmer]);

  // Handle Quick Kiosk Check-In with GPS tracking
  const handleKioskCheckIn = async () => {
    if (!selectedStaffId) {
      Swal.fire("Warning", isKhmer ? "សូមជ្រើសរើសបុគ្គលិកជាមុន" : "Please select an employee first", "warning");
      return;
    }

    // Check strict geofence warning if outside
    if (deviceGps && !deviceGps.isWithinGeofence && geofenceConfig.strictGeofenceEnforcement) {
      const confirmOutside = await Swal.fire({
        title: isKhmer ? "ការព្រមាន Geofence!" : "Geofence Warning!",
        html: `You are currently <b>${(deviceGps.distanceMeters / 1000).toFixed(2)} km</b> away from the mall.<br/>Do you want to log remote check-in?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Log Remote Check-in"
      });
      if (!confirmOutside.isConfirmed) return;
    }

    try {
      const res = await checkInStaffApi({
        employeeId: selectedStaffId,
        shiftId: selectedShiftId,
        method: "GPS Mobile / Web",
        location: deviceGps,
        notes: terminalNotes
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      const distTxt = deviceGps ? ` • GPS: ${deviceGps.distanceMeters}m from center` : "";

      Swal.fire({
        title: isKhmer ? "បានចុះវត្តមានចូលជោគជ័យ!" : "Clocked In Successfully!",
        text: `${res.record.employeeName} - ${res.record.checkInTime} (${res.record.checkInStatus})${distTxt}`,
        icon: "success",
        timer: 2500,
        showConfirmButton: false
      });

      setTerminalNotes("");
      loadData();
    } catch (err) {
      Swal.fire({
        title: isKhmer ? "មិនអាចចុះវត្តមានបាន" : "Check-in Failed",
        text: err.message,
        icon: "warning"
      });
    }
  };

  // Handle Quick Kiosk Break Toggle
  const handleKioskBreak = async () => {
    if (!selectedStaffId) return;
    try {
      const res = await toggleBreakApi({
        employeeId: selectedStaffId,
        notes: terminalNotes
      });

      const isBreakStart = res.record.breakStatus === "On Break";

      Swal.fire({
        title: isBreakStart
          ? (isKhmer ? "បានចាប់ផ្តើមម៉ោងសម្រាក!" : "Break Started!")
          : (isKhmer ? "បានបញ្ចប់ម៉ោងសម្រាក!" : "Break Ended!"),
        text: `${res.record.employeeName} (${res.record.breakStatus})`,
        icon: "info",
        timer: 2000,
        showConfirmButton: false
      });

      setTerminalNotes("");
      loadData();
    } catch (err) {
      Swal.fire("Warning", err.message, "warning");
    }
  };

  // Handle Quick Kiosk Check-Out with GPS tracking
  const handleKioskCheckOut = async () => {
    if (!selectedStaffId) return;

    const confirm = await Swal.fire({
      title: isKhmer ? "បញ្ជាក់ការចេញពីការងារ?" : "Confirm Clock Out?",
      text: `${activeSelectedStaff?.name} - ${currentTime.toLocaleTimeString()}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: isKhmer ? "យល់ព្រមចេញ (Clock Out)" : "Yes, Clock Out"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await checkOutStaffApi({
        employeeId: selectedStaffId,
        method: "GPS Mobile / Web",
        location: deviceGps,
        notes: terminalNotes
      });

      Swal.fire({
        title: isKhmer ? "បានចុះចេញពីការងារជោគជ័យ!" : "Clocked Out Successfully!",
        text: `${res.record.employeeName} - Worked: ${res.record.totalWorkHours}h`,
        icon: "success",
        timer: 2500,
        showConfirmButton: false
      });

      setTerminalNotes("");
      loadData();
    } catch (err) {
      Swal.fire("Warning", err.message, "warning");
    }
  };

  // Open Leave Permission Modal for Selected Staff
  const handleOpenLeaveModal = (staffId = null) => {
    let targetId = staffId;
    if (!targetId) {
      if (!isManager && activeLoggedInStaff) {
        targetId = activeLoggedInStaff.id;
      } else {
        targetId = selectedStaffId || (staffList[0]?.id || "");
      }
    }
    if (!isManager && activeLoggedInStaff) {
      targetId = activeLoggedInStaff.id;
    }
    const staff = staffList.find((s) => s.id === targetId) || activeLoggedInStaff || staffList[0];
    setLeaveForm({
      employeeId: staff ? staff.id : "",
      leaveType: "Sick Leave",
      leaveTypeKh: "ច្បាប់ឈឺ (Sick Leave)",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
      contactNumber: staff?.phone || ""
    });
    setIsLeaveModalOpen(true);
  };

  // Submit Leave Permission Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.reason.trim()) {
      Swal.fire("Warning", isKhmer ? "សូមបំពេញព័ត៌មាននិងមូលហេតុនៃការសុំច្បាប់" : "Please select staff and specify reason.", "warning");
      return;
    }

    try {
      await submitLeaveRequestApi(leaveForm);
      confetti({ particleCount: 70, spread: 60 });
      Swal.fire({
        title: isKhmer ? "បានដាក់ពាក្យសុំច្បាប់ជោគជ័យ!" : "Leave Permission Requested!",
        text: isKhmer
          ? "ពាក្យសុំច្បាប់ឈប់សម្រាកត្រូវបានបញ្ជូនទៅកាន់អ្នកគ្រប់គ្រងដើម្បីអនុម័ត"
          : "Leave permission request submitted successfully for manager review.",
        icon: "success"
      });
      setIsLeaveModalOpen(false);
      loadData();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Approve Leave Request
  const handleApproveLeave = async (req) => {
    try {
      await updateLeaveRequestStatusApi(req.id, "Approved", "Approved by Admin", currentUser?.name || "Admin");
      Swal.fire(isKhmer ? "បានអនុម័ត" : "Approved", `${req.employeeName}'s leave request approved.`, "success");
      loadData();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Reject Leave Request
  const handleRejectLeave = async (req) => {
    const { value: reason } = await Swal.fire({
      title: isKhmer ? "បដិសេធពាក្យសុំច្បាប់?" : "Reject Leave Request?",
      input: "text",
      inputLabel: isKhmer ? "មូលហេតុនៃការបដិសេធ" : "Rejection Reason",
      inputPlaceholder: "e.g. Critical store event / shift required...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: isKhmer ? "បដិសេធ" : "Reject"
    });

    if (reason !== undefined) {
      await updateLeaveRequestStatusApi(req.id, "Rejected", reason || "Request declined", currentUser?.name || "Admin");
      Swal.fire(isKhmer ? "បានបដិសេធ" : "Rejected", "Leave request declined.", "info");
      loadData();
    }
  };

  // Delete Leave Request
  const handleDeleteLeave = async (id) => {
    await deleteLeaveRequestApi(id);
    Swal.fire(isKhmer ? "បានលុប" : "Deleted", "Leave request record deleted.", "success");
    loadData();
  };

  // Handle Manual Add Record
  const handleSaveManualRecord = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.checkInTime) {
      Swal.fire("Warning", "Employee and Check-in Time are required.", "warning");
      return;
    }
    try {
      await addManualAttendanceRecordApi(manualForm);
      Swal.fire(isKhmer ? "បានរក្សាទុក" : "Saved", isKhmer ? "បានបន្ថែមវត្តមានដោយជោគជ័យ" : "Attendance record added.", "success");
      setIsManualModalOpen(false);
      setManualForm({
        employeeId: "",
        shiftId: "shift_morning",
        date: new Date().toISOString().split("T")[0],
        checkInTime: "08:00:00",
        checkOutTime: "",
        totalBreakMinutes: 0,
        notes: ""
      });
      loadData();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Handle Save Geofence Config
  const handleSaveGeofence = (e) => {
    e.preventDefault();
    saveStoredGeofenceConfig(geofenceForm);
    setGeofenceConfig(geofenceForm);
    setIsGeofenceModalOpen(false);
    Swal.fire(isKhmer ? "បានរក្សាទុក" : "Saved", "Geofence & Mall GPS Coordinates updated.", "success");
    fetchCurrentLocation();
  };

  // Handle Edit Record
  const handleSaveEditRecord = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await updateAttendanceRecordApi(selectedRecord.id, selectedRecord);
      Swal.fire(isKhmer ? "កែប្រែបានជោគជ័យ" : "Updated", "Record updated successfully.", "success");
      setIsEditModalOpen(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = async (record) => {
    const confirm = await Swal.fire({
      title: isKhmer ? "លុបកំណត់ត្រានេះ?" : "Delete Record?",
      text: `${record.employeeName} (${record.date})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: isKhmer ? "លុបចោល" : "Yes, Delete"
    });

    if (confirm.isConfirmed) {
      await deleteAttendanceRecordApi(record.id);
      Swal.fire(isKhmer ? "បានលុប" : "Deleted", "Record deleted.", "success");
      loadData();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      Swal.fire("Info", "No attendance records to export.", "info");
      return;
    }
    exportAttendanceToCSV(records, `AngkorMall_Attendance_${dateFilterMode}_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const { can } = usePermissions();

  if (!can("attendance", "view")) {
    return <AccessDeniedView moduleName={isKhmer ? "វត្តមានបុគ្គលិក (Staff Attendance)" : "Staff Attendance & Time Clock"} />;
  }

  return (
    <div className="attendance-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1>
            <FaBusinessTime style={{ color: "#0284c7" }} />
            {isKhmer ? "វត្តមានបុគ្គលិក & តាមដានទីតាំង GPS" : "Staff Attendance & GPS Time Clock"}
          </h1>
          <p>
            {isKhmer
              ? "គ្រប់គ្រងការ Check-In, Check-Out ជាមួយប្រព័ន្ធ Geofencing ផ្ទៀងផ្ទាត់ទីតាំងផ្សារទំនើប Angkor Mall"
              : "Live staff check-in, check-out terminal with real-time GPS location tracking & geofencing"}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-action-secondary highlight-leave"
            onClick={() => handleOpenLeaveModal()}
            title="Ask Permission / Leave Request"
          >
            <FaUmbrellaBeach style={{ color: "#0284c7" }} />
            <span>{isKhmer ? "សុំច្បាប់ឈប់សម្រាក" : "Ask Permission (Leave)"}</span>
          </button>

          <button
            className="btn-action-secondary highlight-manager"
            onClick={() => setIsLeaveManagerOpen(true)}
            title="Manage Leave Requests"
          >
            <FaClipboardList style={{ color: "#6366f1" }} />
            <span>{isKhmer ? "គ្រប់គ្រងច្បាប់" : "Leave Requests"}</span>
            {pendingLeavesCount > 0 && (
              <span className="badge-pending-count">{pendingLeavesCount}</span>
            )}
          </button>

          <button
            className="btn-action-secondary"
            onClick={() => {
              setGeofenceForm({ ...geofenceConfig });
              setIsGeofenceModalOpen(true);
            }}
          >
            <FaCog />
            <span>{isKhmer ? "កំណត់ Geofence" : "Geofence Settings"}</span>
          </button>

          <button
            className="btn-action-secondary"
            onClick={() => setIsManualModalOpen(true)}
          >
            <FaPlus />
            <span>{isKhmer ? "កត់ត្រាវត្តមានដោយដៃ" : "Manual Record"}</span>
          </button>

          <button className="btn-action-secondary" onClick={handleExportCSV}>
            <FaFileDownload />
            <span>{isKhmer ? "ទាញយក Excel / CSV" : "Export CSV"}</span>
          </button>

          <button className="btn-action-secondary" onClick={handlePrint}>
            <FaPrint />
            <span>{isKhmer ? "បោះពុម្ពរបាយការណ៍" : "Print Sheet"}</span>
          </button>

          <button className="btn-action-primary" onClick={loadData}>
            <FaSyncAlt />
            <span>{isKhmer ? "ផ្ទុកឡើងវិញ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================
          1. Live Attendance Kiosk Terminal Widget with GPS Tracking
          =================================================================== */}
      <div className="attendance-kiosk-card">
        {/* Left: Clock, Date & Live GPS Tracker Box */}
        <div className="kiosk-clock-section">
          <div>
            <div className="kiosk-badge-title">
              <span className="kiosk-live-dot" />
              {isKhmer ? "ស្ថានីយ៍ផ្ទាល់ (LIVE KIOSK)" : "LIVE CLOCK TERMINAL"}
            </div>
            <div className="kiosk-time-display">
              {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
            </div>
            <div className="kiosk-date-display">
              <FaCalendarDay />
              <span>
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>

          {/* Real-time GPS Location Tracking Status Box */}
          <div className="kiosk-gps-tracker-box">
            <div className="gps-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaMapMarkerAlt style={{ color: "#38bdf8" }} />
                <strong>{isKhmer ? "ទីតាំង GPS បច្ចុប្បន្ន" : "Current GPS Location"}</strong>
              </div>
              <button
                className="gps-refresh-btn"
                title="Refresh GPS"
                onClick={fetchCurrentLocation}
                disabled={gpsLoading}
              >
                <FaCrosshairs className={gpsLoading ? "animate-spin" : ""} />
                <span>{gpsLoading ? "Locating..." : "Refresh"}</span>
              </button>
            </div>

            {deviceGps ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span
                    className={`gps-status-badge ${deviceGps.isWithinGeofence ? "inside" : "outside"
                      }`}
                  >
                    {deviceGps.isWithinGeofence ? (
                      <>🟢 {isKhmer ? "ក្នុងបរិវេណផ្សារ (Inside Mall)" : "Inside Geofence"}</>
                    ) : (
                      <>🟡 {isKhmer ? "ក្រៅបរិវេណផ្សារ (Remote)" : "Outside Geofence"}</>
                    )}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    ±{deviceGps.accuracy}m acc
                  </span>
                </div>

                <div className="gps-coords-detail">
                  <div><span>Lat/Lng:</span> {deviceGps.latitude}, {deviceGps.longitude}</div>
                  <div><span>Dist:</span> <b>{deviceGps.distanceMeters} meters</b> from mall center</div>
                </div>

                {deviceGps.latitude && (
                  <a
                    href={`https://www.google.com/maps?q=${deviceGps.latitude},${deviceGps.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="gps-map-mini-link"
                  >
                    <FaExternalLinkAlt size={10} />
                    <span>{isKhmer ? "មើលទីតាំងលើ Google Maps" : "View on Google Maps"}</span>
                  </a>
                )}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                {isKhmer ? "កំពុងស្វែងរកកូអរដោនេ GPS..." : "Acquiring GPS coordinates..."}
              </div>
            )}
          </div>

          <div className="kiosk-shift-indicator">
            <span>{isKhmer ? "វេនធ្វើការបច្ចុប្បន្ន:" : "Active Shift:"}</span>
            <span className="shift-tag">
              {currentTime.getHours() < 13
                ? "Morning (08:00 - 17:00)"
                : "Evening (13:00 - 22:00)"}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="kiosk-actions-section">
          <div className="kiosk-staff-selector-row">
            <div className="kiosk-select-group">
              <label>
                {isKhmer ? "ជ្រើសរើសបុគ្គលិក (Staff Member)" : "Select Staff Member"}
                {!isManager ? (
                  <span className="kiosk-locked-tag" title="Only managers can switch staff selection">
                    🔒 {isKhmer ? "(គណនីរបស់អ្នក - ចាក់សោ)" : "(Logged-in User - Locked)"}
                  </span>
                ) : (
                  <span className="kiosk-current-user-tag" title="Manager mode: You can select any employee">
                    👑 {isKhmer ? "(សិទ្ធិ Manager)" : "(Manager Mode - Select Any)"}
                  </span>
                )}
              </label>
              <select
                className={`kiosk-select-input ${!isManager ? "locked-user-select" : ""}`}
                value={!isManager && activeLoggedInStaff ? activeLoggedInStaff.id : selectedStaffId}
                disabled={!isManager}
                onChange={(e) => isManager && setSelectedStaffId(e.target.value)}
                title={!isManager ? "Logged-in as current user (Locked)" : "Manager Mode: Select any staff member"}
              >
                {selectableStaffList.map((s) => {
                  const isCurrent = currentUser && (
                    String(s.id) === String(currentUser.id || currentUser.user_id) ||
                    (currentUser.email && s.email === currentUser.email)
                  );
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.khmerName ? `(${s.khmerName})` : ""} - {s.role} ({s.department}) {isCurrent ? " ★ (You)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="kiosk-select-group">
              <label>{isKhmer ? "ជ្រើសរើសវេន (Shift)" : "Assigned Shift"}</label>
              <select
                className="kiosk-select-input"
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
              >
                {shifts.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Staff Preview & Status */}
          {activeSelectedStaff && (
            <div className="kiosk-staff-status-bar">
              <div className="staff-info-preview">
                <img
                  src={activeSelectedStaff.avatar}
                  alt={activeSelectedStaff.name}
                  className="staff-preview-avatar"
                />
                <div className="staff-preview-text">
                  <h4>
                    {activeSelectedStaff.name} {activeSelectedStaff.khmerName && `(${activeSelectedStaff.khmerName})`}
                  </h4>
                  <p>
                    {activeSelectedStaff.id} • {activeSelectedStaff.role} • {activeSelectedStaff.department}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div>
                {!activeStaffRecordToday ? (
                  <span className="staff-live-badge not-checked-in">
                    ● {isKhmer ? "មិនទាន់ Check-In" : "Not Checked In"}
                  </span>
                ) : activeStaffRecordToday.status === "On Leave" ? (
                  <span className="staff-live-badge on-break" style={{ background: "#fef3c7", color: "#b45309" }}>
                    🏖️ {isKhmer ? "សុំច្បាប់ឈប់សម្រាក (On Leave)" : "On Leave"}
                  </span>
                ) : activeStaffRecordToday.checkOutTime ? (
                  <span className="staff-live-badge checked-out">
                    ✓ {isKhmer ? "បាន Check-Out រួចរាល់" : "Checked Out"} ({activeStaffRecordToday.checkOutTime})
                  </span>
                ) : activeStaffRecordToday.breakStatus === "On Break" ? (
                  <span className="staff-live-badge on-break">
                    ☕ {isKhmer ? "កំពុងសម្រាក (On Break)" : "On Break"}
                  </span>
                ) : (
                  <span className="staff-live-badge checked-in">
                    ● {isKhmer ? "កំពុងបំពេញការងារ" : "On Duty"} ({activeStaffRecordToday.checkInTime})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="kiosk-punch-buttons-grid">
            <button
              className="btn-punch btn-punch-in"
              onClick={handleKioskCheckIn}
              disabled={!!activeStaffRecordToday && !activeStaffRecordToday.checkOutTime && activeStaffRecordToday.status !== "On Leave"}
            >
              <FaSignInAlt />
              <span>{isKhmer ? "ចុះវត្តមានចូល (Check In)" : "Check In"}</span>
            </button>

            <button
              className="btn-punch btn-punch-break"
              onClick={handleKioskBreak}
              disabled={!activeStaffRecordToday || !!activeStaffRecordToday.checkOutTime || activeStaffRecordToday.status === "On Leave"}
            >
              <FaCoffee />
              <span>
                {activeStaffRecordToday?.breakStatus === "On Break"
                  ? (isKhmer ? "បញ្ចប់ការសម្រាក" : "End Break")
                  : (isKhmer ? "សម្រាក (Break)" : "Take Break")}
              </span>
            </button>

            <button
              className="btn-punch btn-punch-out"
              onClick={handleKioskCheckOut}
              disabled={!activeStaffRecordToday || !!activeStaffRecordToday.checkOutTime || activeStaffRecordToday.status === "On Leave"}
            >
              <FaSignOutAlt />
              <span>{isKhmer ? "ចុះវត្តមានចេញ (Check Out)" : "Check Out"}</span>
            </button>

            <button
              className="btn-punch btn-punch-leave"
              onClick={() => handleOpenLeaveModal()}
              title="Ask permission for leave / vacation / sick"
            >
              <FaUmbrellaBeach />
              <span>{isKhmer ? "សុំច្បាប់ (Ask Leave)" : "Ask Permission"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. Executive KPI Cards
          =================================================================== */}
      <div className="attendance-kpi-grid">
        {loading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <div className="attendance-kpi-card kpi-present">
              <div className="kpi-left">
                <p>{isKhmer ? "វត្តមានថ្ងៃនេះ" : "Present Today"}</p>
                <h3>{kpiMetrics.presentCount} / {kpiMetrics.totalStaff}</h3>
                <span className="kpi-subtext">
                  {kpiMetrics.attendanceRate}% {isKhmer ? "អត្រាវត្តមានសរុប" : "Workforce turn-up"}
                </span>
              </div>
              <div className="attendance-kpi-icon">
                <FaUserCheck />
              </div>
            </div>

            <div className="attendance-kpi-card kpi-ontime">
              <div className="kpi-left">
                <p>{isKhmer ? "ទាន់ពេលវេលា" : "On Time Check-ins"}</p>
                <h3>{kpiMetrics.onTimeCount}</h3>
                <span className="kpi-subtext">
                  {isKhmer ? "ចូលធ្វើការទាន់ម៉ោងកំណត់" : "Punctual arrivals"}
                </span>
              </div>
              <div className="attendance-kpi-icon">
                <FaClock />
              </div>
            </div>

            <div className="attendance-kpi-card kpi-late">
              <div className="kpi-left">
                <p>{isKhmer ? "មកយឺត / សុំច្បាប់" : "Late / On Leave"}</p>
                <h3>{kpiMetrics.lateCount} <span style={{ fontSize: "15px", color: "#64748b" }}>/ {kpiMetrics.onLeaveCount} Leave</span></h3>
                <span className="kpi-subtext">
                  {kpiMetrics.onLeaveCount > 0 ? `${kpiMetrics.onLeaveCount} on approved leave` : "Late arrivals today"}
                </span>
              </div>
              <div className="attendance-kpi-icon">
                <FaExclamationTriangle />
              </div>
            </div>

            <div className="attendance-kpi-card kpi-overtime">
              <div className="kpi-left">
                <p>{isKhmer ? "ម៉ោងថែម & សរុប" : "Total Work & OT"}</p>
                <h3>{kpiMetrics.totalHoursWorked}h</h3>
                <span className="kpi-subtext">
                  +{kpiMetrics.totalOvertimeHours}h {isKhmer ? "ម៉ោងបន្ថែម (OT)" : "Overtime logged"}
                </span>
              </div>
              <div className="attendance-kpi-icon">
                <FaStopwatch />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===================================================================
          3. Filter & Controls Bar
          =================================================================== */}
      <div className="attendance-filter-card">
        <div className="filter-top-row">
          <div className="search-input-box">
            <FaSearch color="#94a3b8" />
            <input
              type="text"
              placeholder={
                isKhmer
                  ? "ស្វែងរកតាមឈ្មោះបុគ្គលិក, ID ឬ ផ្នែកការងារ..."
                  : "Search staff name, employee ID, role or department..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                onClick={() => setSearchQuery("")}
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="filter-selectors-group">
            <select
              className="filter-select"
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
            >
              <option value="today">{isKhmer ? "ថ្ងៃនេះ (Today)" : "Today"}</option>
              <option value="yesterday">{isKhmer ? "ម្សិលមិញ (Yesterday)" : "Yesterday"}</option>
              <option value="all">{isKhmer ? "កំណត់ត្រាទាំងអស់ (All Time)" : "All Records"}</option>
              <option value="custom">{isKhmer ? "ជ្រើសរើសថ្ងៃជាក់លាក់" : "Specific Date"}</option>
            </select>

            {dateFilterMode === "custom" && (
              <input
                type="date"
                className="filter-date-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            )}

            <select
              className="filter-select"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">{isKhmer ? "គ្រប់ផ្នែក (All Departments)" : "All Departments"}</option>
              <option value="Management">Management</option>
              <option value="Cashier">Cashier</option>
              <option value="Sales">Sales</option>
              <option value="Inventory">Inventory</option>
              <option value="IT & Systems">IT & Systems</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>

        {/* Quick Status Tabs & View Switcher Row */}
        <div className="attendance-filter-bottom-row">
          <div className="attendance-status-tabs">
            {[
              { id: "present", label: isKhmer ? "🟢 កំពុងបំពេញការងារ (Present)" : "🟢 Present / On Duty", count: kpiMetrics.presentCount },
              { id: "all", label: isKhmer ? "📋 កំណត់ត្រាទាំងអស់ (All Records)" : "📋 All Records", count: records.length },
              { id: "late", label: isKhmer ? "🟡 មកយឺត" : "🟡 Late Arrivals", count: kpiMetrics.lateCount },
              { id: "break", label: isKhmer ? "☕ កំពុងសម្រាក" : "☕ On Break", count: kpiMetrics.onBreakCount },
              { id: "leave", label: isKhmer ? "🏖️ សុំច្បាប់" : "🏖️ On Leave", count: kpiMetrics.onLeaveCount || 0 },
              { id: "checked_out", label: isKhmer ? "🔵 បាន Check-Out" : "🔵 Checked Out", count: kpiMetrics.checkedOutCount }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`status-tab-btn ${selectedStatusTab === tab.id ? "active" : ""}`}
                onClick={() => setSelectedStatusTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="status-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* ===================================================================
          4. Attendance Records: Kanban (Mobile Only) vs List/Table (Window / Laptop)
          =================================================================== */}
      {isMobile ? (
        /* KANBAN BOARD VIEW (Mobile Only) */
        <div className="attendance-kanban-board">
          {kanbanColumns.map((col) => (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-col-title">
                  <span className="kanban-col-icon">{col.icon}</span>
                  <h4>{col.title}</h4>
                </div>
                <span className={`kanban-col-count ${col.badgeClass}`}>
                  {col.records.length}
                </span>
              </div>

              <div className="kanban-cards-list">
                {col.records.length === 0 ? (
                  <div className="kanban-empty-col">
                    <p>{isKhmer ? "គ្មានបុគ្គលិក" : "No staff"}</p>
                  </div>
                ) : (
                  col.records.map((item) => {
                    const isAttendanceRec = col.type === "attendance";
                    const loc = isAttendanceRec ? item.checkInLocation : null;
                    const isInside = loc ? loc.isWithinGeofence : true;
                    const distMeters = loc?.distanceMeters || 0;
                    const mapUrl = loc?.latitude
                      ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
                      : null;
                    return (
                      <div
                        key={isAttendanceRec ? item.id : item.id}
                        className={`kanban-card ${isAttendanceRec ? `status-${item.status?.toLowerCase().replace(/\s+/g, "-")}` : "status-not-in"}`}
                      >
                        {/* Top: Avatar & Info */}
                        <div className="kanban-card-top">
                          <img
                            src={
                              item.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                            }
                            alt={isAttendanceRec ? item.employeeName : item.name}
                            className="kanban-card-avatar"
                          />
                          <div className="kanban-card-info">
                            <h5>{isAttendanceRec ? item.employeeName : item.name}</h5>
                            <p>
                              {isAttendanceRec ? item.employeeId : item.id} • {item.role}
                            </p>
                            <span className="kanban-dept-badge">{item.department}</span>
                          </div>
                        </div>

                        {/* Middle: Shift & Times if Attendance */}
                        {isAttendanceRec ? (
                          <div className="kanban-card-metrics">
                            <div className="kanban-metric-item">
                              <span className="metric-label">{isKhmer ? "ម៉ោងចូល:" : "Check In:"}</span>
                              <span className="metric-val in">
                                <FaSignInAlt size={10} /> {item.checkInTime || "--:--"}
                              </span>
                            </div>
                            <div className="kanban-metric-item">
                              <span className="metric-label">{isKhmer ? "ម៉ោងចេញ:" : "Check Out:"}</span>
                              <span className="metric-val out">
                                <FaSignOutAlt size={10} /> {item.checkOutTime || "--:--"}
                              </span>
                            </div>
                            {item.totalWorkHours > 0 && (
                              <div className="kanban-metric-item full-row">
                                <span className="metric-label">{isKhmer ? "ម៉ោងបំពេញការងារ:" : "Hours:"}</span>
                                <span className="metric-val bold">
                                  {item.totalWorkHours}h {item.overtimeHours > 0 ? `(+${item.overtimeHours}h OT)` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="kanban-card-metrics">
                            <div className="kanban-metric-item full-row">
                              <span className="metric-label">{isKhmer ? "វេនកំណត់:" : "Assigned Shift:"}</span>
                              <span className="metric-val">
                                {shifts.find((s) => s.id === item.defaultShiftId)?.name || "Morning Shift"}
                              </span>
                            </div>
                            <div className="kanban-metric-item full-row">
                              <span className="metric-label">{isKhmer ? "ទំនាក់ទំនង:" : "Contact:"}</span>
                              <span className="metric-val">
                                {item.phone || item.email || "Store Staff"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Location Tag */}
                        {isAttendanceRec && (
                          <div className="kanban-card-location">
                            {mapUrl ? (
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`kanban-loc-chip ${isInside ? "inside" : "outside"}`}
                              >
                                <FaMapMarkerAlt />
                                <span>{isInside ? `Mall (${distMeters}m)` : `Outside (${(distMeters / 1000).toFixed(1)}km)`}</span>
                                <FaExternalLinkAlt size={9} />
                              </a>
                            ) : (
                              <span className="kanban-loc-chip inside">
                                <FaMapMarkerAlt />
                                <span>Mall Center</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom: Action Buttons */}
                        <div className="kanban-card-actions">
                          {isAttendanceRec ? (
                            <>
                              <button
                                className="btn-kanban-action view"
                                title="View GPS & Timeline"
                                onClick={() => {
                                  setSelectedRecord(item);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <FaEye /> <span>{isKhmer ? "ព័ត៌មាន" : "Details"}</span>
                              </button>
                              <button
                                className="btn-kanban-action edit"
                                title="Edit Record"
                                onClick={() => {
                                  setSelectedRecord(item);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn-kanban-action delete"
                                title="Delete Record"
                                onClick={() => handleDeleteRecord(item)}
                              >
                                <FaTrash />
                              </button>
                            </>
                          ) : (
                            <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                              <button
                                className="btn-kanban-punch-now"
                                onClick={() => {
                                  setSelectedStaffId(item.id);
                                  handleKioskCheckIn();
                                }}
                              >
                                <FaSignInAlt />
                                <span>{isKhmer ? "ចុះវត្តមាន" : "Clock In"}</span>
                              </button>
                              <button
                                className="btn-kanban-action"
                                style={{ color: "#0284c7", background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)" }}
                                onClick={() => handleOpenLeaveModal(item.id)}
                                title="Ask Leave Permission"
                              >
                                <FaUmbrellaBeach />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="attendance-table-card">
          {loading ? (
            <TableSkeleton rows={6} cols={9} />
          ) : (
            <div className="table-responsive-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>{isKhmer ? "បុគ្គលិក" : "Employee"}</th>
                    <th>{isKhmer ? "ផ្នែក & តួនាទី" : "Department / Role"}</th>
                    <th>{isKhmer ? "កាលបរិច្ឆេទ & វេន" : "Date & Shift"}</th>
                    <th>{isKhmer ? "ម៉ោងចូល (Check In)" : "Check In"}</th>
                    <th>{isKhmer ? "ទីតាំង GPS" : "GPS Location"}</th>
                    <th>{isKhmer ? "ម៉ោងចេញ (Check Out)" : "Check Out"}</th>
                    <th>{isKhmer ? "សម្រាក" : "Break"}</th>
                    <th>{isKhmer ? "ម៉ោងសរុប & OT" : "Total Work (OT)"}</th>
                    <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                    <th style={{ textAlign: "center" }}>{isKhmer ? "សកម្មភាព" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-table-state">
                          <FaClock size={40} />
                          <p>{isKhmer ? "មិនមានកំណត់ត្រាវត្តមានតាមលក្ខខណ្ឌស្វែងរកនេះទេ" : "No attendance records found matching filters."}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedRecords.map((r) => {
                      const loc = r.checkInLocation;
                      const isInside = loc ? loc.isWithinGeofence : true;
                      const distMeters = loc?.distanceMeters || 0;
                      const mapUrl = loc?.latitude
                        ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
                        : null;

                      return (
                        <tr key={r.id}>
                          {/* Staff Column */}
                          <td>
                            <div className="staff-cell">
                              <img
                                src={
                                  r.avatar ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                                }
                                alt={r.employeeName}
                                className="staff-avatar-sm"
                              />
                              <div className="staff-cell-meta">
                                <h5>{r.employeeName}</h5>
                                <p>
                                  {r.khmerName && <span style={{ marginRight: "4px" }}>{r.khmerName} •</span>}
                                  ID: {r.employeeId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role / Dept */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <span style={{ fontWeight: 600, fontSize: "13px" }}>{r.role}</span>
                              <span className="dept-badge">{r.department}</span>
                            </div>
                          </td>

                          {/* Date & Shift */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600 }}>{r.date}</span>
                              <span className="shift-badge">{r.shiftName || "Morning Shift"}</span>
                            </div>
                          </td>

                          {/* Check In Time */}
                          <td>
                            <div className="time-chip">
                              <FaSignInAlt style={{ color: "#10b981" }} />
                              <span>{r.checkInTime || "--:--:--"}</span>
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              <span
                                className={`status-subchip ${r.checkInStatus === "Late"
                                    ? "late"
                                    : r.checkInStatus === "On Time"
                                      ? "ontime"
                                      : r.checkInStatus === "On Leave"
                                        ? "on-break"
                                        : ""
                                  }`}
                              >
                                {r.checkInStatus === "Late" && r.lateMinutes > 0
                                  ? `Late (+${r.lateMinutes}m)`
                                  : r.checkInStatus}
                              </span>
                            </div>
                          </td>

                          {/* GPS Location Column */}
                          <td>
                            {mapUrl ? (
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`location-table-chip ${isInside ? "inside" : "outside"}`}
                                title={loc?.address || "View on Google Maps"}
                              >
                                <FaMapMarkerAlt />
                                <span>{isInside ? `Mall (${distMeters}m)` : `${(distMeters / 1000).toFixed(1)}km`}</span>
                                <FaExternalLinkAlt size={9} />
                              </a>
                            ) : (
                              <span className="location-table-chip inside">
                                <FaMapMarkerAlt />
                                <span>Mall Center</span>
                              </span>
                            )}
                          </td>

                          {/* Check Out Time */}
                          <td>
                            <div className="time-chip">
                              <FaSignOutAlt style={{ color: r.checkOutTime ? "#3b82f6" : "#94a3b8" }} />
                              <span>{r.checkOutTime || "--:--:--"}</span>
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              <span
                                className="status-subchip"
                                style={{
                                  background: r.checkOutTime ? "#eff6ff" : "#f8fafc",
                                  color: r.checkOutTime ? "#2563eb" : "#94a3b8"
                                }}
                              >
                                {r.checkOutStatus || (r.checkOutTime ? "Completed" : "On Shift")}
                              </span>
                            </div>
                          </td>

                          {/* Break */}
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <FaCoffee style={{ color: r.breakStatus === "On Break" ? "#f59e0b" : "#94a3b8" }} />
                              <span>{r.totalBreakMinutes || 0} mins</span>
                            </div>
                            {r.breakStatus === "On Break" && (
                              <span className="status-subchip late" style={{ marginTop: "3px", display: "inline-block" }}>
                                Break Active
                              </span>
                            )}
                          </td>

                          {/* Total Work Hours & OT */}
                          <td>
                            <span className="hours-pill">
                              {r.totalWorkHours ? `${r.totalWorkHours}h` : "In Progress"}
                            </span>
                            {r.overtimeHours > 0 && (
                              <span className="overtime-pill">
                                +{r.overtimeHours}h OT
                              </span>
                            )}
                          </td>

                          {/* Overall Status */}
                          <td>
                            <span
                              className={`staff-live-badge ${r.status === "Present" || r.status === "On Shift"
                                  ? "checked-in"
                                  : r.status === "On Break"
                                    ? "on-break"
                                    : r.status === "On Leave"
                                      ? "on-break"
                                      : r.status === "Late"
                                        ? "on-break"
                                        : "checked-out"
                                }`}
                              style={r.status === "On Leave" ? { background: "#fef3c7", color: "#b45309" } : {}}
                            >
                              ● {r.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="table-action-btns">
                              <button
                                className="btn-tbl-action"
                                title="View Details & GPS Audit"
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <FaEye />
                              </button>

                              <button
                                className="btn-tbl-action edit"
                                title="Edit Attendance Record"
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <FaEdit />
                              </button>

                              <button
                                className="btn-tbl-action delete"
                                title="Delete Record"
                                onClick={() => handleDeleteRecord(r)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================
          MODAL 1: Request Leave Permission (ពាក្យសុំច្បាប់ឈប់សម្រាក)
          =================================================================== */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={isKhmer ? "ពាក្យសុំច្បាប់ឈប់សម្រាក (Ask Permission Leave)" : "Staff Leave Permission Request"}
        size="md"
      >
        <form onSubmit={handleSubmitLeave}>
          <div className="attendance-form-grid">
            <div className="form-group-field" style={{ gridColumn: "1 / -1" }}>
              <label>
                {isKhmer ? "ជ្រើសរើសបុគ្គលិកសុំច្បាប់ *" : "Select Staff Member *"}
                {!isManager ? (
                  <span className="kiosk-locked-tag" style={{ marginLeft: "8px" }}>
                    🔒 {isKhmer ? "(គណនីរបស់អ្នក)" : "(Your Account)"}
                  </span>
                ) : (
                  <span className="kiosk-current-user-tag" style={{ marginLeft: "8px" }}>
                    👑 {isKhmer ? "(សិទ្ធិ Manager)" : "(Manager Mode)"}
                  </span>
                )}
              </label>
              <select
                required
                disabled={!isManager}
                className={!isManager ? "locked-user-select" : ""}
                value={leaveForm.employeeId}
                onChange={(e) => {
                  if (!isManager) return;
                  const s = selectableStaffList.find((st) => st.id === e.target.value);
                  setLeaveForm({
                    ...leaveForm,
                    employeeId: e.target.value,
                    contactNumber: s?.phone || leaveForm.contactNumber
                  });
                }}
              >
                {selectableStaffList.map((s) => {
                  const isCurrent = currentUser && (
                    String(s.id) === String(currentUser.id || currentUser.user_id) ||
                    (currentUser.email && s.email === currentUser.email)
                  );
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.khmerName ? `(${s.khmerName})` : ""} - {s.role} ({s.department}) {isCurrent ? " ★ (You)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "ប្រភេទច្បាប់ឈប់សម្រាក *" : "Leave Type *"}</label>
              <select
                required
                value={leaveForm.leaveType}
                onChange={(e) => {
                  const val = e.target.value;
                  let kh = "ច្បាប់ឈប់សម្រាក";
                  if (val === "Sick Leave") kh = "ច្បាប់ឈឺ (Sick Leave)";
                  else if (val === "Annual Leave") kh = "ច្បាប់ប្រចាំឆ្នាំ (Annual Vacation)";
                  else if (val === "Personal Leave") kh = "កិច្ចការផ្ទាល់ខ្លួន (Personal Affairs)";
                  else if (val === "Urgent Leave") kh = "ច្បាប់បន្ទាន់ (Urgent Emergency)";
                  else if (val === "Half Day Morning") kh = "ច្បាប់កន្លះថ្ងៃព្រឹក (Half Day AM)";
                  else if (val === "Half Day Afternoon") kh = "ច្បាប់កន្លះថ្ងៃរសៀល (Half Day PM)";
                  else if (val === "Maternity/Paternity") kh = "ច្បាប់សម្រាលកូន (Maternity/Paternity)";
                  else if (val === "Unpaid Leave") kh = "ច្បាប់អត់ប្រាក់ខែ (Unpaid Leave)";

                  setLeaveForm({ ...leaveForm, leaveType: val, leaveTypeKh: kh });
                }}
              >
                <option value="Sick Leave">🩺 {isKhmer ? "ច្បាប់ឈឺ (Sick Leave)" : "Sick Leave"}</option>
                <option value="Annual Leave">🏖️ {isKhmer ? "ច្បាប់ប្រចាំឆ្នាំ (Annual Leave)" : "Annual Vacation Leave"}</option>
                <option value="Personal Leave">🏃 {isKhmer ? "កិច្ចការផ្ទាល់ខ្លួន (Personal Leave)" : "Personal Business"}</option>
                <option value="Urgent Leave">🚨 {isKhmer ? "ច្បាប់បន្ទាន់ (Urgent Leave)" : "Urgent Family Emergency"}</option>
                <option value="Half Day Morning">⏱️ {isKhmer ? "ច្បាប់កន្លះថ្ងៃព្រឹក (Half Day AM)" : "Half Day (Morning)"}</option>
                <option value="Half Day Afternoon">⏱️ {isKhmer ? "ច្បាប់កន្លះថ្ងៃរសៀល (Half Day PM)" : "Half Day (Afternoon)"}</option>
                <option value="Maternity/Paternity">🍼 {isKhmer ? "ច្បាប់សម្រាលកូន (Maternity/Paternity)" : "Maternity / Paternity"}</option>
                <option value="Unpaid Leave">📋 {isKhmer ? "ច្បាប់អត់ប្រាក់ខែ (Unpaid Leave)" : "Unpaid Leave"}</option>
              </select>
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "លេខទូរស័ព្ទទាក់ទងពេលឈប់" : "Emergency Contact Phone"}</label>
              <input
                type="text"
                placeholder="e.g. 012 345 678"
                value={leaveForm.contactNumber}
                onChange={(e) => setLeaveForm({ ...leaveForm, contactNumber: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "ចាប់ពីថ្ងៃទី *" : "Start Date *"}</label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "រហូតដល់ថ្ងៃទី *" : "End Date *"}</label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                min={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              />
            </div>

            <div className="form-group-field" style={{ gridColumn: "1 / -1" }}>
              <label>{isKhmer ? "មូលហេតុនៃការសុំច្បាប់ *" : "Reason / Justification *"}</label>
              <textarea
                rows={3}
                required
                placeholder={isKhmer ? "បញ្ជាក់មូលហេតុលម្អិតនៃការសុំច្បាប់..." : "Please describe the reason for your leave request..."}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="form-footer-buttons">
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setIsLeaveModalOpen(false)}
            >
              {isKhmer ? "បោះបង់" : "Cancel"}
            </button>
            <button type="submit" className="btn-action-primary">
              <FaCheckCircle />
              <span>{isKhmer ? "ដាក់ពាក្យសុំច្បាប់" : "Submit Leave Request"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================
          MODAL 2: Leave Requests Manager (គ្រប់គ្រងការសុំច្បាប់បុគ្គលិក)
          =================================================================== */}
      <Modal
        isOpen={isLeaveManagerOpen}
        onClose={() => setIsLeaveManagerOpen(false)}
        title={isKhmer ? "បញ្ជីគ្រប់គ្រងការសុំច្បាប់បុគ្គលិក (Staff Leave Requests)" : "Staff Leave Permission Management"}
        size="lg"
      >
        <div className="leave-manager-content">
          <div className="leave-filter-tabs-row">
            {[
              { id: "all", label: isKhmer ? "ទាំងអស់" : "All Requests", count: leaveRequests.length },
              { id: "pending", label: isKhmer ? "រង់ចាំការអនុម័ត" : "Pending Review", count: leaveRequests.filter((l) => l.status === "Pending").length },
              { id: "approved", label: isKhmer ? "បានអនុម័ត" : "Approved", count: leaveRequests.filter((l) => l.status === "Approved").length },
              { id: "rejected", label: isKhmer ? "បានបដិសេធ" : "Rejected", count: leaveRequests.filter((l) => l.status === "Rejected").length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`leave-tab-btn ${leaveFilterTab === tab.id ? "active" : ""}`}
                onClick={() => setLeaveFilterTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="leave-tab-pill">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="leave-requests-list">
            {leaveRequests.filter((l) => {
              if (leaveFilterTab === "all") return true;
              return l.status.toLowerCase() === leaveFilterTab.toLowerCase();
            }).length === 0 ? (
              <div className="leave-empty-state">
                <FaUmbrellaBeach size={36} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <p>{isKhmer ? "មិនមានពាក្យសុំច្បាប់ក្នុងស្ថានភាពនេះទេ" : "No leave requests found in this category."}</p>
              </div>
            ) : (
              leaveRequests
                .filter((l) => {
                  if (leaveFilterTab === "all") return true;
                  return l.status.toLowerCase() === leaveFilterTab.toLowerCase();
                })
                .map((req) => (
                  <div key={req.id} className={`leave-request-card status-${req.status.toLowerCase()}`}>
                    <div className="leave-card-header">
                      <div className="leave-staff-profile">
                        <img src={req.avatar} alt={req.employeeName} className="leave-staff-avatar" />
                        <div>
                          <h5>{req.employeeName} {req.khmerName && `(${req.khmerName})`}</h5>
                          <p>{req.employeeId} • {req.role} ({req.department})</p>
                        </div>
                      </div>
                      <span className={`leave-status-badge ${req.status.toLowerCase()}`}>
                        {req.status === "Pending" && "⏳ Pending"}
                        {req.status === "Approved" && "✓ Approved"}
                        {req.status === "Rejected" && "✕ Rejected"}
                      </span>
                    </div>

                    <div className="leave-card-details-grid">
                      <div>
                        <strong>{isKhmer ? "ប្រភេទច្បាប់:" : "Leave Type:"}</strong>
                        <span>{req.leaveTypeKh || req.leaveType}</span>
                      </div>
                      <div>
                        <strong>{isKhmer ? "កាលបរិច្ឆេទ:" : "Duration:"}</strong>
                        <span>{req.startDate} {req.endDate !== req.startDate ? `to ${req.endDate}` : ""} ({req.durationDays} day{req.durationDays > 1 ? "s" : ""})</span>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <strong>{isKhmer ? "មូលហេតុ:" : "Reason:"}</strong>
                        <p className="leave-reason-text">{req.reason}</p>
                      </div>
                      {req.contactNumber && (
                        <div>
                          <strong>{isKhmer ? "លេខទូរស័ព្ទ:" : "Contact:"}</strong>
                          <span>{req.contactNumber}</span>
                        </div>
                      )}
                      {req.reviewedBy && (
                        <div>
                          <strong>{isKhmer ? "អ្នកពិនិត្យ:" : "Reviewed By:"}</strong>
                          <span>{req.reviewedBy} {req.reviewNotes && `("${req.reviewNotes}")`}</span>
                        </div>
                      )}
                    </div>

                    <div className="leave-card-actions">
                      {isManager && req.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            className="btn-leave-approve"
                            onClick={() => handleApproveLeave(req)}
                          >
                            <FaCheck /> <span>{isKhmer ? "អនុម័តច្បាប់ (Approve)" : "Approve"}</span>
                          </button>
                          <button
                            type="button"
                            className="btn-leave-reject"
                            onClick={() => handleRejectLeave(req)}
                          >
                            <FaBan /> <span>{isKhmer ? "បដិសេធ (Reject)" : "Reject"}</span>
                          </button>
                        </>
                      )}
                      {(isManager || String(req.employeeId) === String(activeLoggedInStaff?.id)) && (
                        <button
                          type="button"
                          className="btn-leave-delete"
                          onClick={() => handleDeleteLeave(req.id)}
                          title="Delete Request"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </Modal>

      {/* ===================================================================
          MODAL 2: Geofence Settings & Mall Coordinates Configuration
          =================================================================== */}
      <Modal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        title={isKhmer ? "ការកំណត់ទីតាំង Geofence & GPS ផ្សារទំនើប" : "Geofence & Mall GPS Settings"}
        size="md"
      >
        <form onSubmit={handleSaveGeofence}>
          <div className="attendance-form-grid">
            <div className="form-group-field">
              <label>{isKhmer ? "ឈ្មោះសាខា / អគារ" : "Mall Branch Name"}</label>
              <input
                type="text"
                required
                value={geofenceForm.name}
                onChange={(e) => setGeofenceForm({ ...geofenceForm, name: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "កាំ Geofence (ម៉ែត្រ) *" : "Geofence Radius (Meters) *"}</label>
              <input
                type="number"
                min="50"
                max="5000"
                required
                value={geofenceForm.geofenceRadiusMeters}
                onChange={(e) =>
                  setGeofenceForm({ ...geofenceForm, geofenceRadiusMeters: Number(e.target.value) })
                }
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "Latitude *" : "Center Latitude *"}</label>
              <input
                type="number"
                step="0.000001"
                required
                value={geofenceForm.latitude}
                onChange={(e) =>
                  setGeofenceForm({ ...geofenceForm, latitude: Number(e.target.value) })
                }
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "Longitude *" : "Center Longitude *"}</label>
              <input
                type="number"
                step="0.000001"
                required
                value={geofenceForm.longitude}
                onChange={(e) =>
                  setGeofenceForm({ ...geofenceForm, longitude: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="form-group-field" style={{ marginTop: "14px" }}>
            <label>{isKhmer ? "អាសយដ្ឋានពេញលេញ" : "Full Address Description"}</label>
            <input
              type="text"
              value={geofenceForm.address}
              onChange={(e) => setGeofenceForm({ ...geofenceForm, address: e.target.value })}
            />
          </div>

          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              id="strictGeofence"
              checked={geofenceForm.strictGeofenceEnforcement}
              onChange={(e) =>
                setGeofenceForm({ ...geofenceForm, strictGeofenceEnforcement: e.target.checked })
              }
            />
            <label htmlFor="strictGeofence" style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              {isKhmer ? "បើកការព្រមានពេល Check-in នៅក្រៅ Geofence" : "Warn/Prompt confirmation if staff clocks in outside geofence radius"}
            </label>
          </div>

          <div className="form-footer-buttons">
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setIsGeofenceModalOpen(false)}
            >
              {isKhmer ? "បោះបង់" : "Cancel"}
            </button>
            <button type="submit" className="btn-action-primary">
              <FaCheckCircle />
              <span>{isKhmer ? "រក្សាទុកការកំណត់" : "Save Geofence"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================
          MODAL 3: Add Manual Attendance Record
          =================================================================== */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={isKhmer ? "កត់ត្រាវត្តមានដោយដៃ (Manual Attendance)" : "Add Manual Attendance Record"}
        size="md"
      >
        <form onSubmit={handleSaveManualRecord}>
          <div className="attendance-form-grid">
            <div className="form-group-field">
              <label>{isKhmer ? "បុគ្គលិក *" : "Staff Member *"}</label>
              <select
                required
                value={manualForm.employeeId}
                onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
              >
                <option value="">-- {isKhmer ? "ជ្រើសរើសបុគ្គលិក" : "Select Staff"} --</option>
                {selectableStaffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - {s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "វេនធ្វើការ *" : "Assigned Shift *"}</label>
              <select
                value={manualForm.shiftId}
                onChange={(e) => setManualForm({ ...manualForm, shiftId: e.target.value })}
              >
                {shifts.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "កាលបរិច្ឆេទ *" : "Date *"}</label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "ម៉ោងចូល (HH:MM:SS) *" : "Check-In Time *"}</label>
              <input
                type="text"
                required
                placeholder="08:00:00"
                value={manualForm.checkInTime}
                onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "ម៉ោងចេញ (HH:MM:SS)" : "Check-Out Time (Optional)"}</label>
              <input
                type="text"
                placeholder="17:00:00"
                value={manualForm.checkOutTime}
                onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
              />
            </div>

            <div className="form-group-field">
              <label>{isKhmer ? "ម៉ោងសម្រាក (នាទី)" : "Break Duration (Minutes)"}</label>
              <input
                type="number"
                min="0"
                value={manualForm.totalBreakMinutes}
                onChange={(e) => setManualForm({ ...manualForm, totalBreakMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group-field" style={{ marginTop: "14px" }}>
            <label>{isKhmer ? "មូលហេតុ ឬ កំណត់ចំណាំ" : "Reason / Adjustment Notes"}</label>
            <textarea
              rows="2"
              placeholder={isKhmer ? "បញ្ចូលមូលហេតុបន្ថែម..." : "e.g. Employee forgot to punch badge in morning..."}
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
            />
          </div>

          <div className="form-footer-buttons">
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => setIsManualModalOpen(false)}
            >
              {isKhmer ? "បោះបង់" : "Cancel"}
            </button>
            <button type="submit" className="btn-action-primary">
              <FaPlus />
              <span>{isKhmer ? "រក្សាទុកកំណត់ត្រា" : "Save Attendance"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================
          MODAL 4: Edit Attendance Record
          =================================================================== */}
      {selectedRecord && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={isKhmer ? "កែប្រែព័ត៌មានវត្តមាន" : "Edit Attendance Log"}
          size="md"
        >
          <form onSubmit={handleSaveEditRecord}>
            <div className="attendance-form-grid">
              <div className="form-group-field">
                <label>{isKhmer ? "បុគ្គលិក" : "Employee"}</label>
                <input type="text" disabled value={selectedRecord.employeeName} />
              </div>

              <div className="form-group-field">
                <label>{isKhmer ? "កាលបរិច្ឆេទ" : "Date"}</label>
                <input
                  type="date"
                  value={selectedRecord.date}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, date: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>{isKhmer ? "ម៉ោងចូល (Check In)" : "Check In Time"}</label>
                <input
                  type="text"
                  value={selectedRecord.checkInTime || ""}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, checkInTime: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>{isKhmer ? "ម៉ោងចេញ (Check Out)" : "Check Out Time"}</label>
                <input
                  type="text"
                  value={selectedRecord.checkOutTime || ""}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, checkOutTime: e.target.value })}
                />
              </div>

              <div className="form-group-field">
                <label>{isKhmer ? "ម៉ោងសម្រាក (នាទី)" : "Break Duration (Mins)"}</label>
                <input
                  type="number"
                  value={selectedRecord.totalBreakMinutes || 0}
                  onChange={(e) =>
                    setSelectedRecord({ ...selectedRecord, totalBreakMinutes: Number(e.target.value) })
                  }
                />
              </div>

              <div className="form-group-field">
                <label>{isKhmer ? "វិធីសាស្ត្រ Punch" : "Punch Method"}</label>
                <select
                  value={selectedRecord.checkInMethod || "GPS Mobile / Web"}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, checkInMethod: e.target.value })}
                >
                  <option value="GPS Mobile / Web">GPS Mobile / Web</option>
                  <option value="Web Kiosk">Web Kiosk</option>
                  <option value="QR Badge">QR Badge</option>
                  <option value="PIN Code">PIN Code</option>
                  <option value="Admin Manual">Admin Manual</option>
                </select>
              </div>
            </div>

            <div className="form-group-field" style={{ marginTop: "14px" }}>
              <label>{isKhmer ? "កំណត់ចំណាំ" : "Notes / Remarks"}</label>
              <textarea
                rows="2"
                value={selectedRecord.notes || ""}
                onChange={(e) => setSelectedRecord({ ...selectedRecord, notes: e.target.value })}
              />
            </div>

            <div className="form-footer-buttons">
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                {isKhmer ? "បោះបង់" : "Cancel"}
              </button>
              <button type="submit" className="btn-action-primary">
                <FaCheckCircle />
                <span>{isKhmer ? "រក្សាទុកការកែប្រែ" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================
          MODAL 5: Attendance Log Detail & GPS Audit
          =================================================================== */}
      {selectedRecord && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={isKhmer ? "សេចក្តីលម្អិតនៃវត្តមាន & GPS Audit" : "Attendance Log Detail & GPS Audit"}
          size="md"
        >
          <div className="attendance-detail-box">
            <div className="detail-header-profile">
              <img
                src={selectedRecord.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                alt={selectedRecord.employeeName}
                className="detail-avatar-lg"
              />
              <div className="detail-profile-info">
                <h4>{selectedRecord.employeeName}</h4>
                <p>ID: {selectedRecord.employeeId} • {selectedRecord.role} • {selectedRecord.department}</p>
                <span className="shift-badge" style={{ marginTop: "6px" }}>
                  {selectedRecord.shiftName}
                </span>
              </div>
            </div>

            <div className="detail-stats-grid">
              <div className="detail-stat-item">
                <span>{isKhmer ? "ម៉ោងបំពេញការងារ" : "Total Work Hours"}</span>
                <strong>{selectedRecord.totalWorkHours || 0} Hours</strong>
              </div>
              <div className="detail-stat-item">
                <span>{isKhmer ? "ម៉ោងថែម (OT)" : "Overtime"}</span>
                <strong style={{ color: "#8b5cf6" }}>+{selectedRecord.overtimeHours || 0} Hours</strong>
              </div>
              <div className="detail-stat-item">
                <span>{isKhmer ? "ម៉ោងសម្រាក" : "Total Break"}</span>
                <strong>{selectedRecord.totalBreakMinutes || 0} Mins</strong>
              </div>
            </div>

            {/* GPS Location Audit Card */}
            {selectedRecord.checkInLocation && (
              <div
                className={`detail-gps-card ${selectedRecord.checkInLocation.isWithinGeofence ? "" : "outside"
                  }`}
              >
                <h5>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaMapMarkerAlt style={{ color: selectedRecord.checkInLocation.isWithinGeofence ? "#16a34a" : "#d97706" }} />
                    <span>{isKhmer ? "ព័ត៌មានទីតាំងភូមិសាស្ត្រ GPS Check-In" : "GPS Geolocation Audit"}</span>
                  </div>
                  <span
                    className={`gps-status-badge ${selectedRecord.checkInLocation.isWithinGeofence ? "inside" : "outside"
                      }`}
                  >
                    {selectedRecord.checkInLocation.isWithinGeofence ? "Inside Geofence" : "Outside Mall"}
                  </span>
                </h5>

                <div className="detail-gps-grid">
                  <div>
                    <span style={{ color: "#64748b" }}>Coordinates:</span>{" "}
                    <b>{selectedRecord.checkInLocation.latitude}, {selectedRecord.checkInLocation.longitude}</b>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Distance from Mall:</span>{" "}
                    <b>{selectedRecord.checkInLocation.distanceMeters || 0} meters</b>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>GPS Accuracy:</span>{" "}
                    <b>±{selectedRecord.checkInLocation.accuracy || 10}m</b>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Location Source:</span>{" "}
                    <b>{selectedRecord.checkInLocation.source || "Device GPS"}</b>
                  </div>
                </div>

                {selectedRecord.checkInLocation.latitude && (
                  <div style={{ marginTop: "10px" }}>
                    <a
                      href={`https://www.google.com/maps?q=${selectedRecord.checkInLocation.latitude},${selectedRecord.checkInLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-action-secondary"
                      style={{ display: "inline-flex", padding: "6px 12px", fontSize: "12px", gap: "6px" }}
                    >
                      <FaExternalLinkAlt size={12} />
                      <span>{isKhmer ? "បើកមើលទីតាំងលើ Google Maps" : "Open in Google Maps"}</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="detail-timeline-card">
              <h5>{isKhmer ? "កំណត់ហេតុ Audit Timeline" : "Clock Event Timeline"}</h5>
              <div className="timeline-row">
                <span>📅 {isKhmer ? "កាលបរិច្ឆេទ" : "Shift Date"}</span>
                <strong>{selectedRecord.date}</strong>
              </div>
              <div className="timeline-row">
                <span>🟢 {isKhmer ? "ម៉ោង Check In" : "Check-in Punch"}</span>
                <strong>{selectedRecord.checkInTime || "N/A"} ({selectedRecord.checkInStatus})</strong>
              </div>
              <div className="timeline-row">
                <span>☕ {isKhmer ? "ម៉ោងសម្រាក" : "Break Taken"}</span>
                <strong>{selectedRecord.totalBreakMinutes || 0} Minutes</strong>
              </div>
              <div className="timeline-row">
                <span>🔴 {isKhmer ? "ម៉ោង Check Out" : "Check-out Punch"}</span>
                <strong>{selectedRecord.checkOutTime || "Still On Shift"}</strong>
              </div>
              <div className="timeline-row">
                <span>🏷️ {isKhmer ? "វិធីសាស្ត្រផ្ទៀងផ្ទាត់" : "Punch Method"}</span>
                <strong>{selectedRecord.checkInMethod || "GPS Mobile / Web"}</strong>
              </div>
              {selectedRecord.notes && (
                <div className="timeline-row">
                  <span>📝 {isKhmer ? "កំណត់ចំណាំ" : "Audit Remarks"}</span>
                  <p style={{ margin: 0, color: "#475569" }}>{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="form-footer-buttons">
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                {isKhmer ? "បិទ" : "Close"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AttendancePage;
