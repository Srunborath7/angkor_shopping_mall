import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  RefreshCw,
  FileText,
  CreditCard,
  Truck,
  Boxes,
  CheckCircle2,
  Clock
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

const CATEGORY_COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6", "#f97316"];

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

function getRangeBounds(range) {
  const end = new Date();
  const start = new Date(end);
  const prevEnd = new Date();
  const prevStart = new Date();

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    prevEnd.setTime(start.getTime() - 1);
    prevStart.setTime(start.getTime());
    prevStart.setDate(prevStart.getDate() - 1);
    prevStart.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    prevEnd.setTime(start.getTime() - 1);
    prevStart.setTime(start.getTime());
    prevStart.setDate(prevStart.getDate() - 7);
  } else if (range === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    prevEnd.setTime(start.getTime() - 1);
    prevStart.setMonth(start.getMonth() - 1, 1);
    prevStart.setHours(0, 0, 0, 0);
  } else if (range === "quarter") {
    const q = Math.floor(end.getMonth() / 3) * 3;
    start.setMonth(q, 1);
    start.setHours(0, 0, 0, 0);
    prevEnd.setTime(start.getTime() - 1);
    prevStart.setMonth(q - 3, 1);
    prevStart.setHours(0, 0, 0, 0);
  } else if (range === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    prevEnd.setTime(start.getTime() - 1);
    prevStart.setFullYear(start.getFullYear() - 1, 0, 1);
    prevStart.setHours(0, 0, 0, 0);
  } else {
    return { start: null, end, prevStart: null, prevEnd: null };
  }

  return { start, end, prevStart, prevEnd };
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
  return item?.product?.name || item?.name || item?.product_name || "Unknown product";
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
  return product?.category?.name || product?.category || "Uncategorized";
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

function downloadCsv(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ChartTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rp-tooltip ${isDark ? "dark" : ""}`}>
      <strong>{label}</strong>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="rp-tooltip-row">
          <span style={{ background: entry.color }} />
          {entry.name}: {entry.dataKey === "orders" ? formatCount(entry.value) : formatUSD(entry.value)}
        </div>
      ))}
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, text }) {
  return (
    <div className="rp-empty">
      {Icon ? <Icon size={28} /> : null}
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function ReportPage() {
  const { isKhmer } = useTranslation();
  const { isDark } = useTheme();
  const { can } = usePermissions();

  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, purchasesRes, customersRes] = await Promise.allSettled([
        getAdminOrdersApi(),
        productsApi(),
        purchaseOrdersApi(),
        CustomersApi()
      ]);

      if (ordersRes.status === "fulfilled") {
        setOrders(toList(ordersRes.value, "orders"));
      }
      if (productsRes.status === "fulfilled") {
        setProducts(toList(productsRes.value, "products"));
      }
      if (purchasesRes.status === "fulfilled") {
        setPurchases(toList(purchasesRes.value, "purchaseOrders", "purchases"));
      }
      if (customersRes.status === "fulfilled") {
        setCustomers(toList(customersRes.value, "customers", "users"));
      }
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const productsById = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const bounds = useMemo(() => getRangeBounds(timeRange), [timeRange]);

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
      aov: aov,
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

  const statusData = useMemo(() => {
    const counts = {};
    filteredOrders.forEach((order) => {
      const status = orderStatus(order);
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name] || "#64748b"
    }));
  }, [filteredOrders]);

  const paymentData = useMemo(() => {
    const counts = {};
    filteredOrders.forEach((order) => {
      const label = paymentLabel(order);
      if (!counts[label]) counts[label] = { name: label, count: 0, revenue: 0 };
      counts[label].count += 1;
      if (isRevenueOrder(order)) counts[label].revenue += money(order.total_amount);
    });
    const list = Object.values(counts).sort((a, b) => b.count - a.count);
    const total = list.reduce((sum, item) => sum + item.count, 0) || 1;
    return list.map((item, index) => ({
      ...item,
      share: Math.round((item.count / total) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [filteredOrders]);

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
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        profit: item.revenue * PROFIT_MARGIN,
        margin: `${(PROFIT_MARGIN * 100).toFixed(0)}%`
      }));
  }, [filteredOrders, productsById]);

  const categoryData = useMemo(() => {
    const map = new Map();
    topProducts.forEach((product) => {
      const name = product.category || "Uncategorized";
      const existing = map.get(name) || { name, revenue: 0, units: 0 };
      existing.revenue += product.revenue;
      existing.units += product.unitsSold;
      map.set(name, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    const total = list.reduce((sum, item) => sum + item.revenue, 0) || 1;
    return list.map((item, index) => ({
      ...item,
      share: Math.round((item.revenue / total) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [topProducts]);

  const inventoryRows = useMemo(() => {
    return products
      .map((product) => {
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
          recommendation = isKhmer ? "ពិចារណាប្រូម៉ូសិន" : "Consider a promo / flash sale";
        }
        return {
          id: product.id,
          name: product.name,
          sku: product.sku || "—",
          category: product.category?.name || product.category || "—",
          stock,
          value: money(product.price) * stock,
          urgency,
          recommendation
        };
      })
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 20);
  }, [products, isKhmer]);

  const purchaseRows = useMemo(() => {
    return [...filteredPurchases]
      .sort((a, b) => money(b.total_amount) - money(a.total_amount))
      .slice(0, 12);
  }, [filteredPurchases]);

  const recentOrders = useMemo(() => {
    return [...filteredOrders]
      .sort((a, b) => (orderDate(b)?.getTime() || 0) - (orderDate(a)?.getTime() || 0))
      .slice(0, 8);
  }, [filteredOrders]);

  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const canExport = can("reports", "export");

  const handleExportCsv = () => {
    try {
      if (activeTab === "products") {
        downloadCsv(
          `AngkorMall_Top_Products_${new Date().toISOString().slice(0, 10)}.csv`,
          ["Product", "SKU", "Category", "Units Sold", "Revenue", "Profit"],
          topProducts.map((p) => [p.name, p.sku, p.category, p.unitsSold, p.revenue.toFixed(2), p.profit.toFixed(2)])
        );
      } else if (activeTab === "inventory") {
        downloadCsv(
          `AngkorMall_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`,
          ["Product", "SKU", "Category", "Stock", "Inventory Value", "Status", "Recommendation"],
          inventoryRows.map((p) => [p.name, p.sku, p.category, p.stock, p.value.toFixed(2), p.urgency, p.recommendation])
        );
      } else if (activeTab === "purchases") {
        downloadCsv(
          `AngkorMall_Purchases_Report_${new Date().toISOString().slice(0, 10)}.csv`,
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
          `AngkorMall_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`,
          ["Period", "Orders", "Revenue", "Profit"],
          trendData.map((row) => [row.label, row.orders, row.revenue.toFixed(2), row.profit.toFixed(2)])
        );
      }

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានទាញយក CSV" : "CSV exported",
        text: isKhmer ? "របាយការណ៍ត្រូវបានទាញយកដោយជោគជ័យ។" : "The report downloaded as a CSV file.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch {
      Swal.fire("Error", "Failed to export CSV", "error");
    }
  };

  const handlePrint = () => window.print();

  const handlePdf = () => {
    Swal.fire({
      icon: "info",
      title: isKhmer ? "កំពុងរៀបចំ PDF..." : "Preparing PDF...",
      text: isKhmer ? "សូមប្រើ Print ដើម្បីរក្សាទុកជា PDF។" : "Use the print dialog to save as PDF.",
      timer: 1200,
      showConfirmButton: false
    }).then(() => window.print());
  };

  if (!can("reports", "view")) {
    return <AccessDeniedView moduleName="Financial Reports & Analytics" />;
  }

  const tabs = [
    { id: "overview", icon: BarChart2, label: isKhmer ? "ទិដ្ឋភាពទូទៅ" : "Overview" },
    { id: "products", icon: Package, label: isKhmer ? "ផលិតផលលក់ដាច់" : "Top products" },
    { id: "inventory", icon: AlertTriangle, label: isKhmer ? "សុខភាពស្តុក" : "Inventory" },
    { id: "purchases", icon: Truck, label: isKhmer ? "ការទិញចូល" : "Purchases" }
  ];

  return (
    <div className="report-page">
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
                {isKhmer ? "ទិន្នន័យផ្ទាល់" : "Live data"}
              </span>
            </div>
            <p>
              {isKhmer
                ? "វិភាគចំណូល ការលក់ ប្រាក់ចំណេញ ស្តុកទំនិញ និងការទិញចូលពីទិន្នន័យពិត"
                : "Revenue, orders, profit, inventory health, and purchasing from live store data."}
            </p>
          </div>
        </div>

        <div className="report-header-actions">
          <div className="report-time-filter">
            <Calendar size={14} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="today">{isKhmer ? "ថ្ងៃនេះ" : "Today"}</option>
              <option value="week">{isKhmer ? "៧ ថ្ងៃចុងក្រោយ" : "Last 7 days"}</option>
              <option value="month">{isKhmer ? "ខែនេះ" : "This month"}</option>
              <option value="quarter">{isKhmer ? "ត្រីមាសនេះ" : "This quarter"}</option>
              <option value="year">{isKhmer ? "ឆ្នាំនេះ" : "This year"}</option>
              <option value="all">{isKhmer ? "ទាំងអស់" : "All time"}</option>
            </select>
          </div>

          <button type="button" className="rp-btn ghost" onClick={loadData} title="Refresh">
            <RefreshCw size={15} className={loading ? "rp-spin" : ""} />
          </button>

          {canExport && (
            <button type="button" className="rp-btn ghost" onClick={handleExportCsv}>
              <Download size={15} />
              <span>{isKhmer ? "CSV" : "CSV"}</span>
            </button>
          )}

          <button type="button" className="rp-btn ghost" onClick={handlePrint}>
            <Printer size={15} />
            <span>{isKhmer ? "បោះពុម្ព" : "Print"}</span>
          </button>

          {canExport && (
            <button type="button" className="rp-btn primary" onClick={handlePdf}>
              <FileText size={15} />
              <span>{isKhmer ? "PDF" : "PDF"}</span>
            </button>
          )}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <div className="report-stats">
          <div className="report-stat-card revenue">
            <div className="stat-info">
              <p>{isKhmer ? "ចំណូលសរុប" : "Gross revenue"}</p>
              <h1>{formatUSD(stats.revenue)}</h1>
              <span className={`rp-delta ${stats.revenueChange >= 0 ? "up" : "down"}`}>
                {stats.revenueChange >= 0 ? "+" : ""}
                {stats.revenueChange.toFixed(1)}%
              </span>
              <small>{formatKHR(stats.revenue)}</small>
            </div>
            <div className="icon-box">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="report-stat-card orders">
            <div className="stat-info">
              <p>{isKhmer ? "ការបញ្ជាទិញ" : "Orders"}</p>
              <h1>{formatCount(stats.orderCount)}</h1>
              <span className={`rp-delta ${stats.orderChange >= 0 ? "up" : "down"}`}>
                {stats.orderChange >= 0 ? "+" : ""}
                {stats.orderChange.toFixed(1)}%
              </span>
              <small>
                {stats.completed} {isKhmer ? "បានបញ្ចប់/បង់ប្រាក់" : "paid / completed"}
              </small>
            </div>
            <div className="icon-box">
              <ShoppingCart size={18} />
            </div>
          </div>

          <div className="report-stat-card aov">
            <div className="stat-info">
              <p>{isKhmer ? "តម្លៃមធ្យមក្នុងមួយកញ្ចប់" : "Average order value"}</p>
              <h1>{formatUSD(stats.aov)}</h1>
              <small>
                {stats.pending} {isKhmer ? "កំពុងរង់ចាំ" : "pending"} · {stats.cancelled}{" "}
                {isKhmer ? "បានលុប" : "cancelled"}
              </small>
            </div>
            <div className="icon-box">
              <TrendingUp size={18} />
            </div>
          </div>

          <div className="report-stat-card profit">
            <div className="stat-info">
              <p>{isKhmer ? "ប្រាក់ចំណេញប៉ាន់ស្មាន" : "Estimated net profit"}</p>
              <h1>{formatUSD(stats.profit)}</h1>
              <small>{(PROFIT_MARGIN * 100).toFixed(0)}% {isKhmer ? "អត្រាចំណេញ" : "margin"}</small>
            </div>
            <div className="icon-box">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      )}

      <div className="report-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`report-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="report-grid">
          <div className="report-card span-2">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "សន្ទុះចំណូល និងប្រាក់ចំណេញ" : "Revenue & profit trend"}</h3>
                <p>{isKhmer ? "ប្រៀបធៀបចំណូលសរុប និងប្រាក់ចំណេញប៉ាន់ស្មាន" : "Gross revenue versus estimated profit for the selected period."}</p>
              </div>
            </div>
            {trendData.every((row) => row.revenue === 0 && row.orders === 0) ? (
              <EmptyBlock
                icon={BarChart2}
                title={isKhmer ? "មិនមានទិន្នន័យលក់" : "No sales in this period"}
                text={isKhmer ? "សាកល្បងជ្រើសរយៈពេលផ្សេង ឬរង់ចាំការបញ្ជាទិញថ្មី។" : "Try another time range or wait for new orders."}
              />
            ) : (
              <div className="report-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip isDark={isDark} />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name={isKhmer ? "ចំណូល" : "Revenue"}
                      stroke="#16a34a"
                      fill="url(#revFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name={isKhmer ? "ចំណេញ" : "Profit"}
                      stroke="#2563eb"
                      fill="url(#profitFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ស្ថានភាពការបញ្ជាទិញ" : "Orders by status"}</h3>
                <p>{isKhmer ? "ចំនួនកញ្ចប់តាមដំណាក់កាល" : "Count of orders in each fulfillment stage."}</p>
              </div>
            </div>
            {statusData.length === 0 ? (
              <EmptyBlock icon={Clock} title={isKhmer ? "គ្មានការបញ្ជាទិញ" : "No orders"} text="" />
            ) : (
              <div className="report-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការលក់តាមប្រភេទ" : "Sales by category"}</h3>
                <p>{isKhmer ? "ចំណែកចំណូលតាមប្រភេទផលិតផល" : "Revenue contribution from sold items."}</p>
              </div>
            </div>
            {categoryData.length === 0 ? (
              <EmptyBlock icon={Package} title={isKhmer ? "គ្មានទិន្នន័យប្រភេទ" : "No category sales"} text="" />
            ) : (
              <div className="rp-progress-list">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="rp-progress-item">
                    <div className="rp-progress-meta">
                      <strong>{cat.name}</strong>
                      <span>
                        {formatUSD(cat.revenue)} ({cat.share}%)
                      </span>
                    </div>
                    <div className="rp-progress-track">
                      <div className="rp-progress-fill" style={{ width: `${cat.share}%`, background: cat.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "វិធីទូទាត់" : "Payment methods"}</h3>
                <p>{isKhmer ? "ចំនួនប្រតិបត្តិការ និងចំណូល" : "Transaction share and revenue per method."}</p>
              </div>
            </div>
            {paymentData.length === 0 ? (
              <EmptyBlock icon={CreditCard} title={isKhmer ? "គ្មានការទូទាត់" : "No payments"} text="" />
            ) : (
              <div className="rp-pay-list">
                {paymentData.map((pay) => (
                  <div key={pay.name} className="rp-pay-card">
                    <div className="rp-pay-top">
                      <strong>{pay.name}</strong>
                      <span>{pay.share}%</span>
                    </div>
                    <small>
                      {pay.count} {isKhmer ? "ប្រតិបត្តិការ" : "transactions"} · {formatUSD(pay.revenue)}
                    </small>
                    <div className="rp-progress-track">
                      <div className="rp-progress-fill" style={{ width: `${pay.share}%`, background: pay.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="report-card span-2">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការបញ្ជាទិញថ្មីៗ" : "Recent orders"}</h3>
                <p>{isKhmer ? "កញ្ចប់ចុងក្រោយក្នុងរយៈពេលដែលបានជ្រើស" : "Latest orders in the selected period."}</p>
              </div>
            </div>
            {loading && recentOrders.length === 0 ? (
              <TableSkeleton rows={5} cols={5} />
            ) : recentOrders.length === 0 ? (
              <EmptyBlock icon={ShoppingCart} title={isKhmer ? "គ្មានការបញ្ជាទិញ" : "No orders found"} text="" />
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>{isKhmer ? "អតិថិជន" : "Customer"}</th>
                      <th>{isKhmer ? "កាលបរិច្ឆេទ" : "Date"}</th>
                      <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                      <th>{isKhmer ? "សរុប" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const status = orderStatus(order);
                      const date = orderDate(order);
                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>#{String(order.id).slice(-6).toUpperCase()}</strong>
                          </td>
                          <td>{order.user?.name || order.contact_phone || "Guest"}</td>
                          <td>{date ? date.toLocaleString() : "—"}</td>
                          <td>
                            <span className={`rp-status ${status}`}>{status}</span>
                          </td>
                          <td className="rp-money">{formatUSD(order.total_amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3>{isKhmer ? "ផលិតផលលក់ដាច់បំផុត" : "Top selling products"}</h3>
              <p>{isKhmer ? "រៀបតាមចំណូលពីធាតុក្នុងការបញ្ជាទិញ" : "Ranked by revenue from order line items."}</p>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <EmptyBlock
              icon={Package}
              title={isKhmer ? "មិនទាន់មានការលក់" : "No product sales yet"}
              text={isKhmer ? "នៅពេលមានការបញ្ជាទិញ ផលិតផលនឹងបង្ហាញនៅទីនេះ។" : "Products will appear here once orders include line items."}
            />
          ) : (
            <>
              <div className="report-chart" style={{ marginBottom: 18 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts.slice(0, 6)} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: 11 }} interval={0} angle={-18} textAnchor="end" />
                    <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip isDark={isDark} />} />
                    <Bar dataKey="revenue" name={isKhmer ? "ចំណូល" : "Revenue"} fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>Rank</th>
                      <th>{isKhmer ? "ផលិតផល" : "Product"}</th>
                      <th>{isKhmer ? "ប្រភេទ" : "Category"}</th>
                      <th>{isKhmer ? "ចំនួនលក់" : "Units sold"}</th>
                      <th>{isKhmer ? "ចំណូល" : "Revenue"}</th>
                      <th>{isKhmer ? "ចំណេញ" : "Profit"}</th>
                      <th>{isKhmer ? "ស្តុក" : "Stock"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.id}>
                        <td>
                          <span className={`rp-rank ${index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : ""}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="rp-product-cell">
                            <strong>{product.name}</strong>
                            <small>SKU: {product.sku}</small>
                          </div>
                        </td>
                        <td>
                          <span className="rp-pill">{product.category}</span>
                        </td>
                        <td>
                          <strong>{product.unitsSold}</strong>
                        </td>
                        <td className="rp-money">{formatUSD(product.revenue)}</td>
                        <td>{formatUSD(product.profit)}</td>
                        <td>
                          <span className={`rp-stock ${product.stock <= LOW_STOCK_THRESHOLD ? "low" : "ok"}`}>
                            {product.stock} {isKhmer ? "ឯកតា" : "in stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="report-grid">
          <div className="report-mini-stats span-2">
            <div className="report-mini">
              <Boxes size={16} />
              <div>
                <p>{isKhmer ? "តម្លៃស្តុក" : "Inventory value"}</p>
                <strong>{formatUSD(stats.inventoryValue)}</strong>
              </div>
            </div>
            <div className="report-mini warn">
              <AlertTriangle size={16} />
              <div>
                <p>{isKhmer ? "ស្តុកទាប" : "Low stock"}</p>
                <strong>{stats.lowStock}</strong>
              </div>
            </div>
            <div className="report-mini danger">
              <Package size={16} />
              <div>
                <p>{isKhmer ? "អស់ពីស្តុក" : "Out of stock"}</p>
                <strong>{stats.outOfStock}</strong>
              </div>
            </div>
            <div className="report-mini">
              <ShoppingCart size={16} />
              <div>
                <p>{isKhmer ? "អតិថិជន" : "Customers"}</p>
                <strong>{formatCount(stats.customerCount)}</strong>
              </div>
            </div>
          </div>

          <div className="report-card span-2">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការព្រមានស្តុក & ការណែនាំ" : "Stock alerts & recommendations"}</h3>
                <p>{isKhmer ? "ទំនិញអស់ស្តុក ស្តុកទាប និងស្តុកច្រើន" : "Out of stock, low stock, and overstock items."}</p>
              </div>
            </div>
            {inventoryRows.length === 0 ? (
              <EmptyBlock icon={Boxes} title={isKhmer ? "គ្មានទិន្នន័យស្តុក" : "No inventory data"} text="" />
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>{isKhmer ? "ផលិតផល" : "Product"}</th>
                      <th>SKU</th>
                      <th>{isKhmer ? "ប្រភេទ" : "Category"}</th>
                      <th>{isKhmer ? "ស្តុក" : "Stock"}</th>
                      <th>{isKhmer ? "តម្លៃស្តុក" : "Value"}</th>
                      <th>{isKhmer ? "សកម្មភាព" : "Action"}</th>
                      <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                        </td>
                        <td>{row.sku}</td>
                        <td>{row.category}</td>
                        <td>
                          <strong>{row.stock}</strong>
                        </td>
                        <td className="rp-money">{formatUSD(row.value)}</td>
                        <td>
                          <span className="rp-pill">{row.recommendation}</span>
                        </td>
                        <td>
                          <span className={`rp-urgency ${row.urgency}`}>{row.urgency}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "purchases" && (
        <div className="report-grid">
          <div className="report-mini-stats span-2">
            <div className="report-mini">
              <Truck size={16} />
              <div>
                <p>{isKhmer ? "ចំណាយទិញចូល" : "Purchase spend"}</p>
                <strong>{formatUSD(stats.purchaseSpend)}</strong>
              </div>
            </div>
            <div className="report-mini">
              <DollarSign size={16} />
              <div>
                <p>{isKhmer ? "ចំណូលលក់" : "Sales revenue"}</p>
                <strong>{formatUSD(stats.revenue)}</strong>
              </div>
            </div>
            <div className="report-mini">
              <TrendingUp size={16} />
              <div>
                <p>{isKhmer ? "លក់ − ទិញចូល" : "Sales − purchases"}</p>
                <strong>{formatUSD(stats.revenue - stats.purchaseSpend)}</strong>
              </div>
            </div>
            <div className="report-mini">
              <FileText size={16} />
              <div>
                <p>{isKhmer ? "ចំនួន PO" : "Purchase orders"}</p>
                <strong>{filteredPurchases.length}</strong>
              </div>
            </div>
          </div>

          <div className="report-card span-2">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការបញ្ជាទិញចូល" : "Purchase orders"}</h3>
                <p>{isKhmer ? "ការចំណាយលើអ្នកផ្គត់ផ្គង់ក្នុងរយៈពេលនេះ" : "Supplier spend in the selected period."}</p>
              </div>
            </div>
            {purchaseRows.length === 0 ? (
              <EmptyBlock
                icon={Truck}
                title={isKhmer ? "គ្មានការទិញចូល" : "No purchase orders"}
                text={isKhmer ? "មិនមាន PO ក្នុងរយៈពេលនេះទេ។" : "No purchase orders fall in this time range."}
              />
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>PO</th>
                      <th>{isKhmer ? "អ្នកផ្គត់ផ្គង់" : "Supplier"}</th>
                      <th>{isKhmer ? "កាលបរិច្ឆេទ" : "Date"}</th>
                      <th>{isKhmer ? "ស្ថានភាព" : "Status"}</th>
                      <th>{isKhmer ? "សរុប" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((po) => (
                      <tr key={po.id}>
                        <td>
                          <strong>{po.po_number || `#${String(po.id).slice(-6)}`}</strong>
                        </td>
                        <td>{po.supplier?.name || po.supplier_name || "—"}</td>
                        <td>
                          {(po.order_date || po.created_at || "").toString().slice(0, 10) || "—"}
                        </td>
                        <td>
                          <span className={`rp-status ${String(po.status || "pending").toLowerCase()}`}>
                            {po.status || "pending"}
                          </span>
                        </td>
                        <td className="rp-money">{formatUSD(po.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportPage;
