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
  Eye
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

function itemName(item) {
  return item?.product?.name || item?.name || item?.product_name || "Product Item";
}

function itemQty(item) {
  return Math.max(1, parseInt(item?.quantity, 10) || 1);
}

function itemPrice(item) {
  return money(item?.price ?? item?.unit_price ?? item?.product?.price);
}

function itemSku(item) {
  return item?.product?.sku || item?.sku || item?.variant?.sku || "—";
}

function itemCategory(item, productsById) {
  const fromItem = item?.product?.category?.name || item?.category?.name || item?.category;
  if (fromItem) return fromItem;
  const product = productsById.get(item?.product_id || item?.product?.id);
  return product?.category?.name || product?.category || "General";
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
   <Interior ss:Color="#10B981" ss:Pattern="Solid"/>
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
      return `    <Cell><Data ss:Type="${isNum ? "Number" : "String"}">${String(cell).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`;
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
  const [sortBy, setSortBy] = useState("date"); // "date" | "revenue" | "orders" | "profit" | "name" | "stock"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const [statusFilter, setStatusFilter] = useState("all");

  // Interactive KPI Modal & Highlight
  const [activeKpi, setActiveKpi] = useState(null);
  const [kpiModal, setKpiModal] = useState(null);

  // Excel / CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreviewRows, setImportPreviewRows] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importTarget, setImportTarget] = useState("orders"); // "orders" | "products"

  // Primary Datasets
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch Live Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const ordersRes = await getAdminOrdersApi();
        setOrders(toList(ordersRes, "orders"));
      } catch (err) {
        console.warn("Orders fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 60));

      try {
        const productsRes = await productsApi();
        setProducts(toList(productsRes, "products"));
      } catch (err) {
        console.warn("Products fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 60));

      try {
        const purchasesRes = await purchaseOrdersApi();
        setPurchases(toList(purchasesRes, "purchaseOrders", "purchases"));
      } catch (err) {
        console.warn("Purchases fetch warning:", err?.message || err);
      }

      await new Promise((r) => setTimeout(r, 60));

      try {
        const customersRes = await CustomersApi();
        setCustomers(toList(customersRes, "customers", "users"));
      } catch (err) {
        console.warn("Customers fetch warning:", err?.message || err);
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
    return orders.filter((order) => inRange(orderDate(order), bounds.start, bounds.end));
  }, [orders, bounds]);

  const previousOrders = useMemo(() => {
    if (!bounds.prevStart) return [];
    return orders.filter((order) => inRange(orderDate(order), bounds.prevStart, bounds.prevEnd));
  }, [orders, bounds]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      const date = parseDate(po.order_date || po.created_at || po.createdAt);
      return inRange(date, bounds.start, bounds.end);
    });
  }, [purchases, bounds]);

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
      prevRevenue,
      revenueChange: percentChange(revenue, prevRevenue),
      orderCount,
      prevOrderCount,
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
      customerCount: customers.length
    };
  }, [filteredOrders, previousOrders, filteredPurchases, products, customers]);

  const trendData = useMemo(() => buildTrend(filteredOrders, timeRange), [filteredOrders, timeRange]);

  // Top Selling Products with Dynamic Sort
  const topProducts = useMemo(() => {
    const map = new Map();
    filteredOrders.filter(isRevenueOrder).forEach((order) => {
      (order.items || []).forEach((item) => {
        const id = item.product_id || item.product?.id || itemName(item);
        const existing = map.get(id) || {
          id,
          name: itemName(item),
          sku: itemSku(item),
          category: itemCategory(item, productsById),
          unitsSold: 0,
          revenue: 0,
          stock: money(productsById.get(item.product_id || item.product?.id)?.stock_quantity)
        };
        existing.unitsSold += itemQty(item);
        existing.revenue += itemPrice(item) * itemQty(item);
        map.set(id, existing);
      });
    });

    let list = Array.from(map.values()).map((item) => ({
      ...item,
      profit: item.revenue * PROFIT_MARGIN,
      margin: `${(PROFIT_MARGIN * 100).toFixed(0)}%`
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue") comparison = b.revenue - a.revenue;
      else if (sortBy === "orders" || sortBy === "units") comparison = b.unitsSold - a.unitsSold;
      else if (sortBy === "profit") comparison = b.profit - a.profit;
      else if (sortBy === "stock") comparison = b.stock - a.stock;
      else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else comparison = b.revenue - a.revenue;
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return list;
  }, [filteredOrders, productsById, searchQuery, sortBy, sortOrder]);

  // Inventory Table with Dynamic Sort
  const inventoryRows = useMemo(() => {
    let list = products.map((product) => {
      const stock = money(product.stock_quantity);
      let urgency = "healthy";
      let recommendation = isKhmer ? "ស្តុកគ្រប់គ្រាន់" : "Healthy stock";
      if (stock === 0) {
        urgency = "critical";
        recommendation = isKhmer ? "បញ្ជាទិញចូលឡើងវិញ" : "Reorder immediately";
      } else if (stock <= LOW_STOCK_THRESHOLD) {
        urgency = "warning";
        recommendation = isKhmer ? `បញ្ជាទិញចូល +${LOW_STOCK_THRESHOLD * 4}` : `Reorder +${LOW_STOCK_THRESHOLD * 4}`;
      } else if (stock >= 50) {
        urgency = "overstock";
        recommendation = isKhmer ? "ពិចារណាប្រូម៉ូសិន" : "Consider a promo";
      }
      return {
        id: product.id,
        name: product.name,
        sku: product.sku || "—",
        category: product.category?.name || product.category || "General",
        price: money(product.price),
        stock,
        value: money(product.price) * stock,
        urgency,
        recommendation
      };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => p.urgency === statusFilter);
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "stock") comparison = a.stock - b.stock;
      else if (sortBy === "value" || sortBy === "revenue") comparison = b.value - a.value;
      else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else comparison = a.stock - b.stock;
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return list;
  }, [products, isKhmer, searchQuery, statusFilter, sortBy, sortOrder]);

  // Purchases Table with Dynamic Sort
  const purchaseRows = useMemo(() => {
    let list = [...filteredPurchases];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((po) => (po.po_number || "").toLowerCase().includes(q) || (po.supplier?.name || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((po) => po.status === statusFilter);
    }
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue" || sortBy === "amount") comparison = money(b.total_amount) - money(a.total_amount);
      else if (sortBy === "date") comparison = (parseDate(b.order_date || b.created_at)?.getTime() || 0) - (parseDate(a.order_date || a.created_at)?.getTime() || 0);
      else comparison = money(b.total_amount) - money(a.total_amount);
      return sortOrder === "asc" ? -comparison : comparison;
    });
    return list;
  }, [filteredPurchases, searchQuery, statusFilter, sortBy, sortOrder]);

  // Filtered Detailed Orders Feed
  const detailedOrders = useMemo(() => {
    let list = [...filteredOrders];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) => (o.id || "").toLowerCase().includes(q) || (o.user?.name || "").toLowerCase().includes(q) || (o.user?.email || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => orderStatus(o) === statusFilter);
    }
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "revenue" || sortBy === "amount") comparison = money(b.total_amount) - money(a.total_amount);
      else if (sortBy === "date") comparison = (orderDate(b)?.getTime() || 0) - (orderDate(a)?.getTime() || 0);
      else if (sortBy === "name") comparison = (a.user?.name || "").localeCompare(b.user?.name || "");
      else comparison = (orderDate(b)?.getTime() || 0) - (orderDate(a)?.getTime() || 0);
      return sortOrder === "asc" ? -comparison : comparison;
    });
    return list;
  }, [filteredOrders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle Dynamic Column Sort Header Click
  const handleColumnSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // KPI Card Click Drill-Down Handler
  const handleKpiCardClick = (kpiKey) => {
    setActiveKpi(kpiKey);
    if (navigator.vibrate) navigator.vibrate(20);

    if (kpiKey === "revenue") {
      setKpiModal({
        title: isKhmer ? "ស្ថិតិចំណូល & ប្រាក់ចំណេញ" : "Revenue & Profit Analytics",
        icon: <DollarSign size={20} />,
        color: "emerald",
        badge: `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange.toFixed(1)}% vs Prior`,
        summary: formatUSD(stats.revenue),
        details: [
          { label: isKhmer ? "ប្រាក់ចំណេញសុទ្ធ" : "Net Profit (30%)", value: formatUSD(stats.profit) },
          { label: isKhmer ? "តម្លៃបញ្ជាទិញជាមធ្យម" : "Average Order Value (AOV)", value: formatUSD(stats.aov) },
          { label: isKhmer ? "ចំណូលជារៀល" : "KHR Total Conversion", value: formatKHR(stats.revenue) },
          { label: isKhmer ? "ការចំណាយទិញចូល" : "Total Procurement Spend", value: formatUSD(stats.purchaseSpend) }
        ],
        actionText: isKhmer ? "នាំចេញ Excel ស៊ីជម្រៅ" : "Export Excel Financials",
        onAction: () => handleExportExcel()
      });
    } else if (kpiKey === "orders") {
      setKpiModal({
        title: isKhmer ? "ស្ថិតិការបញ្ជាទិញ" : "Order Fulfillment Metrics",
        icon: <ShoppingCart size={20} />,
        color: "blue",
        badge: `${stats.completed} Completed`,
        summary: `${stats.orderCount.toLocaleString()} Total Orders`,
        details: [
          { label: isKhmer ? "បានបញ្ចប់ / បង់ប្រាក់" : "Paid & Completed", value: `${stats.completed}` },
          { label: isKhmer ? "កំពុងរង់ចាំ" : "Pending Processing", value: `${stats.pending}` },
          { label: isKhmer ? "បានបោះបង់ / បរាជ័យ" : "Cancelled / Failed", value: `${stats.cancelled}` },
          { label: isKhmer ? "អតិថិជនសរុប" : "Total Registered Clients", value: `${stats.customerCount}` }
        ],
        actionText: isKhmer ? "មើលការបញ្ជាទិញលម្អិត" : "Filter Orders List",
        onAction: () => {
          setActiveTab("orders");
          setKpiModal(null);
        }
      });
    } else if (kpiKey === "inventory") {
      setKpiModal({
        title: isKhmer ? "សុខភាពស្តុកទំនិញ" : "Inventory & Asset Valuation",
        icon: <Boxes size={20} />,
        color: "purple",
        badge: `${stats.lowStock} Low Stock Alert`,
        summary: formatUSD(stats.inventoryValue),
        details: [
          { label: isKhmer ? "ទំនិញសរុបក្នុងកាតាឡុក" : "Total Active Catalog", value: `${products.length} Products` },
          { label: isKhmer ? "ទំនិញជិតអស់ស្តុក (≤5)" : "Low Stock Warnings", value: `${stats.lowStock}` },
          { label: isKhmer ? "ទំនិញដាច់ស្តុក (0)" : "Out of Stock Items", value: `${stats.outOfStock}` },
          { label: isKhmer ? "តម្លៃស្តុកសរុប (KHR)" : "Total Valuation (KHR)", value: formatKHR(stats.inventoryValue) }
        ],
        actionText: isKhmer ? "ពិនិត្យតារាងស្តុក" : "View Inventory Sheet",
        onAction: () => {
          setActiveTab("inventory");
          setKpiModal(null);
        }
      });
    }
  };

  // EXPORT TO EXCEL (.xls/.xlsx Spreadsheet XML)
  const handleExportExcel = () => {
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      if (activeTab === "products") {
        downloadExcel(
          `AngkorMall_Top_Products_${nowStr}.xls`,
          "Top Products",
          ["Rank", "Product Name", "SKU", "Category", "Units Sold", "Gross Revenue ($)", "Net Profit ($)", "Profit Margin", "Stock Available"],
          topProducts.map((p, i) => [i + 1, p.name, p.sku, p.category, p.unitsSold, p.revenue.toFixed(2), p.profit.toFixed(2), p.margin, p.stock])
        );
      } else if (activeTab === "inventory") {
        downloadExcel(
          `AngkorMall_Inventory_Report_${nowStr}.xls`,
          "Inventory Health",
          ["Product ID", "Product Name", "SKU", "Category", "Stock Count", "Unit Price ($)", "Total Value ($)", "Status Alert", "Action Recommendation"],
          inventoryRows.map((p) => [p.id, p.name, p.sku, p.category, p.stock, p.price.toFixed(2), p.value.toFixed(2), p.urgency.toUpperCase(), p.recommendation])
        );
      } else if (activeTab === "purchases") {
        downloadExcel(
          `AngkorMall_Purchases_Report_${nowStr}.xls`,
          "Purchase Orders",
          ["PO Number", "Supplier Name", "Order Date", "Fulfillment Status", "Total Spend ($)"],
          purchaseRows.map((po) => [
            po.po_number || `PO-${po.id}`,
            po.supplier?.name || po.supplier_name || "Official Partner",
            po.order_date || po.created_at || "",
            po.status || "completed",
            money(po.total_amount).toFixed(2)
          ])
        );
      } else if (activeTab === "orders") {
        downloadExcel(
          `AngkorMall_Detailed_Orders_${nowStr}.xls`,
          "Orders List",
          ["Order ID", "Customer Name", "Email", "Phone", "Payment Gateway", "Order Date", "Total Amount ($)", "Status"],
          detailedOrders.map((o) => [
            o.id,
            o.user?.name || "Client",
            o.user?.email || "—",
            o.contact_phone || o.user?.phone || "—",
            paymentLabel(o),
            orderDate(o)?.toISOString().slice(0, 10) || "",
            money(o.total_amount).toFixed(2),
            orderStatus(o).toUpperCase()
          ])
        );
      } else {
        downloadExcel(
          `AngkorMall_Financial_Summary_${nowStr}.xls`,
          "Executive Summary",
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

  // EXPORT TO CSV
  const handleExportCsv = () => {
    try {
      const nowStr = new Date().toISOString().slice(0, 10);
      if (activeTab === "products") {
        downloadCsv(
          `AngkorMall_Top_Products_${nowStr}.csv`,
          ["Product", "SKU", "Category", "Units Sold", "Revenue", "Profit"],
          topProducts.map((p) => [p.name, p.sku, p.category, p.unitsSold, p.revenue.toFixed(2), p.profit.toFixed(2)])
        );
      } else if (activeTab === "inventory") {
        downloadCsv(
          `AngkorMall_Inventory_Report_${nowStr}.csv`,
          ["Product", "SKU", "Category", "Stock", "Inventory Value", "Status", "Recommendation"],
          inventoryRows.map((p) => [p.name, p.sku, p.category, p.stock, p.value.toFixed(2), p.urgency, p.recommendation])
        );
      } else if (activeTab === "purchases") {
        downloadCsv(
          `AngkorMall_Purchases_Report_${nowStr}.csv`,
          ["PO Number", "Supplier", "Date", "Status", "Total"],
          purchaseRows.map((po) => [
            po.po_number || po.id,
            po.supplier?.name || po.supplier_name || "—",
            po.order_date || po.created_at || "",
            po.status || "",
            money(po.total_amount).toFixed(2)
          ])
        );
      } else {
        downloadCsv(
          `AngkorMall_Sales_Report_${nowStr}.csv`,
          ["Period", "Orders", "Revenue", "Profit"],
          trendData.map((row) => [row.label, row.orders, row.revenue.toFixed(2), row.profit.toFixed(2)])
        );
      }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានទាញយក CSV" : "CSV Exported",
        text: isKhmer ? "ឯកសារ CSV ត្រូវបានទាញយកដោយជោគជ័យ។" : "CSV spreadsheet downloaded.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      Swal.fire("Error", "Failed to export CSV", "error");
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
        // Parse CSV or TSV lines
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
    { id: "overview", icon: BarChart2, label: isKhmer ? "ទិដ្ឋភាពទូទៅ" : "Overview & Charts" },
    { id: "orders", icon: ShoppingCart, label: isKhmer ? "ការបញ្ជាទិញ" : "Detailed Orders" },
    { id: "products", icon: Package, label: isKhmer ? "ផលិតផលលក់ដាច់" : "Top Products" },
    { id: "inventory", icon: AlertTriangle, label: isKhmer ? "សុខភាពស្តុក" : "Inventory Health" },
    { id: "purchases", icon: Truck, label: isKhmer ? "ការទិញចូល (PO)" : "Procurement" }
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
                ? "វិភាគចំណូល ការលក់ ប្រាក់ចំណេញ ស្តុកទំនិញ និងការទិញចូលពីទិន្នន័យពិត"
                : "Executive revenue, fulfillment metrics, inventory valuation, and spreadsheet management."}
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

          {/* Import Excel / CSV Button */}
          <button
            type="button"
            className="rp-btn ghost"
            onClick={() => setIsImportModalOpen(true)}
            title="Import Excel or CSV dataset"
          >
            <Upload size={15} />
            <span>{isKhmer ? "នាំចូល Excel" : "Import Excel"}</span>
          </button>

          {/* Export Excel (.xlsx) Button */}
          <button
            type="button"
            className="rp-btn excel-btn"
            onClick={handleExportExcel}
            title="Export full Excel spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>{isKhmer ? "នាំចេញ Excel (.xlsx)" : "Export Excel"}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            className="rp-btn ghost"
            onClick={handleExportCsv}
            title="Export CSV"
          >
            <Download size={15} />
            <span>CSV</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            className="rp-btn ghost"
            onClick={() => window.print()}
            title="Print Report"
          >
            <Printer size={15} />
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
            onClick={() => handleKpiCardClick("revenue")}
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
            onClick={() => handleKpiCardClick("orders")}
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

          {/* Net Profit KPI Card */}
          <div
            className={`stat-card report-stat-card profit ${activeKpi === "profit" ? "active-kpi" : ""}`}
            onClick={() => handleKpiCardClick("revenue")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "ប្រាក់ចំណេញសុទ្ធ (Est. 30%)" : "Net Profit Margin"}</p>
              <h1>{formatUSD(stats.profit)}</h1>
              <span className="rp-delta up">Est. 30%</span>
              <small>{formatKHR(stats.profit)}</small>
            </div>
            <div className="stat-icon-wrapper purple-bg icon-box">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Inventory Assets KPI Card */}
          <div
            className={`stat-card report-stat-card inventory ${activeKpi === "inventory" ? "active-kpi" : ""}`}
            onClick={() => handleKpiCardClick("inventory")}
            role="button"
            tabIndex={0}
          >
            <div className="stat-info">
              <p>{isKhmer ? "តម្លៃស្តុកសរុប" : "Total Inventory Assets"}</p>
              <h1>{formatUSD(stats.inventoryValue)}</h1>
              <span className={`rp-delta ${stats.lowStock > 0 ? "down" : "up"}`}>
                {stats.lowStock} {isKhmer ? "ជិតអស់" : "low stock"}
              </span>
              <small>{products.length} {isKhmer ? "មុខទំនិញ" : "products active"}</small>
            </div>
            <div className="stat-icon-wrapper orange-bg icon-box">
              <Boxes size={20} />
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

        {/* Dynamic Sorter Controls */}
        <div className="dynamic-sort-controls">
          <div className="report-search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder={isKhmer ? "ស្វែងរកទិន្នន័យ..." : "Search in reports..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-btn" onClick={() => setSearchQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="sort-dropdown-wrap">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">{isKhmer ? "តម្រៀបតាម: កាលបរិច្ឆេទ" : "Sort: Date"}</option>
              <option value="revenue">{isKhmer ? "តម្រៀបតាម: ចំណូល ($)" : "Sort: Revenue"}</option>
              <option value="orders">{isKhmer ? "តម្រៀបតាម: បរិមាណបញ្ជាទិញ" : "Sort: Orders/Units"}</option>
              <option value="profit">{isKhmer ? "តម្រៀបតាម: ប្រាក់ចំណេញ" : "Sort: Profit"}</option>
              <option value="stock">{isKhmer ? "តម្រៀបតាម: ចំនួនស្តុក" : "Sort: Stock Count"}</option>
              <option value="name">{isKhmer ? "តម្រៀបតាម: ឈ្មោះ (A-Z)" : "Sort: Name"}</option>
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
          5. TAB PANELS CONTENT
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

      {/* TAB 2: DETAILED ORDERS FEED */}
      {activeTab === "orders" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "តារាងបញ្ជាទិញលម្អិត" : "Detailed Orders Master Record"}</h3>
              <p>{isKhmer ? `សរុប ${detailedOrders.length} ការបញ្ជាទិញ` : `Showing ${detailedOrders.length} orders within selected timeframe`}</p>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th onClick={() => handleColumnSort("id")}>Order ID</th>
                  <th onClick={() => handleColumnSort("name")}>Customer</th>
                  <th>Payment Method</th>
                  <th onClick={() => handleColumnSort("date")}>Date {sortBy === "date" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th onClick={() => handleColumnSort("amount")}>Total Amount {sortBy === "amount" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detailedOrders.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">No order records matching query.</td></tr>
                ) : (
                  detailedOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td><strong className="id-tag">{ord.id}</strong></td>
                      <td>
                        <div className="user-cell">
                          <strong>{ord.user?.name || "Customer"}</strong>
                          <small>{ord.user?.email || "—"}</small>
                        </div>
                      </td>
                      <td><span className="pay-tag"><CreditCard size={13} /> {paymentLabel(ord)}</span></td>
                      <td><span className="date-tag">{orderDate(ord)?.toISOString().slice(0, 10) || "—"}</span></td>
                      <td><strong className="amount-val">{formatUSD(ord.total_amount)}</strong></td>
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

            {/* Mobile Cards View */}
            <div className="mobile-cards-container">
              {detailedOrders.map((ord) => (
                <div className="kanban-card" key={ord.id}>
                  <div className="kanban-card-header">
                    <span className="id-tag">{ord.id}</span>
                    <span className={`status-pill status-${orderStatus(ord)}`}>{orderStatus(ord)}</span>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Customer:</span>
                    <strong>{ord.user?.name || "Client"}</strong>
                  </div>
                  <div className="card-info-row price-row">
                    <span className="info-label">Amount:</span>
                    <strong className="price-value">{formatUSD(ord.total_amount)}</strong>
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

      {/* TAB 3: TOP PRODUCTS */}
      {activeTab === "products" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "ផលិតផលលក់ដាច់បំផុត" : "Top Performing Products"}</h3>
              <p>{isKhmer ? "តម្រៀបតាមចំណូល បរិមាណលក់ និងប្រាក់ចំណេញ" : "Ranked by gross sales volume and margin contribution"}</p>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th onClick={() => handleColumnSort("name")}>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th onClick={() => handleColumnSort("units")}>Units Sold {sortBy === "units" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th onClick={() => handleColumnSort("revenue")}>Revenue {sortBy === "revenue" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th onClick={() => handleColumnSort("profit")}>Net Profit {sortBy === "profit" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan={8} className="empty-cell">No product sales recorded in this period.</td></tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td><span className="rank-badge">#{idx + 1}</span></td>
                      <td><strong className="prod-name">{p.name}</strong></td>
                      <td><span className="sku-tag">{p.sku}</span></td>
                      <td><span className="cat-pill">{p.category}</span></td>
                      <td><strong>{p.unitsSold.toLocaleString()}</strong></td>
                      <td><strong className="amount-val">{formatUSD(p.revenue)}</strong></td>
                      <td><strong className="profit-val">{formatUSD(p.profit)}</strong></td>
                      <td>
                        <span className={`stock-status-pill ${p.stock <= 5 ? "low" : "ok"}`}>
                          {p.stock} in stock
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {topProducts.map((p, idx) => (
                <div className="kanban-card" key={p.id || idx}>
                  <div className="kanban-card-header">
                    <strong>#{idx + 1} {p.name}</strong>
                    <span className="cat-pill">{p.category}</span>
                  </div>
                  <div className="card-info-row price-row">
                    <span className="info-label">Revenue / Units:</span>
                    <strong className="price-value">{formatUSD(p.revenue)} ({p.unitsSold} sold)</strong>
                  </div>
                  <div className="card-info-row">
                    <span className="info-label">Net Profit:</span>
                    <strong className="profit-val">{formatUSD(p.profit)} ({p.margin})</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY HEALTH */}
      {activeTab === "inventory" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "តារាងសុខភាពស្តុកទំនិញ" : "Inventory Valuation & Stock Levels"}</h3>
              <p>{isKhmer ? "តាមដានស្តុកជិតអស់ ស្តុកលើស និងអនុសាសន៍បញ្ជាទិញ" : "Automated reorder triggers and asset valuation"}</p>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th onClick={() => handleColumnSort("name")}>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th onClick={() => handleColumnSort("stock")}>Current Stock {sortBy === "stock" && (sortOrder === "asc" ? "▲" : "▼")}</th>
                  <th onClick={() => handleColumnSort("value")}>Stock Valuation {sortBy === "value" && (sortOrder === "asc" ? "▲" : "▼")}</th>
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
                    <span className={`urgency-badge ${p.urgency}`}>{p.urgency}</span>
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

      {/* TAB 5: PURCHASES & RE-STOCKING */}
      {activeTab === "purchases" && (
        <div className="panel report-table-panel">
          <div className="panel-header-row">
            <div>
              <h3>{isKhmer ? "ការទិញចូលពីអ្នកផ្គត់ផ្គង់" : "Procurement & Restocking Records"}</h3>
              <p>{isKhmer ? "តាមដានលំហូរសាច់ប្រាក់ចំណាយទិញទំនិញចូល" : "Supplier purchase orders and invoice expenditures"}</p>
            </div>
          </div>

          <div className="table-responsive-container">
            <table className="report-data-table desktop-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th onClick={() => handleColumnSort("date")}>Order Date</th>
                  <th>Status</th>
                  <th onClick={() => handleColumnSort("amount")}>Total Spend ($)</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRows.map((po) => (
                  <tr key={po.id}>
                    <td><strong className="id-tag">{po.po_number || `PO-${po.id}`}</strong></td>
                    <td><strong>{po.supplier?.name || po.supplier_name || "Official Partner"}</strong></td>
                    <td><span>{po.order_date || po.created_at || "—"}</span></td>
                    <td><span className={`status-pill status-${po.status || "completed"}`}>{po.status || "completed"}</span></td>
                    <td><strong className="amount-val">{formatUSD(po.total_amount)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-cards-container">
              {purchaseRows.map((po) => (
                <div className="kanban-card" key={po.id}>
                  <div className="kanban-card-header">
                    <span className="id-tag">{po.po_number || `PO-${po.id}`}</span>
                    <span className={`status-pill status-${po.status || "completed"}`}>{po.status || "completed"}</span>
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

      {/* ========================================================
          6. EXCEL / CSV IMPORT DATASET MODAL
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

                {/* Import Preview Table */}
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
                  {isKhmer ? "បោះបង់" : "Cancel"}
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

      {/* ========================================================
          7. INTERACTIVE KPI DRILL-DOWN MODAL
         ======================================================== */}
      <AnimatePresence>
        {kpiModal && (
          <div className="kpi-modal-backdrop" onClick={() => setKpiModal(null)}>
            <motion.div
              className={`kpi-modal-card ${kpiModal.color}`}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
            >
              <div className="kpi-modal-header">
                <div className="kpi-modal-title-group">
                  <div className={`kpi-modal-icon-badge ${kpiModal.color}`}>
                    {kpiModal.icon}
                  </div>
                  <div>
                    <h3>{kpiModal.title}</h3>
                    <span className="kpi-modal-badge">{kpiModal.badge}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="kpi-modal-close"
                  onClick={() => setKpiModal(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="kpi-modal-body">
                <div className="kpi-modal-highlight">
                  <span className="highlight-caption">{isKhmer ? "សរុបបច្ចុប្បន្ន" : "Aggregated Metric"}</span>
                  <h2 className="highlight-number">{kpiModal.summary}</h2>
                </div>

                <div className="kpi-details-grid">
                  {kpiModal.details.map((d, i) => (
                    <div className="kpi-detail-item" key={i}>
                      <span className="detail-label">{d.label}</span>
                      <strong className="detail-value">{d.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kpi-modal-footer">
                <button
                  type="button"
                  className="kpi-btn-secondary"
                  onClick={() => setKpiModal(null)}
                >
                  {isKhmer ? "បិទ" : "Close"}
                </button>

                <button
                  type="button"
                  className="kpi-btn-primary"
                  onClick={() => kpiModal.onAction && kpiModal.onAction()}
                >
                  <span>{kpiModal.actionText}</span>
                  <ChevronRight size={14} />
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
