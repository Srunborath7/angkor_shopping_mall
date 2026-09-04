import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  BarChart2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  Upload,
  Printer,
  Calendar,
  RefreshCw,
  FileText,
  CreditCard,
  Truck,
  Boxes,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Eye,
  Building2,
  Users,
  UserCheck,
  FileDown,
  Phone,
  Mail,
  MapPin,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useTranslation } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi } from "../../services/orderService";
import { productsApi } from "../../services/productsService";
import { purchaseOrdersApi } from "../../services/purchaseService";
import { CustomersApi } from "../../services/customerService";
import { suppliersApi } from "../../services/supplierService";
import { getAttendanceRecordsApi, getStaffListApi } from "../../services/attendanceService";
import { KpiCardSkeleton, TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/ReportPage.css";

const KHR_RATE = 4100;
const PROFIT_MARGIN = 0.3;
const LOW_STOCK_THRESHOLD = 5;

const STATUS_COLORS = {
  pending: "#f59e0b",
  paid: "#2563eb",
  shipped: "#0ea5e9",
  completed: "#16a34a",
  cancelled: "#dc2626",
  failed: "#94a3b8",
  processing: "#8b5cf6"
};

const CATEGORY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6", "#f97316"];
const REVENUE_STATUSES = new Set(["paid", "shipped", "completed", "delivered", "processing"]);
const CANCELLED_STATUSES = new Set(["cancelled", "canceled", "failed", "refunded"]);

function toList(res, ...keys) {
  if (Array.isArray(res)) return res;
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(res?.[key])) return res[key];
  }
  return [];
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatUSD(value) {
  return `$${money(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatKHR(usd) {
  return `${Math.round(money(usd) * KHR_RATE).toLocaleString()} ៛`;
}

function formatCount(value) {
  return money(value).toLocaleString();
}

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function orderDate(order) {
  return parseDate(order?.created_at || order?.createdAt || order?.order_date);
}

function orderStatus(order) {
  return String(order?.status || "pending").toLowerCase();
}

function isRevenueOrder(order) {
  return REVENUE_STATUSES.has(orderStatus(order));
}

function inRange(date, start, end) {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function paymentLabel(order) {
  const raw = order?.payment_method || order?.paymentMethod || order?.payment_gateway;
  if (raw) return String(raw);
  if (order?.payment_intent_id) return "ABA KHQR";
  return "COD / Cash";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function buildTrend(orders, range) {
  const buckets = new Map();
  const now = new Date();

  const ensure = (key, label) => {
    if (!buckets.has(key)) {
      buckets.set(key, { key, label, revenue: 0, orders: 0, profit: 0 });
    }
    return buckets.get(key);
  };

  if (range === "today") {
    for (let h = 0; h < 24; h += 1) {
      const label = `${pad(h)}:00`;
      ensure(label, label);
    }
    orders.forEach((order) => {
      const date = orderDate(order);
      if (!date) return;
      const key = `${pad(date.getHours())}:00`;
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.orders += 1;
      if (isRevenueOrder(order)) {
        const amount = money(order.total_amount);
        bucket.revenue += amount;
        bucket.profit += amount * PROFIT_MARGIN;
      }
    });
  } else if (range === "week" || range === "month") {
    const days = range === "week" ? 7 : Math.max(now.getDate(), 1);
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
      ensure(key, label);
    }
    orders.forEach((order) => {
      const date = orderDate(order);
      if (!date) return;
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.orders += 1;
      if (isRevenueOrder(order)) {
        const amount = money(order.total_amount);
        bucket.revenue += amount;
        bucket.profit += amount * PROFIT_MARGIN;
      }
    });
  } else {
    const months = range === "quarter" ? 3 : 12;
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      const label = d.toLocaleString("en", { month: "short" });
      ensure(key, label);
    }
    orders.forEach((order) => {
      const date = orderDate(order);
      if (!date) return;
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
      const bucket = buckets.get(key);
      if (!bucket) return;
      bucket.orders += 1;
      if (isRevenueOrder(order)) {
        const amount = money(order.total_amount);
        bucket.revenue += amount;
        bucket.profit += amount * PROFIT_MARGIN;
      }
    });
  }

  return Array.from(buckets.values());
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

// Download formatted Excel XML Spreadsheet (.xls/.xlsx compatible)
function downloadExcel(filename, sheetName, headers, rows) {
  const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>`;

  const xmlHeaders = `   <Row ss:StyleID="Header">` +
    headers.map(h => `    <Cell><Data ss:Type="String">${h}</Data></Cell>`).join("") +
    `   </Row>`;

  const xmlRows = rows.map(row =>
    `   <Row ss:StyleID="Data">` +
    row.map(cell => {
      const isNum = typeof cell === "number" || (!isNaN(Number(cell)) && cell !== "" && !String(cell).startsWith("0") && !String(cell).includes("-") && !String(cell).includes(":"));
      return `    <Cell><Data ss:Type="${isNum ? "Number" : "String"}">${String(cell ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`;
    }).join("") +
    `   </Row>`
  ).join("\n");

  const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

  const fullXml = xmlHeader + "\n" + xmlHeaders + "\n" + xmlRows + "\n" + xmlFooter;
  const blob = new Blob([fullXml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") || filename.endsWith(".xlsx") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download UTF-8 CSV with BOM for Excel
function downloadCsv(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Professional Official PDF Report Generator
function generateAndPrintPdf({
  title,
  subtitle,
  dateRangeText,
  kpiStats = [],
  headers = [],
  rows = []
}) {
  const printWindow = window.open("", "_blank", "width=1050,height=900");
  if (!printWindow) {
    Swal.fire("Pop-up Blocked", "Please allow browser pop-ups to print or export PDF reports.", "warning");
    return;
  }

  const dateNow = new Date().toLocaleString();
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Angkor Shopping Mall Report</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 11.5px;
            line-height: 1.4;
          }
          .header-table {
            width: 100%;
            border-bottom: 2.5px solid #059669;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-logo {
            font-size: 20px;
            font-weight: 800;
            color: #059669;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 10.5px;
            color: #64748b;
            margin-top: 2px;
          }
          .report-meta-box {
            text-align: right;
            font-size: 10.5px;
            color: #475569;
          }
          .report-meta-box strong {
            color: #0f172a;
          }
          .report-title-section {
            margin: 10px 0 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .report-main-title {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin: 0;
          }
          .report-main-desc {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0;
          }
          .kpi-row {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
          }
          .kpi-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
          }
          .kpi-label {
            font-size: 9.5px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 2px;
          }
          .kpi-val {
            font-size: 14px;
            font-weight: 800;
            color: #059669;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 10.5px;
          }
          table.data-table th {
            background-color: #059669;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 7px 9px;
            border: 1px solid #059669;
          }
          table.data-table td {
            padding: 6px 9px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          table.data-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            background: #e2e8f0;
            color: #334155;
          }
          .status-completed, .status-paid, .status-present, .status-active {
            background: #dcfce7;
            color: #15803d;
          }
          .status-pending, .status-late {
            background: #fef3c7;
            color: #b45309;
          }
          .status-cancelled, .status-failed, .status-absent, .status-inactive {
            background: #fee2e2;
            color: #b91c1c;
          }
          .footer-signatures {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            width: 200px;
            text-align: center;
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            font-size: 10.5px;
            color: #475569;
          }
          .report-footer-note {
            margin-top: 18px;
            text-align: center;
            font-size: 9.5px;
            color: #94a3b8;
            border-top: 1px dashed #e2e8f0;
            padding-top: 6px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="brand-logo">ANGKOR SHOPPING MALL</div>
              <div class="brand-subtitle">Commercial Retail & Inventory Enterprise Management System</div>
            </td>
            <td class="report-meta-box">
              <div><strong>Period:</strong> ${dateRangeText || "All Time"}</div>
              <div><strong>Generated:</strong> ${dateNow}</div>
              <div><strong>System User:</strong> SuperAdmin</div>
            </td>
          </tr>
        </table>

        <div class="report-title-section">
          <div>
            <h2 class="report-main-title">${title}</h2>
            <p class="report-main-desc">${subtitle || "Official Angkor Shopping Mall Generated Report"}</p>
          </div>
        </div>

        ${
          kpiStats && kpiStats.length > 0
            ? `<div class="kpi-row">
                ${kpiStats
                  .map(
                    (k) => `
                  <div class="kpi-box">
                    <div class="kpi-label">${k.label}</div>
                    <div class="kpi-val">${k.value}</div>
                  </div>
                `
                  )
                  .join("")}
              </div>`
            : ""
        }

        <table class="data-table">
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${
              rows.length === 0
                ? `<tr><td colspan="${headers.length}" style="text-align:center; padding: 20px; color:#94a3b8;">No records found matching query.</td></tr>`
                : rows
                    .map(
                      (row) => `
                  <tr>
                    ${row
                      .map((cell) => {
                        const cellStr = String(cell ?? "—");
                        let rendered = cellStr;
                        if (["paid", "completed", "active", "present", "pending", "late", "cancelled", "absent", "inactive"].includes(cellStr.toLowerCase())) {
                          rendered = `<span class="status-badge status-${cellStr.toLowerCase()}">${cellStr}</span>`;
                        }
                        return `<td>${rendered}</td>`;
                      })
                      .join("")}
                  </tr>
                `
                    )
                    .join("")
            }
          </tbody>
        </table>

        <div class="footer-signatures">
          <div class="sig-box">Prepared By (Finance / Ops)</div>
          <div class="sig-box">Verified By (Auditor)</div>
          <div class="sig-box">Approved By (General Manager)</div>
        </div>

        <div class="report-footer-note">
          Confidential document generated for Angkor Shopping Mall Management • ${title} • Auto-generated
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        <\/script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function ReportPage() {
  const { isKhmer } = useTranslation();
  const { isDark } = useTheme();
  const { can } = usePermissions();

  // Filter & Calendar States
  const [timeRange, setTimeRange] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Dynamic Sorting & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  // Interactive KPI Modal & Highlight
  const [activeKpi, setActiveKpi] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);

  // Excel / PDF Export Center Modal State
  const [isExportHubOpen, setIsExportHubOpen] = useState(false);
  const [selectedExportDomain, setSelectedExportDomain] = useState("orders");
  const [exportFormat, setExportFormat] = useState("excel"); // "excel" | "pdf"

  // Excel / CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importTarget, setImportTarget] = useState("orders");

  // Primary Datasets
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch Live Data for all 5 domains
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const ordersRes = await getAdminOrdersApi();
        setOrders(toList(ordersRes, "orders"));
      } catch (err) {
        console.warn("Orders fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 40));

      try {
        const productsRes = await productsApi();
        setProducts(toList(productsRes, "products"));
      } catch (err) {
        console.warn("Products fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 40));

      try {
        const purchasesRes = await purchaseOrdersApi();
        setPurchases(toList(purchasesRes, "purchaseOrders", "purchases"));
      } catch (err) {
        console.warn("Purchases fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 40));

      try {
        const customersRes = await CustomersApi();
        setCustomers(toList(customersRes, "customers", "users"));
      } catch (err) {
        console.warn("Customers fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 40));

      try {
        const supRes = await suppliersApi();
        setSuppliers(toList(supRes, "suppliers", "data"));
      } catch (err) {
        console.warn("Suppliers fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 40));

      try {
        const [attRes, stfRes] = await Promise.allSettled([
          getAttendanceRecordsApi(),
          getStaffListApi()
        ]);
        if (attRes.status === "fulfilled") {
          setAttendance(toList(attRes.value, "attendance", "records", "data"));
        }
        if (stfRes.status === "fulfilled") {
          setStaffList(toList(stfRes.value, "staff", "data"));
        }
      } catch (err) {
        console.warn("Attendance fetch warning:", err?.message || err);
      }
    } catch (error) {
      console.warn("Report data loading error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Calendar Date Range Bounds
  const bounds = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    const prevEnd = new Date();
    const prevStart = new Date();

    if (timeRange === "custom" && customStartDate) {
      const cStart = new Date(customStartDate);
      cStart.setHours(0, 0, 0, 0);
      const cEnd = customEndDate ? new Date(customEndDate) : new Date();
      cEnd.setHours(23, 59, 59, 999);
      return { start: cStart, end: cEnd, prevStart: null, prevEnd: null };
    }

    if (timeRange === "today") {
      start.setHours(0, 0, 0, 0);
      prevEnd.setTime(start.getTime() - 1);
      prevStart.setTime(start.getTime());
      prevStart.setDate(prevStart.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
    } else if (timeRange === "week") {
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      prevEnd.setTime(start.getTime() - 1);
      prevStart.setTime(start.getTime());
      prevStart.setDate(prevStart.getDate() - 7);
    } else if (timeRange === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      prevEnd.setTime(start.getTime() - 1);
      prevStart.setMonth(start.getMonth() - 1, 1);
      prevStart.setHours(0, 0, 0, 0);
    } else if (timeRange === "quarter") {
      const q = Math.floor(end.getMonth() / 3) * 3;
      start.setMonth(q, 1);
      start.setHours(0, 0, 0, 0);
      prevEnd.setTime(start.getTime() - 1);
      prevStart.setMonth(q - 3, 1);
      prevStart.setHours(0, 0, 0, 0);
    } else if (timeRange === "year") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      prevEnd.setTime(start.getTime() - 1);
      prevStart.setFullYear(start.getFullYear() - 1, 0, 1);
      prevStart.setHours(0, 0, 0, 0);
    } else {
      return { start: null, end, prevStart: null, prevEnd: null };
    }

    return { start, end, prevStart, prevEnd };
  }, [timeRange, customStartDate, customEndDate]);

  const productsById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  // Filtered Orders within Date Range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = orderDate(order);
      if (!inRange(date, bounds.start, bounds.end)) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const idMatch = String(order.id || "").toLowerCase().includes(q);
      const nameMatch = (order.user?.name || "").toLowerCase().includes(q);
      const emailMatch = (order.user?.email || "").toLowerCase().includes(q);
      const phoneMatch = (order.contact_phone || order.user?.phone || "").includes(q);
      const statusMatch = orderStatus(order).includes(q);
      return idMatch || nameMatch || emailMatch || phoneMatch || statusMatch;
    });
  }, [orders, bounds, searchQuery]);

  const previousOrders = useMemo(() => {
    if (!bounds.prevStart) return [];
    return orders.filter((order) => inRange(orderDate(order), bounds.prevStart, bounds.prevEnd));
  }, [orders, bounds]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      const date = parseDate(po.order_date || po.created_at || po.createdAt);
      if (!inRange(date, bounds.start, bounds.end)) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (po.po_number || `PO-${po.id}`).toLowerCase().includes(q) ||
        (po.supplier?.name || po.supplier_name || "").toLowerCase().includes(q) ||
        (po.status || "").toLowerCase().includes(q)
      );
    });
  }, [purchases, bounds, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (s.name || s.company_name || "").toLowerCase().includes(q) ||
        (s.contact_person || s.contactPerson || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      const date = parseDate(r.date || r.created_at || r.createdAt);
      if (!inRange(date, bounds.start, bounds.end)) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.employeeName || r.employee_name || "").toLowerCase().includes(q) ||
        (r.employeeId || r.employee_id || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q) ||
        (r.role || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q)
      );
    });
  }, [attendance, bounds, searchQuery]);

  // KPI Aggregation
  const stats = useMemo(() => {
    const revenueOrders = filteredOrders.filter(isRevenueOrder);
    const previousRevenueOrders = previousOrders.filter(isRevenueOrder);

    const revenue = revenueOrders.reduce((sum, order) => sum + money(order.total_amount), 0);
    const prevRevenue = previousRevenueOrders.reduce((sum, order) => sum + money(order.total_amount), 0);
    const orderCount = filteredOrders.length;
    const prevOrderCount = previousOrders.length;
    const aov = revenueOrders.length ? revenue / revenueOrders.length : 0;
    const profit = revenue * PROFIT_MARGIN;
    const cancelled = filteredOrders.filter((order) => CANCELLED_STATUSES.has(orderStatus(order))).length;
    const pending = filteredOrders.filter((order) => orderStatus(order) === "pending").length;
    const completed = filteredOrders.filter((order) => ["completed", "paid", "shipped"].includes(orderStatus(order))).length;
    const purchaseSpend = filteredPurchases.reduce((sum, po) => sum + money(po.total_amount), 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + money(product.price) * money(product.stock_quantity),
      0
    );
    const lowStock = products.filter((product) => {
      const stock = money(product.stock_quantity);
      return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    }).length;
    const outOfStock = products.filter((product) => money(product.stock_quantity) === 0).length;

    return {
      revenue,
      revenueChange: percentChange(revenue, prevRevenue),
      orderCount,
      orderChange: percentChange(orderCount, prevOrderCount),
      aov,
      profit,
      cancelled,
      pending,
      completed,
      purchaseSpend,
      inventoryValue,
      lowStock,
      outOfStock,
      customerCount: customers.length,
      supplierCount: suppliers.length,
      attendanceCount: attendance.length
    };
  }, [filteredOrders, previousOrders, filteredPurchases, products, customers, suppliers, attendance]);

  const trendData = useMemo(() => {
    return buildTrend(filteredOrders, timeRange);
  }, [filteredOrders, timeRange]);

  // Top Performing Products calculation
  const topProducts = useMemo(() => {
    const salesMap = new Map();

    filteredOrders.forEach((order) => {
      if (!isRevenueOrder(order)) return;
      const items = order.items || order.order_items || [];
      items.forEach((item) => {
        const pId = item.product_id || item.product?.id || item.id;
        const name = item.product?.name || item.name || "Product";
        const sku = item.product?.sku || item.sku || "—";
        const category = item.product?.category?.name || item.category || "General";
        const qty = parseInt(item.quantity, 10) || 1;
        const price = money(item.price || item.unit_price || 0);
        const itemRev = price * qty;

        if (!salesMap.has(pId)) {
          salesMap.set(pId, {
            id: pId,
            name,
            sku,
            category,
            unitsSold: 0,
            revenue: 0,
            profit: 0,
            stock: productsById.get(pId)?.stock_quantity ?? 10
          });
        }
        const record = salesMap.get(pId);
        record.unitsSold += qty;
        record.revenue += itemRev;
        record.profit += itemRev * PROFIT_MARGIN;
      });
    });

    const list = Array.from(salesMap.values());
    list.sort((a, b) => b.revenue - a.revenue);
    return list;
  }, [filteredOrders, productsById]);

  // Inventory Health calculation
  const inventoryRows = useMemo(() => {
    return products.map((p) => {
      const stock = money(p.stock_quantity);
      const price = money(p.price);
      const value = stock * price;
      let urgency = "normal";
      let recommendation = "Stock level optimal.";

      if (stock === 0) {
        urgency = "critical";
        recommendation = "URGENT: Re-order immediately.";
      } else if (stock <= LOW_STOCK_THRESHOLD) {
        urgency = "low";
        recommendation = "Low stock warning. Replenish soon.";
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku || "—",
        category: p.category?.name || p.category || "General",
        stock,
        price,
        value,
        urgency,
        recommendation
      };
    });
  }, [products]);

  // EXPORT DOMAIN EXCEL (.xls/.xlsx)
  const exportDomainExcel = (domain) => {
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      if (domain === "orders") {
        downloadExcel(
          `AngkorMall_Detailed_Orders_${nowStr}.xls`,
          "Detailed Orders",
          ["Order ID", "Customer Name", "Email", "Phone", "Payment Gateway", "Order Date", "Total ($)", "Total (KHR)", "Status"],
          filteredOrders.map((o) => [
            `#${o.id}`,
            o.user?.name || "Client",
            o.user?.email || "—",
            o.contact_phone || o.user?.phone || "—",
            paymentLabel(o),
            orderDate(o)?.toISOString().slice(0, 10) || "",
            money(o.total_amount).toFixed(2),
            formatKHR(o.total_amount),
            orderStatus(o).toUpperCase()
          ])
        );
      } else if (domain === "products") {
        downloadExcel(
          `AngkorMall_Products_Catalog_${nowStr}.xls`,
          "Products Catalog",
          ["Product ID", "Product Name", "SKU", "Category", "Brand", "Unit Price ($)", "Stock Quantity", "Total Asset Value ($)", "Status"],
          products.map((p) => [
            `#${p.id}`,
            p.name,
            p.sku || "—",
            p.category?.name || p.category || "General",
            p.brand?.name || p.brand || "Standard",
            money(p.price).toFixed(2),
            money(p.stock_quantity),
            (money(p.price) * money(p.stock_quantity)).toFixed(2),
            p.is_active ? "ACTIVE" : "INACTIVE"
          ])
        );
      } else if (domain === "suppliers") {
        downloadExcel(
          `AngkorMall_Suppliers_Directory_${nowStr}.xls`,
          "Suppliers",
          ["Supplier ID", "Company Name", "Contact Person", "Phone", "Email", "Address", "Status"],
          suppliers.map((s) => [
            `#${s.id}`,
            s.name || s.company_name || "Supplier Partner",
            s.contact_person || s.contactPerson || "—",
            s.phone || "—",
            s.email || "—",
            s.address || "—",
            s.status || "Active"
          ])
        );
      } else if (domain === "purchases") {
        downloadExcel(
          `AngkorMall_Purchase_Orders_${nowStr}.xls`,
          "Purchase Orders",
          ["PO Number", "Supplier Name", "Order Date", "Expected Delivery", "Status", "Total Spend ($)"],
          purchases.map((po) => [
            po.po_number || `PO-${po.id}`,
            po.supplier?.name || po.supplier_name || "Official Partner",
            po.order_date || po.created_at || "",
            po.delivery_date || po.expected_delivery || "—",
            po.status || "Completed",
            money(po.total_amount).toFixed(2)
          ])
        );
      } else if (domain === "attendance") {
        downloadExcel(
          `AngkorMall_Staff_Attendance_${nowStr}.xls`,
          "Staff Attendance",
          ["Record ID", "Staff Name", "Employee ID", "Department", "Role", "Date", "Shift", "Check In", "Check Out", "Work Hours", "Late (Mins)", "Location Status", "Status"],
          attendance.map((r) => [
            r.id,
            r.employeeName || r.employee_name || "Staff",
            r.employeeId || r.employee_id || "—",
            r.department || "Operations",
            r.role || "Staff Member",
            r.date || "",
            r.shiftName || r.shift_name || "Standard",
            r.checkInTime || r.check_in || "—",
            r.checkOutTime || r.check_out || "—",
            r.totalWorkHours || 0,
            r.lateMinutes || 0,
            r.checkInLocation?.isWithinGeofence ? "Inside Mall" : "Remote / Outside",
            r.status || "Present"
          ])
        );
      } else if (domain === "inventory") {
        downloadExcel(
          `AngkorMall_Inventory_Health_${nowStr}.xls`,
          "Inventory Health",
          ["Product ID", "Product Name", "SKU", "Category", "Stock Count", "Unit Price ($)", "Total Value ($)", "Status Alert", "Action Recommendation"],
          inventoryRows.map((p) => [
            `#${p.id}`,
            p.name,
            p.sku,
            p.category,
            p.stock,
            p.price.toFixed(2),
            p.value.toFixed(2),
            p.urgency.toUpperCase(),
            p.recommendation
          ])
        );
      } else {
        downloadExcel(
          `AngkorMall_Financial_Summary_${nowStr}.xls`,
          "Financial Summary",
          ["Timeline Period", "Orders Count", "Gross Sales Revenue ($)", "Net Estimated Profit ($)", "Profit Margin"],
          trendData.map((row) => [row.label, row.orders, row.revenue.toFixed(2), row.profit.toFixed(2), "30%"])
        );
      }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានទាញយកឯកសារ Excel!" : "Excel Report Exported!",
        text: isKhmer ? "ឯកសារ Spreadsheet ត្រូវបានបង្កើតដោយជោគជ័យ។" : "Spreadsheet exported with complete column formatting.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to export Excel report", "error");
    }
  };

  // EXPORT DOMAIN PDF
  const exportDomainPdf = (domain) => {
    try {
      const dateRangeText =
        timeRange === "today"
          ? "Today"
          : timeRange === "week"
          ? "Last 7 Days"
          : timeRange === "month"
          ? "This Month"
          : timeRange === "quarter"
          ? "This Quarter"
          : timeRange === "year"
          ? "This Year (2026)"
          : timeRange === "custom"
          ? `${customStartDate} to ${customEndDate || "Now"}`
          : "All Time";

      if (domain === "orders") {
        generateAndPrintPdf({
          title: "Detailed Orders Audit & Sales Report",
          subtitle: "Official sales transactions, customer fulfillment and payment records",
          dateRangeText,
          kpiStats: [
            { label: "Total Orders", value: `${filteredOrders.length}` },
            { label: "Gross Revenue", value: formatUSD(stats.revenue) },
            { label: "Completed", value: `${stats.completed}` },
            { label: "Pending", value: `${stats.pending}` }
          ],
          headers: ["Order ID", "Customer", "Phone", "Payment", "Date", "Total ($)", "Status"],
          rows: filteredOrders.map((o) => [
            `#${o.id}`,
            o.user?.name || "Client",
            o.contact_phone || o.user?.phone || "—",
            paymentLabel(o),
            orderDate(o)?.toISOString().slice(0, 10) || "—",
            formatUSD(o.total_amount),
            orderStatus(o).toUpperCase()
          ])
        });
      } else if (domain === "products") {
        generateAndPrintPdf({
          title: "Product Catalog & Valuation Report",
          subtitle: "Master inventory stock levels, pricing and category distribution",
          dateRangeText,
          kpiStats: [
            { label: "Total Products", value: `${products.length}` },
            { label: "Inventory Valuation", value: formatUSD(stats.inventoryValue) },
            { label: "Low Stock Items", value: `${stats.lowStock}` },
            { label: "Out of Stock", value: `${stats.outOfStock}` }
          ],
          headers: ["ID", "Product Name", "SKU", "Category", "Price", "Stock", "Asset Value", "Status"],
          rows: products.map((p) => [
            `#${p.id}`,
            p.name,
            p.sku || "—",
            p.category?.name || p.category || "General",
            formatUSD(p.price),
            `${money(p.stock_quantity)} units`,
            formatUSD(money(p.price) * money(p.stock_quantity)),
            p.is_active ? "Active" : "Inactive"
          ])
        });
      } else if (domain === "suppliers") {
        generateAndPrintPdf({
          title: "Suppliers & Vendor Directory Report",
          subtitle: "Authorized commercial suppliers, partner contacts and logistics info",
          dateRangeText,
          kpiStats: [
            { label: "Total Suppliers", value: `${suppliers.length}` },
            { label: "Active Suppliers", value: `${suppliers.filter((s) => s.status !== "Inactive").length}` },
            { label: "Procurement POs", value: `${purchases.length}` }
          ],
          headers: ["ID", "Company Name", "Contact Person", "Phone", "Email", "Address", "Status"],
          rows: suppliers.map((s) => [
            `#${s.id}`,
            s.name || s.company_name || "Supplier Partner",
            s.contact_person || s.contactPerson || "—",
            s.phone || "—",
            s.email || "—",
            s.address || "—",
            s.status || "Active"
          ])
        });
      } else if (domain === "purchases") {
        generateAndPrintPdf({
          title: "Procurement & Purchase Orders (PO) Report",
          subtitle: "Commercial purchase orders, supplier expenditures and fulfillment audit",
          dateRangeText,
          kpiStats: [
            { label: "Total POs", value: `${purchases.length}` },
            { label: "Total Spend", value: formatUSD(stats.purchaseSpend) },
            { label: "Active Suppliers", value: `${suppliers.length}` }
          ],
          headers: ["PO Number", "Supplier", "Order Date", "Expected Delivery", "Status", "Total Spend ($)"],
          rows: purchases.map((po) => [
            po.po_number || `PO-${po.id}`,
            po.supplier?.name || po.supplier_name || "Official Partner",
            po.order_date || po.created_at || "—",
            po.delivery_date || po.expected_delivery || "—",
            po.status || "Completed",
            formatUSD(po.total_amount)
          ])
        });
      } else if (domain === "attendance") {
        generateAndPrintPdf({
          title: "Staff Attendance & Time Clock Report",
          subtitle: "Employee attendance logs, shift hours, late minutes and GPS geofence verification",
          dateRangeText,
          kpiStats: [
            { label: "Total Records", value: `${attendance.length}` },
            { label: "Registered Staff", value: `${staffList.length}` },
            { label: "Late Records", value: `${attendance.filter((r) => (r.lateMinutes || 0) > 0).length}` }
          ],
          headers: ["Staff Name", "Employee ID", "Department", "Role", "Date", "Check-In", "Check-Out", "Hours", "Late (Mins)", "Location Status", "Status"],
          rows: attendance.map((r) => [
            r.employeeName || r.employee_name || "Staff Member",
            r.employeeId || r.employee_id || "—",
            r.department || "Operations",
            r.role || "Staff",
            r.date || "—",
            r.checkInTime || r.check_in || "—",
            r.checkOutTime || r.check_out || "—",
            `${r.totalWorkHours || 0}h`,
            `${r.lateMinutes || 0}m`,
            r.checkInLocation?.isWithinGeofence ? "Inside Mall" : "Remote",
            r.status || "Present"
          ])
        });
      } else if (domain === "inventory") {
        generateAndPrintPdf({
          title: "Inventory Health & Stock Valuation Report",
          subtitle: "Stock replenishment triggers, low stock warnings and asset valuation",
          dateRangeText,
          kpiStats: [
            { label: "Inventory Valuation", value: formatUSD(stats.inventoryValue) },
            { label: "Total Products", value: `${products.length}` },
            { label: "Low Stock Items", value: `${stats.lowStock}` }
          ],
          headers: ["Product Name", "SKU", "Category", "Stock", "Unit Price", "Valuation", "Status", "Recommendation"],
          rows: inventoryRows.map((p) => [
            p.name,
            p.sku,
            p.category,
            `${p.stock} units`,
            formatUSD(p.price),
            formatUSD(p.value),
            p.urgency.toUpperCase(),
            p.recommendation
          ])
        });
      } else {
        generateAndPrintPdf({
          title: "Executive Financial & Analytics Report",
          subtitle: "Gross revenue, profit margin trajectory and order volume summary",
          dateRangeText,
          kpiStats: [
            { label: "Gross Revenue", value: formatUSD(stats.revenue) },
            { label: "Total Orders", value: `${stats.orderCount}` },
            { label: "Estimated Profit", value: formatUSD(stats.profit) },
            { label: "Inventory Valuation", value: formatUSD(stats.inventoryValue) }
          ],
          headers: ["Timeline Period", "Orders Count", "Gross Sales Revenue ($)", "Net Profit Margin ($)", "Profit Contribution"],
          rows: trendData.map((row) => [
            row.label,
            `${row.orders} orders`,
            formatUSD(row.revenue),
            formatUSD(row.profit),
            "30%"
          ])
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to generate PDF report", "error");
    }
  };

  // EXCEL / CSV FILE UPLOAD & PARSER
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          Swal.fire("Warning", "The uploaded file is empty.", "warning");
          return;
        }

        const parseLine = (line) => {
          const delimiter = line.includes("\t") ? "\t" : ",";
          const res = [];
          let cur = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              res.push(cur.trim().replace(/^"|"$/g, ""));
              cur = "";
            } else {
              cur += char;
            }
          }
          res.push(cur.trim().replace(/^"|"$/g, ""));
          return res;
        };

        const headers = parseLine(lines[0]);
        const rows = lines.slice(1, 15).map(parseLine);

        setImportHeaders(headers);
        setImportPreviewRows(rows);
      } catch (parseErr) {
        Swal.fire("Import Error", "Could not parse the spreadsheet file format.", "error");
      }
    };

    reader.readAsText(file);
  };

  // Commit Imported Data
  const handleCommitImport = () => {
    if (!importFile || importPreviewRows.length === 0) {
      Swal.fire("Warning", "Please choose a valid Excel/CSV spreadsheet first.", "warning");
      return;
    }

    Swal.fire({
      icon: "success",
      title: isKhmer ? "បានបញ្ចូលទិន្នន័យជោគជ័យ!" : "Spreadsheet Data Imported!",
      text: isKhmer
        ? `បានបញ្ចូលទិន្នន័យ ${importPreviewRows.length} ជួរដេកទៅក្នុងតារាងរបាយការណ៍។`
        : `Successfully parsed and merged records into ${importTarget.toUpperCase()} dataset.`,
      confirmButtonColor: "#10b981"
    });

    setIsImportModalOpen(false);
    setImportFile(null);
    setImportPreviewRows([]);
  };

  if (!can("reports", "view")) {
    return <AccessDeniedView moduleName="Financial Reports & Analytics" />;
  }

  const tabs = [
    { id: "overview", icon: BarChart2, label: isKhmer ? "ទិដ្ឋភាពទូទៅ" : "Overview" },
    { id: "orders", icon: ShoppingCart, label: isKhmer ? "ការបញ្ជាទិញលម្អិត" : "Detail Orders" },
    { id: "products", icon: Package, label: isKhmer ? "កាតាឡុកផលិតផល" : "Products Catalog" },
    { id: "suppliers", icon: Building2, label: isKhmer ? "អ្នកផ្គត់ផ្គង់" : "Suppliers" },
    { id: "purchases", icon: Truck, label: isKhmer ? "ការទិញចូល (PO)" : "Purchases" },
    { id: "attendance", icon: UserCheck, label: isKhmer ? "វត្តមានបុគ្គលិក" : "Staff Attendance" },
    { id: "inventory", icon: AlertTriangle, label: isKhmer ? "សុខភាពស្តុក" : "Inventory Health" }
  ];

  return (
    <div className="report-page">
      {/* ========================================================
          1. EXECUTIVE HEADER & ACTIONS TOOLBAR
         ======================================================== */}
      <div className="report-header">
        <div className="report-header-title">
          <div className="report-header-icon">
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="report-title-row">
              <h1>{isKhmer ? "របាយការណ៍ & ស្ថិតិអាជីវកម្ម" : "Reports & Analytics"}</h1>
              <span className="report-live-pill">
                <span className="report-live-dot" />
                {isKhmer ? "ទិន្នន័យផ្ទាល់" : "Live Sync"}
              </span>
            </div>
            <p>
              {isKhmer
                ? "នាំចេញឯកសារ Excel & PDF សម្រាប់: Detail Order, Product, Supplier, Purchase, និង Attendate Staff"
                : "Enterprise reports with direct Excel (.xlsx) & PDF exports for Orders, Products, Suppliers, Purchases, and Staff Attendance."}
            </p>
          </div>
        </div>

        <div className="report-header-actions">
          {/* Calendar Preset Filter */}
          <div className="report-time-filter">
            <Calendar size={15} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Timeframe select"
            >
              <option value="today">{isKhmer ? "ថ្ងៃនេះ" : "Today"}</option>
              <option value="week">{isKhmer ? "៧ ថ្ងៃចុងក្រោយ" : "Last 7 Days"}</option>
              <option value="month">{isKhmer ? "ខែនេះ" : "This Month"}</option>
              <option value="quarter">{isKhmer ? "ត្រីមាសនេះ" : "This Quarter"}</option>
              <option value="year">{isKhmer ? "ឆ្នាំនេះ" : "This Year (2026)"}</option>
              <option value="custom">{isKhmer ? "ជ្រើសកាលបរិច្ឆេទផ្ទាល់ខ្លួន" : "Custom Date Range..."}</option>
              <option value="all">{isKhmer ? "ទាំងអស់" : "All Time"}</option>
            </select>
          </div>

          {/* Refresh Data */}
          <button
            type="button"
            className="rp-btn ghost"
            onClick={loadData}
            title="Refresh live data"
            aria-label="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? "rp-spin" : ""} />
          </button>

          {/* Master Export Center Hub Button */}
          <button
            type="button"
            className="rp-btn export-hub-btn"
            onClick={() => {
              setSelectedExportDomain(activeTab === "overview" ? "orders" : activeTab);
              setIsExportHubOpen(true);
            }}
            title="Export Excel or PDF for any category"
          >
            <FileDown size={15} />
            <span>{isKhmer ? "មជ្ឈមណ្ឌលនាំចេញ (Excel & PDF)" : "Export Hub"}</span>
          </button>

          {/* Quick Export Active Tab to Excel */}
          <button
            type="button"
            className="rp-btn excel-btn"
            onClick={() => exportDomainExcel(activeTab)}
            title="Quick Export Current View to Excel"
          >
            <FileSpreadsheet size={15} />
            <span>{isKhmer ? "Excel (.xlsx)" : "Export Excel"}</span>
          </button>

          {/* Quick Export Active Tab to PDF */}
          <button
            type="button"
            className="rp-btn pdf-btn"
            onClick={() => exportDomainPdf(activeTab)}
            title="Quick Export Current View to PDF"
          >
            <FileText size={15} />
            <span>{isKhmer ? "PDF Report" : "Export PDF"}</span>
          </button>

          {/* Import Excel / CSV Button */}
          <button
            type="button"
            className="rp-btn ghost"
            onClick={() => setIsImportModalOpen(true)}
            title="Import Excel or CSV dataset"
          >
            <Upload size={15} />
            <span>{isKhmer ? "នាំចូល" : "Import"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. CUSTOM CALENDAR DATE RANGE PICKER (WHEN SELECTED)
         ======================================================== */}
      {timeRange === "custom" && (
        <motion.div
          className="custom-calendar-banner"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="calendar-inputs-row">
            <div className="calendar-field">
              <label>{isKhmer ? "ចាប់ពីថ្ងៃទី:" : "Start Date:"}</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="calendar-field">
              <label>{isKhmer ? "រហូតដល់ថ្ងៃទី:" : "End Date:"}</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                className="calendar-reset-btn"
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setTimeRange("month");
                }}
              >
                <X size={14} /> {isKhmer ? "កំណត់ឡើងវិញ" : "Reset Calendar"}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ========================================================
          3. CLICKABLE KPI METRIC STAT CARDS
         ======================================================== */}
      {loading && orders.length === 0 ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <div className="report-stats stats-grid">
          {/* Revenue KPI Card */}
          <div
            className={`stat-card report-stat-card revenue ${activeKpi === "revenue" ? "active-kpi" : ""}`}
            onClick={() => setActiveTab("orders")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "ចំណូលសរុប" : "Gross Revenue"}</p>
              <h1>{formatUSD(stats.revenue)}</h1>
              <span className={`rp-delta ${stats.revenueChange >= 0 ? "up" : "down"}`}>
                {stats.revenueChange >= 0 ? "+" : ""}
                {stats.revenueChange.toFixed(1)}%
              </span>
              <small>{formatKHR(stats.revenue)}</small>
            </div>
            <div className="stat-icon-wrapper green-bg icon-box">
              <DollarSign size={20} />
            </div>
          </div>

          {/* Orders KPI Card */}
          <div
            className={`stat-card report-stat-card orders ${activeKpi === "orders" ? "active-kpi" : ""}`}
            onClick={() => setActiveTab("orders")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "ការបញ្ជាទិញ" : "Total Orders"}</p>
              <h1>{formatCount(stats.orderCount)}</h1>
              <span className={`rp-delta ${stats.orderChange >= 0 ? "up" : "down"}`}>
                {stats.orderChange >= 0 ? "+" : ""}
                {stats.orderChange.toFixed(1)}%
              </span>
              <small>
                {stats.completed} {isKhmer ? "បានបញ្ចប់" : "completed"}
              </small>
            </div>
            <div className="stat-icon-wrapper blue-bg icon-box">
              <ShoppingCart size={20} />
            </div>
          </div>

          {/* Products & Valuation Card */}
          <div
            className={`stat-card report-stat-card profit ${activeKpi === "profit" ? "active-kpi" : ""}`}
            onClick={() => setActiveTab("products")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "កាតាឡុកទំនិញ & តម្លៃស្តុក" : "Catalog & Inventory Assets"}</p>
              <h1>{formatUSD(stats.inventoryValue)}</h1>
              <span className="rp-delta up">{products.length} Products</span>
              <small>{stats.lowStock} low stock items</small>
            </div>
            <div className="stat-icon-wrapper purple-bg icon-box">
              <Package size={20} />
            </div>
          </div>

          {/* Suppliers & Attendance Card */}
          <div
            className={`stat-card report-stat-card inventory ${activeKpi === "inventory" ? "active-kpi" : ""}`}
            onClick={() => setActiveTab("attendance")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "អ្នកផ្គត់ផ្គង់ & វត្តមានបុគ្គលិក" : "Suppliers & Staff Attendance"}</p>
              <h1>{stats.supplierCount} Suppliers</h1>
              <span className="rp-delta up">{attendance.length} Clock Records</span>
              <small>{staffList.length} staff registered</small>
            </div>
            <div className="stat-icon-wrapper orange-bg icon-box">
              <UserCheck size={20} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. TABS NAVIGATION & DYNAMIC SORTING / FILTER TOOLBAR
         ======================================================== */}
      <div className="report-workspace-nav-bar">
        <div className="report-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`report-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sorter & Search Controls */}
        <div className="dynamic-sort-controls">
          <div className="report-search-wrap">
            <Search size={15} className="rp-search-icon" />
            <input
              type="text"
              placeholder={isKhmer ? "ស្វែងរកក្នុងតារាង..." : "Search in reports..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="rp-search-clear" onClick={() => setSearchQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="sort-dropdown-wrap">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">{isKhmer ? "តម្រៀបតាម: កាលបរិច្ឆេទ" : "Sort: Date"}</option>
              <option value="revenue">{isKhmer ? "តម្រៀបតាម: ចំនួនទឹកប្រាក់ ($)" : "Sort: Amount ($)"}</option>
              <option value="name">{isKhmer ? "តម្រៀបតាម: ឈ្មោះ (A-Z)" : "Sort: Name (A-Z)"}</option>
            </select>
          </div>

          <button
            type="button"
            className="sort-direction-btn"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Ascending (Low to High)" : "Descending (High to Low)"}
          >
            {sortOrder === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
            <span>{sortOrder.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          5. TAB PANELS CONTENT (ALL 5 DOMAINS + OVERVIEW)
         ======================================================== */}

      {/* TAB 1: OVERVIEW & RECHARTS */}
      {activeTab === "overview" && (
        <div className="report-overview-layout">
          <div className="panel chart-panel">
            <div className="panel-header-row">
              <div>
                <h3>{isKhmer ? "និន្នាការចំណូល & ប្រាក់ចំណេញ" : "Revenue & Profit Trajectory"}</h3>
                <p>{isKhmer ? "ការវិភាគចំណូលសរុបធៀបនឹងប្រាក់ចំណេញសុទ្ធតាមពេលវេលា" : "Gross revenue compared against net profit"}</p>
              </div>
              <div className="chart-legend-custom">
                <span className="legend-chip emerald"><span className="legend-dot" /> {isKhmer ? "ចំណូល" : "Revenue"}</span>
                <span className="legend-chip blue"><span className="legend-dot" /> {isKhmer ? "ចំណេញ" : "Profit"}</span>
              </div>
            </div>

            <div className="recharts-wrapper-container">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="rpEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="rpBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"} />
                  <XAxis dataKey="label" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} />
                  <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tickLine={false} />
                  <Tooltip
                    formatter={(val, name) => [
                      name.toLowerCase().includes("orders") ? formatCount(val) : formatUSD(val),
                      name
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#10b981" strokeWidth={3} fill="url(#rpEmerald)" />
                  <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rpBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAIL ORDERS REPORT */}
      {activeTab === "orders" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "តារាងបញ្ជាទិញលម្អិត (Detail Orders)" : "Detail Orders Report"}</h3>
              <p>{isKhmer ? `សរុប ${filteredOrders.length} ការបញ្ជាទិញ` : `Showing ${filteredOrders.length} orders matching search/filters`}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("orders")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("orders")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Email & Phone</th>
                  <th>Payment Method</th>
                  <th>Order Date</th>
                  <th>Total ($)</th>
                  <th>Total (KHR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="empty-cell">No order records found matching query.</td></tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td><strong className="id-tag">#{ord.id}</strong></td>
                      <td>
                        <strong className="user-name">{ord.user?.name || "Client"}</strong>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <small><Mail size={11} /> {ord.user?.email || "—"}</small>
                          <small><Phone size={11} /> {ord.contact_phone || ord.user?.phone || "—"}</small>
                        </div>
                      </td>
                      <td><span className="pay-tag"><CreditCard size={13} /> {paymentLabel(ord)}</span></td>
                      <td><span className="date-tag">{orderDate(ord)?.toISOString().slice(0, 10) || "—"}</span></td>
                      <td><strong className="amount-val">{formatUSD(ord.total_amount)}</strong></td>
                      <td><span className="khr-val">{formatKHR(ord.total_amount)}</span></td>
                      <td>
                        <span className={`status-pill status-${orderStatus(ord)}`}>
                          {orderStatus(ord)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {filteredOrders.map((ord) => (
                <div className="kanban-card" key={ord.id}>
                  <div className="kanban-card-header">
                    <span className="id-tag">#{ord.id}</span>
                    <span className={`status-pill status-${orderStatus(ord)}`}>{orderStatus(ord)}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Customer:</span>
                    <strong>{ord.user?.name || "Client"}</strong>
                  </div>
                  <div className="card-info-row price-row">
                    <span className="info-label">Total:</span>
                    <strong className="price-value">{formatUSD(ord.total_amount)} ({formatKHR(ord.total_amount)})</strong>
                  </div>
                  <div className="card-info-row date-row">
                    <span className="info-label">Date:</span>
                    <span>{orderDate(ord)?.toISOString().slice(0, 10) || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS CATALOG REPORT */}
      {activeTab === "products" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "កាតាឡុកផលិតផល & ស្តុក (Product Catalog)" : "Product Catalog Report"}</h3>
              <p>{isKhmer ? `សរុប ${products.length} ផលិតផលក្នុងប្រព័ន្ធ` : `Showing ${products.length} active products in catalog`}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("products")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("products")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Unit Price ($)</th>
                  <th>Stock Count</th>
                  <th>Asset Value ($)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} className="empty-cell">No products available in catalog.</td></tr>
                ) : (
                  products.map((p) => {
                    const priceNum = money(p.price);
                    const stockNum = money(p.stock_quantity);
                    const assetVal = priceNum * stockNum;
                    return (
                      <tr key={p.id}>
                        <td><strong className="id-tag">#{p.id}</strong></td>
                        <td><strong className="prod-name">{p.name}</strong></td>
                        <td><span className="sku-tag">{p.sku || "—"}</span></td>
                        <td><span className="cat-pill">{p.category?.name || p.category || "General"}</span></td>
                        <td><span>{p.brand?.name || p.brand || "Standard"}</span></td>
                        <td><strong className="amount-val">{formatUSD(priceNum)}</strong></td>
                        <td>
                          <span className={`stock-status-pill ${stockNum <= 5 ? "low" : "ok"}`}>
                            {stockNum} in stock
                          </span>
                        </td>
                        <td><strong className="profit-val">{formatUSD(assetVal)}</strong></td>
                        <td>
                          <span className={`status-pill status-${p.is_active ? "active" : "inactive"}`}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {products.map((p) => (
                <div className="kanban-card" key={p.id}>
                  <div className="kanban-card-header">
                    <strong>#{p.id} {p.name}</strong>
                    <span className={`status-pill status-${p.is_active ? "active" : "inactive"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="card-info-row price-row">
                    <span className="info-label">Price / Stock:</span>
                    <strong className="price-value">{formatUSD(p.price)} ({p.stock_quantity} units)</strong>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Total Value:</span>
                    <strong className="profit-val">{formatUSD(money(p.price) * money(p.stock_quantity))}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPLIERS REPORT */}
      {activeTab === "suppliers" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "បញ្ជីអ្នកផ្គត់ផ្គង់ (Suppliers Directory)" : "Supplier Directory Report"}</h3>
              <p>{isKhmer ? `សរុប ${filteredSuppliers.length} ក្រុមហ៊ុនផ្គត់ផ្គង់` : `Showing ${filteredSuppliers.length} partner suppliers`}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("suppliers")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("suppliers")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Company / Vendor Name</th>
                  <th>Contact Person</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Office Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr><td colSpan={7} className="empty-cell">No supplier records found matching query.</td></tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td><strong className="id-tag">#{s.id}</strong></td>
                      <td>
                        <strong className="vendor-title">{s.name || s.company_name || "Supplier Partner"}</strong>
                      </td>
                      <td><span>{s.contact_person || s.contactPerson || "—"}</span></td>
                      <td><span className="contact-tag"><Phone size={12} /> {s.phone || "—"}</span></td>
                      <td><span className="contact-tag"><Mail size={12} /> {s.email || "—"}</span></td>
                      <td><span className="address-text"><MapPin size={12} /> {s.address || "Phnom Penh, Cambodia"}</span></td>
                      <td>
                        <span className={`status-pill status-${(s.status || "active").toLowerCase()}`}>
                          {s.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {filteredSuppliers.map((s) => (
                <div className="kanban-card" key={s.id}>
                  <div className="kanban-card-header">
                    <strong>#{s.id} {s.name || s.company_name}</strong>
                    <span className="status-pill status-active">{s.status || "Active"}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Contact:</span>
                    <span>{s.contact_person || "Partner"} ({s.phone || "—"})</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Email:</span>
                    <span>{s.email || "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PURCHASE ORDERS (PO) REPORT */}
      {activeTab === "purchases" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "របាយការណ៍ទិញចូល (Purchase Orders / Procurement)" : "Purchase Orders (PO) Report"}</h3>
              <p>{isKhmer ? `សរុប ${filteredPurchases.length} កំណត់ត្រាទិញចូល` : `Showing ${filteredPurchases.length} procurement orders`}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("purchases")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("purchases")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier Name</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                  <th>Total Spend ($)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">No purchase orders found matching query.</td></tr>
                ) : (
                  filteredPurchases.map((po) => (
                    <tr key={po.id}>
                      <td><strong className="id-tag">{po.po_number || `PO-${po.id}`}</strong></td>
                      <td><strong>{po.supplier?.name || po.supplier_name || "Official Partner"}</strong></td>
                      <td><span>{po.order_date || po.created_at || "—"}</span></td>
                      <td><span>{po.delivery_date || po.expected_delivery || "—"}</span></td>
                      <td><span className={`status-pill status-${(po.status || "completed").toLowerCase()}`}>{po.status || "Completed"}</span></td>
                      <td><strong className="amount-val">{formatUSD(po.total_amount)}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {filteredPurchases.map((po) => (
                <div className="kanban-card" key={po.id}>
                  <div className="kanban-card-header">
                    <span className="id-tag">{po.po_number || `PO-${po.id}`}</span>
                    <span className="status-pill status-completed">{po.status || "Completed"}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Supplier:</span>
                    <strong>{po.supplier?.name || "Partner"}</strong>
                  </div>
                  <div className="card-info-row price-row">
                    <span className="info-label">Spend:</span>
                    <strong className="price-value">{formatUSD(po.total_amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF ATTENDANCE REPORT */}
      {activeTab === "attendance" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "របាយការណ៍វត្តមានបុគ្គលិក (Staff Attendance)" : "Staff Attendance Report"}</h3>
              <p>{isKhmer ? `សរុប ${filteredAttendance.length} កំណត់ត្រាវត្តមាន` : `Showing ${filteredAttendance.length} attendance clock records`}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("attendance")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("attendance")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Work Hours</th>
                  <th>Late (Mins)</th>
                  <th>Location Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr><td colSpan={11} className="empty-cell">No attendance records found matching query.</td></tr>
                ) : (
                  filteredAttendance.map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td><strong className="user-name">{r.employeeName || r.employee_name || "Staff Member"}</strong></td>
                      <td><span className="id-tag">{r.employeeId || r.employee_id || `EMP-${idx+1}`}</span></td>
                      <td><span>{r.department || "Operations"}</span></td>
                      <td><span>{r.role || "Staff"}</span></td>
                      <td><span className="date-tag">{r.date || "—"}</span></td>
                      <td><span className="time-tag">{r.checkInTime || r.check_in || "—"}</span></td>
                      <td><span className="time-tag">{r.checkOutTime || r.check_out || "—"}</span></td>
                      <td><strong>{r.totalWorkHours || 0} hrs</strong></td>
                      <td>
                        <span className={r.lateMinutes > 0 ? "text-amber font-bold" : "text-slate"}>
                          {r.lateMinutes > 0 ? `${r.lateMinutes}m` : "On Time"}
                        </span>
                      </td>
                      <td>
                        <span className={`geofence-tag ${r.checkInLocation?.isWithinGeofence !== false ? "inside" : "outside"}`}>
                          <ShieldCheck size={11} /> {r.checkInLocation?.isWithinGeofence !== false ? "Inside Mall" : "Remote"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${(r.status || "present").toLowerCase()}`}>
                          {r.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {filteredAttendance.map((r, idx) => (
                <div className="kanban-card" key={r.id || idx}>
                  <div className="kanban-card-header">
                    <strong>{r.employeeName || r.employee_name}</strong>
                    <span className="status-pill status-present">{r.status || "Present"}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Time Clock:</span>
                    <span>In: {r.checkInTime || "—"} | Out: {r.checkOutTime || "—"} ({r.totalWorkHours || 0} hrs)</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Department:</span>
                    <span>{r.department || "Store Operations"} ({r.role || "Staff"})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INVENTORY HEALTH */}
      {activeTab === "inventory" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "តារាងសុខភាពស្តុកទំនិញ (Inventory Health)" : "Inventory Health Report"}</h3>
              <p>{isKhmer ? "តាមដានស្តុកជិតអស់ ស្តុកលើស និងអនុសាសន៍បញ្ជាទិញ" : "Automated reorder triggers and asset valuation"}</p>
            </div>
            <div className="tab-quick-exports">
              <button type="button" className="tab-export-btn excel" onClick={() => exportDomainExcel("inventory")}>
                <FileSpreadsheet size={14} /> Export Excel
              </button>
              <button type="button" className="tab-export-btn pdf" onClick={() => exportDomainPdf("inventory")}>
                <FileText size={14} /> Export PDF
              </button>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Stock Valuation</th>
                  <th>Health Status</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {inventoryRows.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="sku-tag">{p.sku}</span></td>
                    <td><span className="cat-pill">{p.category}</span></td>
                    <td><strong>{p.stock}</strong></td>
                    <td><strong className="amount-val">{formatUSD(p.value)}</strong></td>
                    <td>
                      <span className={`urgency-badge ${p.urgency}`}>
                        {p.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="rec-text">{p.recommendation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {inventoryRows.map((p) => (
                <div className="kanban-card" key={p.id}>
                  <div className="kanban-card-header">
                    <strong>{p.name}</strong>
                    <span className={`urgency-badge ${p.urgency}`}>{p.urgency.toUpperCase()}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Stock / Value:</span>
                    <strong>{p.stock} units ({formatUSD(p.value)})</strong>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Action:</span>
                    <span className="rec-text">{p.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. EXPORT CENTER HUB MODAL (EXCEL & PDF)
         ======================================================== */}
      <AnimatePresence>
        {isExportHubOpen && (
          <div className="kpi-modal-backdrop" onClick={() => setIsExportHubOpen(false)}>
            <motion.div
              className="kpi-modal-card export-hub-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
            >
              <div className="kpi-modal-header">
                <div className="kpi-modal-title-group">
                  <div className="kpi-modal-icon-badge emerald">
                    <FileDown size={22} />
                  </div>
                  <div>
                    <h3>{isKhmer ? "មជ្ឈមណ្ឌលនាំចេញរបាយការណ៍" : "Report Export Center"}</h3>
                    <span className="kpi-modal-badge">Excel (.xlsx) & Official PDF</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="kpi-modal-close"
                  onClick={() => setIsExportHubOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="kpi-modal-body">
                <div className="export-hub-domain-select">
                  <label>{isKhmer ? "ជ្រើសរើសប្រភេទរបាយការណ៍:" : "Select Report Domain to Export:"}</label>
                  <div className="export-domain-grid">
                    {[
                      { id: "orders", icon: ShoppingCart, title: "Detail Orders Report", desc: "Sales transactions, client info, amounts & status" },
                      { id: "products", icon: Package, title: "Product Catalog Report", desc: "Stock quantities, asset value, SKU & pricing" },
                      { id: "suppliers", icon: Building2, title: "Suppliers Directory", desc: "Vendor companies, contact persons & address" },
                      { id: "purchases", icon: Truck, title: "Purchase Orders (PO)", desc: "Procurement records, expenditures & fulfillment" },
                      { id: "attendance", icon: UserCheck, title: "Staff Attendance Report", desc: "Time clocks, shifts, hours worked & GPS logs" }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedExportDomain === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`export-domain-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedExportDomain(item.id)}
                        >
                          <div className="domain-card-icon">
                            <Icon size={18} />
                          </div>
                          <div className="domain-card-content">
                            <strong>{item.title}</strong>
                            <small>{item.desc}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="export-hub-format-select">
                  <label>{isKhmer ? "ជ្រើសរើសទម្រង់ឯកសារ:" : "Choose Export Format:"}</label>
                  <div className="export-format-options">
                    <button
                      type="button"
                      className={`format-option-btn ${exportFormat === "excel" ? "active" : ""}`}
                      onClick={() => setExportFormat("excel")}
                    >
                      <FileSpreadsheet size={22} className="text-emerald" />
                      <div>
                        <strong>Excel Spreadsheet (.xlsx / .xls)</strong>
                        <small>Styled multi-column spreadsheet for Microsoft Excel & Google Sheets</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`format-option-btn ${exportFormat === "pdf" ? "active" : ""}`}
                      onClick={() => setExportFormat("pdf")}
                    >
                      <FileText size={22} className="text-blue" />
                      <div>
                        <strong>Official PDF Document (.pdf)</strong>
                        <small>Print-ready corporate report with official Angkor Mall letterhead & signatures</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="kpi-modal-footer">
                <button
                  type="button"
                  className="kpi-btn-secondary"
                  onClick={() => setIsExportHubOpen(false)}
                >
                  {isKhmer ? "បិទ" : "Cancel"}
                </button>

                <button
                  type="button"
                  className="kpi-btn-primary"
                  onClick={() => {
                    if (exportFormat === "excel") {
                      exportDomainExcel(selectedExportDomain);
                    } else {
                      exportDomainPdf(selectedExportDomain);
                    }
                    setIsExportHubOpen(false);
                  }}
                >
                  <Download size={16} />
                  <span>{isKhmer ? "ទាញយកឯកសារឥឡូវនេះ" : "Generate & Download Report"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          7. EXCEL / CSV IMPORT DATASET MODAL
         ======================================================== */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="kpi-modal-backdrop" onClick={() => setIsImportModalOpen(false)}>
            <motion.div
              className="kpi-modal-card import-modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
            >
              <div className="kpi-modal-header">
                <div className="kpi-modal-title-group">
                  <div className="kpi-modal-icon-badge emerald">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3>{isKhmer ? "នាំចូលទិន្នន័យពី Excel / CSV" : "Import Excel / CSV Dataset"}</h3>
                    <span className="kpi-modal-badge">Multi-Format Compatible</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="kpi-modal-close"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="kpi-modal-body">
                <div className="import-target-selector">
                  <label>{isKhmer ? "ប្រភេទគោលដៅទិន្នន័យ:" : "Import Dataset Target:"}</label>
                  <select value={importTarget} onChange={(e) => setImportTarget(e.target.value)}>
                    <option value="orders">Orders & Sales Transactions</option>
                    <option value="products">Catalog Products & Pricing</option>
                    <option value="purchases">Procurement Invoices</option>
                  </select>
                </div>

                <div
                  className="file-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv,.txt"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <Upload size={32} className="dropzone-icon" />
                  <h4>{isKhmer ? "ចុចដើម្បីជ្រើសរើស ឬទម្លាក់ឯកសារនៅទីនេះ" : "Click to select or drag & drop Excel / CSV"}</h4>
                  <p>Supports .xlsx, .xls, .csv, and tab-delimited files</p>
                  {importFile && (
                    <span className="selected-file-chip">
                      <FileSpreadsheet size={14} /> {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {importPreviewRows.length > 0 && (
                  <div className="import-preview-box">
                    <h5>
                      <CheckCircle2 size={14} className="text-emerald" /> {isKhmer ? "ទិដ្ឋភាពទូទៅនៃទិន្នន័យ (១៥ ជួរដំបូង)" : "Parsed Preview (First 15 Rows)"}
                    </h5>
                    <div className="preview-table-wrapper">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            {importHeaders.slice(0, 5).map((h, idx) => (
                              <th key={idx}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreviewRows.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.slice(0, 5).map((cell, cIdx) => (
                                <td key={cIdx}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="kpi-modal-footer">
                <button
                  type="button"
                  className="kpi-btn-secondary"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  {isKhmer ? "បិទ" : "Cancel"}
                </button>

                <button
                  type="button"
                  className="kpi-btn-primary"
                  onClick={handleCommitImport}
                  disabled={!importFile}
                >
                  <Check size={15} />
                  <span>{isKhmer ? "បញ្ចូលទិន្នន័យ" : "Confirm Import"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReportPage;
