import React, { useState, useEffect, useMemo } from "react";
import {
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaCoffee,
  FaSignOutAlt,
  FaSignInAlt,
  FaQrcode,
  FaKey,
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
  FaBackspace,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaExternalLinkAlt,
  FaCog
} from "react-icons/fa";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import Modal from "../../components/Modal";
import { TableSkeleton, KpiCardSkeleton } from "../../components/loading/LoadingSkeleton";
import { useTranslation } from "../../context/LanguageContext";
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
  verifyStaffPin,
  exportAttendanceToCSV
} from "../../services/attendanceService";
import "./style/AttendancePage.css";

function AttendancePage() {
  const { isKhmer } = useTranslation();

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time GPS Location state for Kiosk Terminal
  const [deviceGps, setDeviceGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Data states
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [records, setRecords] = useState([]);
  const [geofenceConfig, setGeofenceConfig] = useState(getStoredGeofenceConfig());

  const [kpiMetrics, setKpiMetrics] = useState({
    totalStaff: 0,
    presentCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    onBreakCount: 0,
    checkedOutCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    totalHoursWorked: 0,
    totalOvertimeHours: 0
  });

  // Kiosk Terminal Selected Staff
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("shift_morning");
  const [terminalNotes, setTerminalNotes] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState("today"); // today, yesterday, this_month, custom
  const [customDate, setCustomDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatusTab, setSelectedStatusTab] = useState("all");

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
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

  // Geofence Edit Form
  const [geofenceForm, setGeofenceForm] = useState({ ...geofenceConfig });

  // PIN Terminal Form
  const [pinInput, setPinInput] = useState("");
  const [pinAction, setPinAction] = useState("check_in");

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
      const staff = await getStaffListApi();
      const shiftData = getStoredShifts();
      const geo = getStoredGeofenceConfig();
      setStaffList(staff);
      setShifts(shiftData);
      setGeofenceConfig(geo);

      if (staff && staff.length > 0) {
        setSelectedStaffId((prev) => (prev && staff.some((s) => s.id === prev) ? prev : staff[0].id));
      }

      let queryDate = "";
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (dateFilterMode === "today") queryDate = todayStr;
      else if (dateFilterMode === "yesterday") queryDate = yesterdayStr;
      else if (dateFilterMode === "custom") queryDate = customDate;

      const res = await getAttendanceRecordsApi({
        search: searchQuery,
        date: queryDate,
        department: selectedDepartment,
        status: selectedStatusTab
      });

      setRecords(res.data || []);

      const kpis = await getAttendanceKPIsApi(queryDate || todayStr);
      setKpiMetrics(kpis);
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

  const activeSelectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const activeStaffRecordToday = useMemo(() => {
    if (!selectedStaffId) return null;
    return records.find((r) => r.employeeId === selectedStaffId && r.date === todayStr);
  }, [records, selectedStaffId, todayStr]);

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

  // Handle PIN Keypad input
  const handlePinKeyClick = (num) => {
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPinInput("");
  };

  // Submit PIN Punch
  const handlePinSubmit = async () => {
    if (pinInput.length < 4) {
      Swal.fire("Warning", isKhmer ? "សូមបញ្ចូលលេខកូដសម្ងាត់ ៤ ខ្ទង់" : "Please enter a 4-digit PIN", "warning");
      return;
    }

    const matchedStaff = verifyStaffPin(pinInput);
    if (!matchedStaff) {
      Swal.fire({
        title: isKhmer ? "លេខកូដមិនត្រឹមត្រូវ" : "Invalid PIN Code",
        text: isKhmer ? "សូមពិនិត្យលេខកូដបុគ្គលិករបស់អ្នកម្តងទៀត" : "No staff found with this PIN code.",
        icon: "error"
      });
      setPinInput("");
      return;
    }

    try {
      if (pinAction === "check_in") {
        await checkInStaffApi({
          employeeId: matchedStaff.id,
          shiftId: matchedStaff.defaultShiftId || "shift_morning",
          method: "PIN Code",
          location: deviceGps
        });
        confetti({ particleCount: 70, spread: 50 });
        Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", `${matchedStaff.name} clocked in via PIN.`, "success");
      } else if (pinAction === "check_out") {
        await checkOutStaffApi({
          employeeId: matchedStaff.id,
          method: "PIN Code",
          location: deviceGps
        });
        Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", `${matchedStaff.name} clocked out via PIN.`, "success");
      } else if (pinAction === "break") {
        await toggleBreakApi({ employeeId: matchedStaff.id });
        Swal.fire(isKhmer ? "ជោគជ័យ!" : "Success!", `${matchedStaff.name} break updated.`, "info");
      }

      setIsPinModalOpen(false);
      setPinInput("");
      loadData();
    } catch (e) {
      Swal.fire("Error", e.message, "error");
      setPinInput("");
    }
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
            onClick={() => {
              setPinAction("check_in");
              setIsPinModalOpen(true);
            }}
          >
            <FaKey />
            <span>{isKhmer ? "PIN Clock Terminal" : "PIN Keypad Punch"}</span>
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
              <label>{isKhmer ? "ជ្រើសរើសបុគ្គលិក (Staff Member)" : "Select Staff Member"}</label>
              <select
                className="kiosk-select-input"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role} - {s.department})
                  </option>
                ))}
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
                  <h4>{activeSelectedStaff.name} {activeSelectedStaff.khmerName && `(${activeSelectedStaff.khmerName})`}</h4>
                  <p>{activeSelectedStaff.id} • {activeSelectedStaff.role} • {activeSelectedStaff.department}</p>
                </div>
              </div>

              {/* Status indicator */}
              <div>
                {!activeStaffRecordToday ? (
                  <span className="staff-live-badge not-checked-in">
                    ● {isKhmer ? "មិនទាន់ Check-In" : "Not Checked In"}
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
              disabled={!!activeStaffRecordToday && !activeStaffRecordToday.checkOutTime}
            >
              <FaSignInAlt />
              <span>{isKhmer ? "ចុះវត្តមានចូល (Check In)" : "Check In"}</span>
            </button>

            <button
              className="btn-punch btn-punch-break"
              onClick={handleKioskBreak}
              disabled={!activeStaffRecordToday || !!activeStaffRecordToday.checkOutTime}
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
              disabled={!activeStaffRecordToday || !!activeStaffRecordToday.checkOutTime}
            >
              <FaSignOutAlt />
              <span>{isKhmer ? "ចុះវត្តមានចេញ (Check Out)" : "Check Out"}</span>
            </button>

            <button
              className="btn-punch btn-punch-pin"
              onClick={() => {
                setPinAction("check_in");
                setIsPinModalOpen(true);
              }}
            >
              <FaKey />
              <span>{isKhmer ? "បញ្ចូល PIN" : "PIN Punch"}</span>
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
                <p>{isKhmer ? "មកយឺត" : "Late Arrivals"}</p>
                <h3>{kpiMetrics.lateCount}</h3>
                <span className="kpi-subtext">
                  {isKhmer ? "លើសពីម៉ោងកំណត់ + 15 នាទី" : "Beyond grace period"}
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

        {/* Quick Status Tabs */}
        <div className="attendance-status-tabs">
          {[
            { id: "all", label: isKhmer ? "ទាំងអស់" : "All Records", count: records.length },
            { id: "present", label: isKhmer ? "កំពុងបំពេញការងារ" : "Present / On Shift", count: kpiMetrics.presentCount },
            { id: "late", label: isKhmer ? "មកយឺត" : "Late", count: kpiMetrics.lateCount },
            { id: "break", label: isKhmer ? "កំពុងសម្រាក" : "On Break", count: kpiMetrics.onBreakCount },
            { id: "checked_out", label: isKhmer ? "បាន Check-Out" : "Checked Out", count: kpiMetrics.checkedOutCount }
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

      {/* ===================================================================
          4. Attendance Records Table with GPS Location Tracking
          =================================================================== */}
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
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-table-state">
                        <FaClock size={40} />
                        <p>{isKhmer ? "មិនមានកំណត់ត្រាវត្តមានតាមលក្ខខណ្ឌស្វែងរកនេះទេ" : "No attendance records found matching filters."}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const loc = r.checkInLocation;
                    const isInside = loc ? loc.isWithinGeofence : true;
                    const distMeters = loc?.distanceMeters || 0;
                    const mapUrl = loc?.latitude
                      ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
                      : null;

                    return (
                      <tr key={r.id}>
                        {/* Staff Cell */}
                        <td>
                          <div className="staff-cell">
                            <img
                              src={r.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                              alt={r.employeeName}
                              className="staff-cell-avatar"
                            />
                            <div className="staff-cell-meta">
                              <h5>{r.employeeName}</h5>
                              <p>{r.employeeId} {r.khmerName && `• ${r.khmerName}`}</p>
                            </div>
                          </div>
                        </td>

                        {/* Department / Role */}
                        <td>
                          <span className="dept-badge">{r.department}</span>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>{r.role}</div>
                        </td>

                        {/* Date & Shift */}
                        <td>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>{r.date}</div>
                          <span className="shift-badge" style={{ marginTop: "3px" }}>
                            {r.shiftName ? r.shiftName.split(" ")[0] : "Shift"}
                          </span>
                        </td>

                        {/* Check In Time */}
                        <td>
                          <div className="time-chip">
                            <FaSignInAlt style={{ color: "#10b981" }} />
                            <span>{r.checkInTime || "--:--:--"}</span>
                          </div>
                          <div style={{ marginTop: "4px" }}>
                            {r.checkInStatus === "Late" ? (
                              <span className="status-subchip late">
                                Late +{r.lateMinutes}m
                              </span>
                            ) : (
                              <span className="status-subchip ontime">
                                On Time
                              </span>
                            )}
                            <span className="method-tag" style={{ marginLeft: "4px" }}>
                              {r.checkInMethod || "Web"}
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
                                  : r.status === "Late"
                                    ? "on-break"
                                    : "checked-out"
                              }`}
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

      {/* ===================================================================
          MODAL 1: PIN Keypad Clock Terminal
          =================================================================== */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinInput("");
        }}
        title={isKhmer ? "ស្ថានីយ៍ចុះវត្តមានដោយលេខកូដ PIN" : "PIN Keypad Punch Terminal"}
        size="sm"
      >
        <div className="pin-modal-content">
          <div className="pin-modal-header">
            <h3>{isKhmer ? "បញ្ចូលលេខកូដសម្ងាត់បុគ្គលិក" : "Enter 4-Digit Staff PIN"}</h3>
            <p>
              {isKhmer ? "លេខកូដបុគ្គលិកក្នុងប្រព័ន្ធ API:" : "Active Staff PINs (from API):"}
              <br />
              {staffList && staffList.length > 0
                ? staffList.slice(0, 5).map((s) => `${s.name} (${s.pin || s.id})`).join(" • ")
                : (isKhmer ? "កំពុងទាញយកទិន្នន័យពី API..." : "Loading staff from API...")}
            </p>
          </div>

          <div className="pin-action-selector">
            <button
              className={`pin-action-btn ${pinAction === "check_in" ? "active in" : ""}`}
              onClick={() => setPinAction("check_in")}
            >
              <FaSignInAlt /> Check In
            </button>
            <button
              className={`pin-action-btn ${pinAction === "break" ? "active" : ""}`}
              onClick={() => setPinAction("break")}
            >
              <FaCoffee /> Break
            </button>
            <button
              className={`pin-action-btn ${pinAction === "check_out" ? "active out" : ""}`}
              onClick={() => setPinAction("check_out")}
            >
              <FaSignOutAlt /> Check Out
            </button>
          </div>

          <div className="pin-display-dots">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`pin-dot ${pinInput.length > idx ? "filled" : ""}`}
              />
            ))}
          </div>

          <div className="pin-keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                className="btn-pin-key"
                onClick={() => handlePinKeyClick(String(num))}
              >
                {num}
              </button>
            ))}
            <button className="btn-pin-key" onClick={handlePinClear}>
              C
            </button>
            <button className="btn-pin-key" onClick={() => handlePinKeyClick("0")}>
              0
            </button>
            <button className="btn-pin-key" onClick={handlePinBackspace}>
              <FaBackspace />
            </button>
          </div>

          <button
            className="btn-action-primary"
            style={{ width: "100%", justifyContent: "center", padding: "14px" }}
            onClick={handlePinSubmit}
            disabled={pinInput.length < 4}
          >
            {isKhmer ? "បញ្ជាក់វត្តមាន" : "Submit PIN Punch"}
          </button>
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
                {staffList.map((s) => (
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
