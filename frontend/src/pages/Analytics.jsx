import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Package,
  RefreshCw,
  Star,
  Truck,
  TrendingUp,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL = "http://127.0.0.1:8000";

const STATUS_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#f59e0b",
  "#16a34a",
  "#ef4444",
  "#06b6d4",
];

const SEVERITY_COLORS = {
  CRITICAL: "#dc2626",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#2563eb",
};

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/analytics/overview`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load analytics data."
        );
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <RefreshCw
            size={23}
            className="analytics-spin"
          />
          <span>Loading operational analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <CircleAlert size={22} />

          <div>
            <strong>Analytics unavailable</strong>
            <span>
              {error || "Unable to load analytics."}
            </span>
          </div>

          <button onClick={loadAnalytics}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    summary,
    order_status,
    courier_usage,
    exception_breakdown,
  } = analytics;

  const activeStatuses = order_status.filter(
    (item) => item.count > 0
  );

  const activeExceptions = exception_breakdown.filter(
    (item) => item.count > 0
  );

  return (
    <div className="analytics-page">

      <div className="analytics-header">
        <div>
          <p className="analytics-eyebrow">
            OPERATIONS INTELLIGENCE
          </p>

          <h1>Operations Analytics</h1>

          <p className="analytics-description">
            Real-time fulfillment performance and
            operational insights across FulfillFlow.
          </p>
        </div>

        <button
          className="analytics-refresh-btn"
          onClick={loadAnalytics}
        >
          <RefreshCw size={15} />
          Refresh Data
        </button>
      </div>

      <div className="analytics-kpi-grid">

        <KpiCard
          title="Total Orders"
          value={summary.total_orders}
          icon={<Package size={20} />}
          type="blue"
          subtitle="Orders in fulfillment"
        />

        <KpiCard
          title="Shipped Orders"
          value={summary.shipped_orders}
          icon={<Truck size={20} />}
          type="green"
          subtitle="Successfully dispatched"
        />

        <KpiCard
          title="Fulfillment Rate"
          value={`${summary.fulfillment_rate}%`}
          icon={<TrendingUp size={20} />}
          type="purple"
          subtitle="Orders shipped"
        />

        <KpiCard
          title="Open Exceptions"
          value={summary.open_exceptions}
          icon={<CircleAlert size={20} />}
          type="red"
          subtitle="Require attention"
        />

        <KpiCard
          title="Priority Orders"
          value={summary.priority_orders}
          icon={<Star size={20} />}
          type="orange"
          subtitle="High-priority workload"
        />

        <KpiCard
          title="Inventory Units"
          value={summary.total_inventory}
          icon={<Boxes size={20} />}
          type="cyan"
          subtitle="Units across warehouses"
        />

      </div>

      <div className="analytics-grid">

        <section className="analytics-card analytics-large">

          <ChartHeader
            title="Order Status Distribution"
            subtitle="Current fulfillment pipeline"
            icon={<BarChart3 size={17} />}
          />

          <div className="analytics-chart">
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <BarChart
                data={activeStatuses}
                margin={{
                  top: 15,
                  right: 15,
                  left: -15,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="status"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#94a3b8",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                  }}
                  cursor={{
                    fill: "#f8fafc",
                  }}
                />

                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </section>

        <section className="analytics-card">

          <ChartHeader
            title="Exception Severity"
            subtitle="Open operational issues"
            icon={<CircleAlert size={17} />}
          />

          {activeExceptions.length > 0 ? (
            <>
              <div className="analytics-pie">
                <ResponsiveContainer
                  width="100%"
                  height={210}
                >
                  <PieChart>
                    <Pie
                      data={activeExceptions}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {activeExceptions.map(
                        (entry) => (
                          <Cell
                            key={entry.severity}
                            fill={
                              SEVERITY_COLORS[
                                entry.severity
                              ] || "#64748b"
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border:
                          "1px solid #e2e8f0",
                        fontSize: "11px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pie-center">
                  <strong>
                    {summary.open_exceptions}
                  </strong>
                  <span>OPEN</span>
                </div>
              </div>

              <div className="exception-legend">
                {activeExceptions.map((item) => (
                  <div key={item.severity}>
                    <span
                      className="legend-dot"
                      style={{
                        background:
                          SEVERITY_COLORS[
                            item.severity
                          ] || "#64748b",
                      }}
                    />

                    <span>{item.severity}</span>

                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="analytics-empty">
              <CheckCircle2 size={28} />
              <strong>No open exceptions</strong>
              <span>
                Fulfillment operations are clear.
              </span>
            </div>
          )}

        </section>

      </div>

      <section className="analytics-card courier-performance">

        <ChartHeader
          title="Courier Performance"
          subtitle="Shipment volume and delivery profile"
          icon={<Truck size={17} />}
        />

        <div className="courier-table-wrapper">
          <table className="courier-table">

            <thead>
              <tr>
                <th>COURIER</th>
                <th>SHIPMENTS</th>
                <th>DELIVERY SLA</th>
                <th>COST / SHIPMENT</th>
                <th>USAGE</th>
              </tr>
            </thead>

            <tbody>
              {courier_usage.map((courier) => {
                const percentage =
                  summary.shipped_orders > 0
                    ? Math.round(
                        (courier.shipments /
                          summary.shipped_orders) *
                          100
                      )
                    : 0;

                return (
                  <tr key={courier.courier}>

                    <td>
                      <div className="courier-name">
                        <span>
                          <Truck size={14} />
                        </span>

                        <strong>
                          {courier.courier}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {courier.shipments}
                      </strong>
                    </td>

                    <td>
                      {courier.delivery_days} days
                    </td>

                    <td>
                      ₹{courier.cost}
                    </td>

                    <td>
                      <div className="courier-usage">
                        <div>
                          <span
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <strong>
                          {percentage}%
                        </strong>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      </section>

    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  type,
  subtitle,
}) {
  return (
    <div className="analytics-kpi-card">

      <div className={`analytics-kpi-icon ${type}`}>
        {icon}
      </div>

      <div className="analytics-kpi-content">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>

    </div>
  );
}

function ChartHeader({
  title,
  subtitle,
  icon,
}) {
  return (
    <div className="analytics-card-header">

      <div className="analytics-card-icon">
        {icon}
      </div>

      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

    </div>
  );
}

export default Analytics;