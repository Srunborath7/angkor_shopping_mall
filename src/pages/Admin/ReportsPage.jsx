import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Repeat,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  CreditCard,
  Truck,
  Layers,
  ChevronDown
} from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOrdersApi } from "../../services/orderService";
import { productsApi } from "../../services/productsService";
import { KpiCardSkeleton, TableSkeleton } from "../../components/loading/LoadingSkeleton";
import { usePermissions, AccessDeniedView } from "../../hooks/usePermissions.jsx";
import "./style/ReportsPage.css";

// Mock Sample Report Datasets
const MOCK_MONTHLY_REVENUE = [
  { month: "Jan", revenue: 14200, cost: 9940, profit: 4260, orders: 158 },
  { month: "Feb", revenue: 16800, cost: 11760, profit: 5040, orders: 186 },
  { month: "Mar", revenue: 19500, cost: 13650, profit: 5850, orders: 215 },
  { month: "Apr", revenue: 18200, cost: 12740, profit: 5460, orders: 202 },
  { month: "May", revenue: 22400, cost: 15680, profit: 6720, orders: 248 },
  { month: "Jun", revenue: 26100, cost: 18270, profit: 7830, orders: 289 },
  { month: "Jul", revenue: 24800, cost: 17360, profit: 7440, orders: 275 },
  { month: "Aug", revenue: 28950, cost: 20265, profit: 8685, orders: 320 }
];

const CATEGORY_BREAKDOWN = [
  { name: "Smartphones & Tablets", share: 48, revenue: 61656, color: "#10b981" },
  { name: "Laptops & Computers", share: 26, revenue: 33397, color: "#3b82f6" },
  { name: "Smartwatches & Wearables", share: 14, revenue: 17983, color: "#f59e0b" },
  { name: "Audio & Accessories", share: 12, revenue: 15414, color: "#8b5cf6" }
];

const PAYMENT_BREAKDOWN = [
  { name: "ABA KHQR / PayWay", share: 64, count: 908, color: "#005697" },
  { name: "Wing Bank Wallet", share: 18, count: 255, color: "#84cc16" },
  { name: "Cash on Delivery (COD)", share: 12, count: 170, color: "#f97316" },
  { name: "Credit / Debit Cards", share: 6, count: 87, color: "#6366f1" }
];

const TOP_SELLING_PRODUCTS = [
  {
    id: 101,
    name: "iPhone 16 Pro Max 256GB - Desert Titanium",
    category: "Smartphones",
    sku: "APL-IP16PM-256",
    unitsSold: 84,
    revenue: 117516,
    profit: 23500,
    margin: "20.0%",
    stock: 18,
    status: "In Stock"
  },
  {
    id: 102,
    name: "Samsung Galaxy S24 Ultra 512GB - Titanium Gray",
    category: "Smartphones",
    sku: "SAM-S24U-512",
    unitsSold: 62,
    revenue: 80538,
    profit: 16100,
    margin: "20.0%",
    stock: 12,
    status: "In Stock"
  },
  {
    id: 103,
    name: "MacBook Pro 14 M3 Pro 18GB/512GB Space Black",
    category: "Laptops",
    sku: "APL-MBP14-M3P",
    unitsSold: 38,
    revenue: 75962,
    profit: 15190,
    margin: "20.0%",
    stock: 6,
    status: "Low Stock"
  },
  {
    id: 104,
    name: "Apple Watch Ultra 2 GPS + Cellular Titanium",
    category: "Wearables",
    sku: "APL-AWU2-49",
    unitsSold: 52,
    revenue: 41548,
    profit: 9140,
    margin: "22.0%",
    stock: 14,
    status: "In Stock"
  },
  {
    id: 105,
    name: "Sony WH-1000XM5 Wireless Noise Cancelling",
    category: "Audio",
    sku: "SNY-WH1000M5",
    unitsSold: 76,
    revenue: 26524,
    profit: 7420,
    margin: "28.0%",
    stock: 22,
    status: "In Stock"
  }
];

const INVENTORY_HEALTH_DATA = [
  { id: 201, item: "iPhone 15 128GB Black", currentStock: 3, velocity: "High (8/wk)", daysLeft: 2.6, recommendation: "Urgent Reorder +20", urgency: "critical" },
  { id: 202, item: "AirPods Pro 2 USB-C", currentStock: 5, velocity: "High (12/wk)", daysLeft: 2.9, recommendation: "Reorder +30", urgency: "critical" },
  { id: 203, item: "Dell XPS 15 OLED i9/32GB", currentStock: 4, velocity: "Medium (2/wk)", daysLeft: 14.0, recommendation: "Reorder +5", urgency: "warning" },
  { id: 204, item: "iPad Air M2 11-inch 128GB", currentStock: 8, velocity: "Medium (4/wk)", daysLeft: 14.0, recommendation: "Healthy Stock", urgency: "healthy" },
  { id: 205, item: "Samsung Galaxy Watch 6 44mm", currentStock: 28, velocity: "Low (1/wk)", daysLeft: 196.0, recommendation: "Promo Discount / Flash Sale", urgency: "overstock" }
];

function ReportsPage() {
  const { isKhmer } = useTranslation();
  const { isDark } = useTheme();

  const [timeRange, setTimeRange] = useState("month");
  const [activeReportTab, setActiveReportTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  // Fetch real order statistics if available
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setIsLoading(true);
        const res = await getAdminOrdersApi();
        const list = res?.data?.orders || res?.data || (Array.isArray(res) ? res : []);
        setOrders(list);
      } catch (err) {
        // use fallback datasets
      } finally {
        setIsLoading(false);
      }
    };
    loadRealData();
  }, []);

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ["Product Name", "SKU", "Category", "Units Sold", "Total Revenue ($)", "Profit ($)", "Stock"];
      const rows = TOP_SELLING_PRODUCTS.map((p) => [
        `"${p.name}"`,
        p.sku,
        p.category,
        p.unitsSold,
        p.revenue,
        p.profit,
        p.stock
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `AngkorMall_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire({
        icon: "success",
        title: isKhmer ? "បានទាញយក CSV" : "CSV Exported!",
        text: isKhmer ? "របាយការណ៍ត្រូវបានទាញយកជាឯកសារ Excel/CSV ដោយជោគជ័យ។" : "Sales report downloaded as CSV file.",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire("Error", "Failed to export CSV", "error");
    }
  };

  // Trigger Print View
  const handlePrint = () => {
    window.print();
  };

  // Export PDF Trigger
  const handleExportPDF = () => {
    Swal.fire({
      icon: "info",
      title: isKhmer ? "កំពុងបង្កើត PDF..." : "Generating PDF Report...",
      text: isKhmer ? "ប្រព័ន្ធកំពុងរៀបចំឯកសារ PDF សម្រាប់ទាញយក និងបោះពុម្ព។" : "Preparing high-resolution PDF document.",
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.print();
    });
  };

  const { can } = usePermissions();

  if (!can("reports", "view")) {
    return <AccessDeniedView moduleName="Financial Reports & Analytics" />;
  }

  return (
    <div className="reports-page-wrapper">
      {/* Top Banner */}
      <div className="reports-header-banner">
        <div className="reports-header-title">
          <div className="reports-header-icon">
            <BarChart2 size={26} />
          </div>
          <div>
            <h1>{isKhmer ? "របាយការណ៍ & ស្ថិតិអាជីវកម្ម" : "Reports & Business Analytics"}</h1>
            <p>
              {isKhmer
                ? "វិភាគទិន្នន័យចំណូល ការលក់ ប្រាក់ចំណេញ ស្តុកទំនិញ និងទម្លាប់ទិញរបស់អតិថិជន"
                : "Real-time revenue intelligence, profit margins, sales channels, and inventory turnover."}
            </p>
          </div>
        </div>

        <div className="reports-header-actions">
          {/* Time Range Filter */}
          <div className="time-filter-wrapper">
            <Calendar size={14} className="time-filter-icon" />
            <select
              className="time-filter-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="today">{isKhmer ? "ថ្ងៃនេះ (Today)" : "Today"}</option>
              <option value="week">{isKhmer ? "៧ ថ្ងៃចុងក្រោយ (Last 7 Days)" : "Last 7 Days"}</option>
              <option value="month">{isKhmer ? "ខែនេះ (This Month)" : "This Month"}</option>
              <option value="quarter">{isKhmer ? "ត្រីមាសនេះ (This Quarter)" : "This Quarter"}</option>
              <option value="year">{isKhmer ? "ឆ្នាំនេះ (This Year)" : "This Year"}</option>
            </select>
          </div>

          <button type="button" className="btn-outline-action" onClick={handleExportCSV} title="Export CSV">
            <Download size={15} />
            <span>{isKhmer ? "ទាញយក CSV" : "Export CSV"}</span>
          </button>

          <button type="button" className="btn-outline-action" onClick={handlePrint} title="Print Report">
            <Printer size={15} />
            <span>{isKhmer ? "បោះពុម្ព" : "Print"}</span>
          </button>

          <button type="button" className="btn-primary-action" onClick={handleExportPDF}>
            <FileText size={15} />
            <span>{isKhmer ? "របាយការណ៍ PDF" : "PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isLoading ? (
        <KpiCardSkeleton count={4} />
      ) : (
        <div className="reports-kpi-grid">
          {/* KPI 1: Gross Revenue */}
          <div className="report-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">{isKhmer ? "ចំណូលសរុប (Gross Revenue)" : "Gross Total Revenue"}</span>
            <div className="kpi-icon-box green">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-main-val">$128,450.00</div>
          <div className="kpi-footer-row">
            <span className="kpi-badge positive">
              <ArrowUpRight size={13} /> +22.4%
            </span>
            <span className="kpi-sub-text">≈ 526,645,000 ៛ (KHR)</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="report-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">{isKhmer ? "ការបញ្ជាទិញជោគជ័យ" : "Completed Orders"}</span>
            <div className="kpi-icon-box blue">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="kpi-main-val">1,420 {isKhmer ? "កញ្ចប់" : "Orders"}</div>
          <div className="kpi-footer-row">
            <span className="kpi-badge positive">
              <ArrowUpRight size={13} /> +14.8%
            </span>
            <span className="kpi-sub-text">{isKhmer ? "មធ្យម 47 កញ្ចប់/ថ្ងៃ" : "Avg. 47 orders/day"}</span>
          </div>
        </div>

        {/* KPI 3: Average Order Value */}
        <div className="report-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">{isKhmer ? "តម្លៃជាមធ្យមក្នុងមួយកន្ត្រក" : "Average Order Value (AOV)"}</span>
            <div className="kpi-icon-box purple">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-main-val">$90.45</div>
          <div className="kpi-footer-row">
            <span className="kpi-badge positive">
              <ArrowUpRight size={13} /> +6.2%
            </span>
            <span className="kpi-sub-text">{isKhmer ? "កើនឡើងពី $85.10" : "Up from $85.10"}</span>
          </div>
        </div>

        {/* KPI 4: Net Profit */}
        <div className="report-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">{isKhmer ? "ប្រាក់ចំណេញសុទ្ធ (Net Profit)" : "Estimated Net Profit"}</span>
            <div className="kpi-icon-box orange">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-main-val">$38,535.00</div>
          <div className="kpi-footer-row">
            <span className="kpi-badge positive">
              <ArrowUpRight size={13} /> 30.0% Margin
            </span>
            <span className="kpi-sub-text">{isKhmer ? "ចំណេញសុទ្ធ" : "Healthy profit margin"}</span>
          </div>
        </div>
      </div>
      )}

      {/* Report View Mode Tabs */}
      <div className="reports-subnav-tabs">
        <button
          type="button"
          className={`subnav-tab-btn ${activeReportTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveReportTab("overview")}
        >
          <BarChart2 size={15} />
          <span>{isKhmer ? "ទិដ្ឋភាពទូទៅ & ក្រាហ្វិក" : "Overview & Analytics"}</span>
        </button>

        <button
          type="button"
          className={`subnav-tab-btn ${activeReportTab === "top_products" ? "active" : ""}`}
          onClick={() => setActiveReportTab("top_products")}
        >
          <Package size={15} />
          <span>{isKhmer ? "ផលិតផលលក់ដាច់បំផុត" : "Top Selling Products"}</span>
        </button>

        <button
          type="button"
          className={`subnav-tab-btn ${activeReportTab === "inventory_turn" ? "active" : ""}`}
          onClick={() => setActiveReportTab("inventory_turn")}
        >
          <AlertTriangle size={15} />
          <span>{isKhmer ? "ការគ្រប់គ្រងស្តុក & ព្រមានស្តុកទាប" : "Inventory Turn & Risk"}</span>
        </button>

        <button
          type="button"
          className={`subnav-tab-btn ${activeReportTab === "payments_shipping" ? "active" : ""}`}
          onClick={() => setActiveReportTab("payments_shipping")}
        >
          <CreditCard size={15} />
          <span>{isKhmer ? "ធនាគារទូទាត់ & ការដឹកជញ្ជូន" : "Payment & Logistics"}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & ANALYTICS CHARTS
         ========================================================================= */}
      {activeReportTab === "overview" && (
        <div className="analytics-section-grid">
          {/* Main Revenue Growth Bar Chart */}
          <div className="report-card full-span">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "សន្ទុះកំណើនចំណូល និងប្រាក់ចំណេញ (Monthly Revenue & Profit Growth)" : "Monthly Revenue & Profit Growth"}</h3>
                <p>{isKhmer ? "ស្ថិតិចំណូលសរុប និងប្រាក់ចំណេញប្រចាំខែសម្រាប់ឆ្នាំ 2026" : "Monthly breakdown comparing gross revenue versus net profit."}</p>
              </div>
              <div className="chart-legend-row">
                <span className="legend-item"><span className="legend-dot green" /> {isKhmer ? "ចំណូល (Revenue)" : "Revenue"}</span>
                <span className="legend-item"><span className="legend-dot emerald" /> {isKhmer ? "ចំណេញ (Profit)" : "Net Profit"}</span>
              </div>
            </div>

            <div className="bar-chart-visual-container">
              {MOCK_MONTHLY_REVENUE.map((item) => {
                const heightPct = Math.round((item.revenue / maxMonthRev) * 100);
                const profitPct = Math.round((item.profit / maxMonthRev) * 100);

                return (
                  <div key={item.month} className="chart-col-group">
                    <div className="chart-bars-wrap">
                      <div className="chart-bar revenue-bar" style={{ height: `${heightPct}%` }}>
                        <span className="bar-tooltip">${item.revenue.toLocaleString()}</span>
                      </div>
                      <div className="chart-bar profit-bar" style={{ height: `${profitPct}%` }}>
                        <span className="bar-tooltip profit">${item.profit.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="chart-col-label">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Sales Breakdown */}
          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការលក់តាមប្រភេទផលិតផល" : "Sales by Product Category"}</h3>
                <p>{isKhmer ? "ចំណែកទីផ្សារ និងទំហំទឹកប្រាក់លក់ចេញ" : "Market share and revenue contribution per category."}</p>
              </div>
            </div>

            <div className="category-progress-list">
              {CATEGORY_BREAKDOWN.map((cat) => (
                <div key={cat.name} className="cat-progress-item">
                  <div className="cat-progress-meta">
                    <strong>{cat.name}</strong>
                    <span>${cat.revenue.toLocaleString()} ({cat.share}%)</span>
                  </div>
                  <div className="cat-progress-track">
                    <div
                      className="cat-progress-fill"
                      style={{ width: `${cat.share}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateway Distribution */}
          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការទូទាត់ប្រាក់តាមប្រព័ន្ធធនាគារ" : "Payment Gateways & KHQR"}</h3>
                <p>{isKhmer ? "ភាគរយនៃការទូទាត់តាម ABA, Wing, COD" : "Transaction share per customer payment gateway."}</p>
              </div>
            </div>

            <div className="payment-distribution-grid">
              {PAYMENT_BREAKDOWN.map((pay) => (
                <div key={pay.name} className="pay-method-card">
                  <div className="pay-method-top">
                    <strong style={{ fontSize: "14px" }}>{pay.name}</strong>
                    <span className="pay-share-badge">{pay.share}%</span>
                  </div>
                  <div className="pay-count-sub">{pay.count} {isKhmer ? "ប្រតិបត្តិការជោគជ័យ" : "Transactions"}</div>
                  <div className="pay-progress-bar">
                    <div className="pay-progress-fill" style={{ width: `${pay.share}%`, backgroundColor: pay.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: TOP SELLING PRODUCTS LEADERBOARD
         ========================================================================= */}
      {activeReportTab === "top_products" && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3>{isKhmer ? "តារាងចំណាត់ថ្នាក់ផលិតផលលក់ដាច់បំផុត" : "Top Selling Products Leaderboard"}</h3>
              <p>{isKhmer ? "រាយនាមផលិតផលដែលរកចំណូលបានច្រើនជាងគេ និងចំនួនលក់ចេញ" : "Ranked by total gross revenue generated and units dispatched."}</p>
            </div>
          </div>

          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Rank</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Gross Revenue</th>
                  <th>Profit Margin</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_SELLING_PRODUCTS.map((prod, idx) => (
                  <tr key={prod.id}>
                    <td>
                      <span className={`rank-badge ${idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : ""}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="table-product-title">
                        <strong>{prod.name}</strong>
                        <small>SKU: {prod.sku}</small>
                      </div>
                    </td>
                    <td>
                      <span className="table-cat-pill">{prod.category}</span>
                    </td>
                    <td>
                      <strong>{prod.unitsSold} units</strong>
                    </td>
                    <td>
                      <span className="table-revenue-text">${prod.revenue.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="table-margin-badge">{prod.margin}</span>
                    </td>
                    <td>
                      <span className={`table-stock-badge ${prod.stock <= 10 ? "low" : "ok"}`}>
                        {prod.stock} in stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: INVENTORY HEALTH & REORDER RISK
         ========================================================================= */}
      {activeReportTab === "inventory_turn" && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3>{isKhmer ? "ការត្រួតពិនិត្យសុខភាពស្តុកទំនិញ & ការព្រមាន" : "Inventory Health & Reorder Recommendations"}</h3>
              <p>{isKhmer ? "កំណត់សម្គាល់ទំនិញជិតអស់ពីស្តុក និងទំនិញលក់យឺត" : "Automated stock depletion velocity and replenishment recommendations."}</p>
            </div>
          </div>

          <div className="report-table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Sales Velocity</th>
                  <th>Estimated Days Left</th>
                  <th>Recommended Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY_HEALTH_DATA.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.item}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{item.currentStock} units</span>
                    </td>
                    <td>{item.velocity}</td>
                    <td>
                      <span style={{ color: item.daysLeft < 7 ? "#ef4444" : "#166534", fontWeight: 700 }}>
                        {item.daysLeft} days
                      </span>
                    </td>
                    <td>
                      <span className="table-action-pill">{item.recommendation}</span>
                    </td>
                    <td>
                      <span className={`inventory-status-pill ${item.urgency}`}>
                        {item.urgency.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: PAYMENT GATEWAYS & LOGISTICS
         ========================================================================= */}
      {activeReportTab === "payments_shipping" && (
        <div className="analytics-section-grid">
          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការដឹកជញ្ជូន និងភស្តុភារកម្ម" : "Logistics & Fulfillment Zones"}</h3>
                <p>{isKhmer ? "ទិន្នន័យដឹកជញ្ជូនរាជធានីភ្នំពេញ និងតាមបណ្តាខេត្ត" : "Delivery completion rates across regions."}</p>
              </div>
            </div>

            <div className="logistics-stats-grid">
              <div className="logistics-box">
                <div className="logistics-icon phnom-penh">
                  <Truck size={20} />
                </div>
                <div>
                  <h4>Phnom Penh Express (24h)</h4>
                  <p>1,022 Parcels Delivered (72%)</p>
                  <small style={{ color: "#166534", fontWeight: 700 }}>99.2% On-Time Delivery</small>
                </div>
              </div>

              <div className="logistics-box">
                <div className="logistics-icon provinces">
                  <Truck size={20} />
                </div>
                <div>
                  <h4>Provinces Dispatch (48-72h)</h4>
                  <p>398 Parcels Delivered (28%)</p>
                  <small style={{ color: "#2563eb", fontWeight: 700 }}>97.8% On-Time Delivery</small>
                </div>
              </div>
            </div>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3>{isKhmer ? "ការប្តូរសេរីទូរស័ព្ទ (Trade-In Volume)" : "Device Trade-In Volume"}</h3>
                <p>{isKhmer ? "ស្ថិតិនៃការប្តូរយកទូរស័ព្ទចាស់ និងការបន្ថែមប្រាក់" : "Total pre-owned device buyback and upgrades."}</p>
              </div>
            </div>

            <div className="trade-report-summary">
              <div className="trade-metric-row">
                <span>{isKhmer ? "ចំនួនទូរស័ព្ទដែលបានប្តូរសេរី៖" : "Total Devices Traded:"}</span>
                <strong>85 Units</strong>
              </div>
              <div className="trade-metric-row">
                <span>{isKhmer ? "តម្លៃប៉ាន់ស្មានទិញចូលសរុប៖" : "Total Buyback Value Paid:"}</span>
                <strong style={{ color: "#166534" }}>$18,250.00</strong>
              </div>
              <div className="trade-metric-row">
                <span>{isKhmer ? "អតិថិជនប្តូរយកទូរស័ព្ទថ្មី៖" : "New Upgrades Generated:"}</span>
                <strong style={{ color: "#2563eb" }}>$42,100.00</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
