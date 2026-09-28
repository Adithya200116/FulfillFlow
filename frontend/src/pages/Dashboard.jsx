import { useEffect, useState } from "react";

import {
  Package,
  Flame,
  CircleCheckBig,
  TriangleAlert,
  ArrowRight,
  Activity,
  PackageCheck,
  ScanLine,
  Box,
  MapPin,
  Truck,
  Clock3,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";


function Dashboard({ setActivePage }) {
  const [dashboard, setDashboard] = useState(null);
  const [priorityOrders, setPriorityOrders] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] =
    useState(false);


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    try {
      setLoading(true);

      const [
        dashboardRes,
        ordersRes,
        exceptionsRes,
        activityRes,
      ] = await Promise.all([
        api.get("/dashboard"),
        api.get("/orders"),
        api.get("/exceptions"),
        api.get("/activity/recent?limit=10"),
      ]);

      setDashboard(dashboardRes.data);

      setPriorityOrders(
        ordersRes.data
          .filter(
            (order) =>
              order.priority &&
              order.status !== "SHIPPED"
          )
          .slice(0, 5)
      );

      setExceptions(
        exceptionsRes.data.slice(0, 5)
      );

      setRecentActivity(
        activityRes.data.activity || []
      );
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }


  async function refreshActivity() {
    try {
      setActivityLoading(true);

      const response = await api.get(
        "/activity/recent?limit=10"
      );

      setRecentActivity(
        response.data.activity || []
      );
    } catch (error) {
      console.error(
        "Activity refresh error:",
        error
      );
    } finally {
      setActivityLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="state-screen">
        Loading warehouse operations...
      </div>
    );
  }


  if (!dashboard) {
    return (
      <div className="state-screen error">
        Unable to connect to FulfillFlow API.
      </div>
    );
  }


  return (
    <div className="page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="page-header">

        <div>
          <p className="eyebrow">
            LIVE FULFILLMENT OPERATIONS
          </p>

          <h1>
            Operations Command Center
          </h1>

          <p className="description">
            See what is moving, what is blocked,
            and what needs attention.
          </p>
        </div>


        <div className="live-pill">
          <span />
          Live operations
        </div>

      </header>


      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <section className="stats-grid">

        <StatCard
          title="Orders Today"
          value={dashboard.total_orders}
          subtitle="Across all sales channels"
          icon={Package}
        />

        <StatCard
          title="Priority Orders"
          value={dashboard.priority_orders}
          subtitle="Same-day commitments"
          icon={Flame}
          type="orange"
        />

        <StatCard
          title="Shipped"
          value={dashboard.shipped_orders}
          subtitle="Completed orders"
          icon={CircleCheckBig}
          type="green"
        />

        <StatCard
          title="Need Attention"
          value={dashboard.open_exceptions}
          subtitle="Open operational exceptions"
          icon={TriangleAlert}
          type="red"
        />

      </section>


      {/* =====================================================
          FULFILLMENT PIPELINE
          ===================================================== */}

      <section className="pipeline-card">

        <div className="section-header">

          <div>
            <h3>
              Fulfillment Pipeline
            </h3>

            <p>
              Current warehouse workload
            </p>
          </div>

          <Activity size={20} />

        </div>


        <div className="pipeline">

          <PipelineItem
            number={
              dashboard.workflow.ready_to_pick
            }
            label="Ready to Pick"
          />

          <ArrowRight />

          <PipelineItem
            number={
              dashboard.workflow.picking
            }
            label="Picking"
          />

          <ArrowRight />

          <PipelineItem
            number={
              dashboard.workflow.packing
            }
            label="Packing"
          />

          <ArrowRight />

          <PipelineItem
            number={
              dashboard.workflow.staged
            }
            label="Staged"
          />

        </div>

      </section>


      {/* =====================================================
          PRIORITY + EXCEPTIONS
          ===================================================== */}

      <div className="dashboard-grid">

        {/* PRIORITY QUEUE */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Priority Queue
              </h3>

              <p>
                Same-day orders requiring
                fast action
              </p>
            </div>


            <button
              onClick={() =>
                setActivePage("orders")
              }
              className="view-button"
            >
              View all
              <ArrowRight size={14} />
            </button>

          </div>


          {priorityOrders.length === 0 && (
            <div className="dashboard-empty">
              No priority orders.
            </div>
          )}


          {priorityOrders.map((order) => (

            <div
              className="order-row"
              key={order.id}
            >

              <div className="priority-icon">
                <Flame size={17} />
              </div>


              <div className="row-content">

                <div>

                  <strong>
                    {order.order_number}
                  </strong>

                  <span className="priority-tag">
                    PRIORITY
                  </span>

                </div>

                <p>
                  {order.customer} ·{" "}
                  {order.channel}
                </p>

              </div>


              <StatusBadge
                status={order.status}
              />

            </div>

          ))}

        </section>


        {/* NEEDS ATTENTION */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h3>
                Needs Attention
              </h3>

              <p>
                Exceptions requiring action
              </p>
            </div>


            <button
              onClick={() =>
                setActivePage("exceptions")
              }
              className="view-button"
            >
              View all
              <ArrowRight size={14} />
            </button>

          </div>


          {exceptions.length === 0 && (
            <div className="dashboard-empty">
              No operational exceptions.
            </div>
          )}


          {exceptions.map((exception) => (

            <div
              className="exception-row"
              key={exception.id}
            >

              <div
                className={
                  `exception-icon ${exception.severity}`
                }
              >
                <TriangleAlert size={17} />
              </div>


              <div className="row-content">

                <div>

                  <strong>
                    {exception.exception_type
                      .replaceAll("_", " ")}
                  </strong>

                  <span
                    className={
                      `severity ${exception.severity}`
                    }
                  >
                    {exception.severity}
                  </span>

                </div>

                <p>
                  {exception.message}
                </p>

              </div>

            </div>

          ))}

        </section>

      </div>


      {/* =====================================================
          LIVE WAREHOUSE ACTIVITY
          ===================================================== */}

      <section className="warehouse-activity-panel">

        <div className="warehouse-activity-header">

          <div className="warehouse-activity-heading">

            <div className="warehouse-activity-icon">
              <Activity size={18} />
            </div>

            <div>
              <h3>
                Live Warehouse Activity
              </h3>

              <p>
                Latest fulfillment events across
                warehouse operations
              </p>
            </div>

          </div>


          <button
            className="activity-refresh-button"
            onClick={refreshActivity}
            disabled={activityLoading}
          >
            <RefreshCw
              size={14}
              className={
                activityLoading
                  ? "activity-refresh-spin"
                  : ""
              }
            />

            {activityLoading
              ? "Refreshing"
              : "Refresh"}
          </button>

        </div>


        {recentActivity.length === 0 ? (

          <div className="warehouse-activity-empty">

            <Activity size={25} />

            <strong>
              No recent activity
            </strong>

            <span>
              Warehouse events will appear here
              as orders move through fulfillment.
            </span>

          </div>

        ) : (

          <div className="warehouse-activity-list">

            {recentActivity.map(
              (event, index) => {

                const EventIcon =
                  getActivityIcon(
                    event.event_type
                  );

                return (

                  <div
                    className="warehouse-activity-row"
                    key={event.id}
                  >

                    <div className="warehouse-event-track">

                      <div
                        className={
                          `warehouse-event-icon ${
                            event.event_type ||
                            "activity"
                          }`
                        }
                      >
                        <EventIcon size={14} />
                      </div>


                      {index !==
                        recentActivity.length -
                          1 && (
                        <span className="warehouse-event-line" />
                      )}

                    </div>


                    <div className="warehouse-event-content">

                      <div className="warehouse-event-top">

                        <div>

                          <button
                            className="activity-order-number"
                            onClick={() =>
                              setActivePage("orders")
                            }
                          >
                            {event.order_number}
                          </button>

                          {event.priority && (
                            <span className="activity-priority">
                              <Flame size={10} />
                              PRIORITY
                            </span>
                          )}

                        </div>


                        <span className="activity-time">
                          <Clock3 size={11} />

                          {formatActivityTime(
                            event.timestamp
                          )}
                        </span>

                      </div>


                      <div className="warehouse-event-title">
                        {event.label}
                      </div>


                      <p>
                        {event.description}
                      </p>


                      <span className="warehouse-event-employee">
                        {event.employee}
                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}


/* =========================================================
   PIPELINE ITEM
   ========================================================= */

function PipelineItem({
  number,
  label,
}) {
  return (
    <div className="pipeline-item">
      <strong>{number}</strong>
      <span>{label}</span>
    </div>
  );
}


/* =========================================================
   ACTIVITY ICON
   ========================================================= */

function getActivityIcon(type) {

  switch (type) {

    case "verified":
      return ScanLine;

    case "picking":
      return Package;

    case "packed":
      return Box;

    case "staged":
      return MapPin;

    case "dispatched":
      return Truck;

    default:
      return PackageCheck;
  }
}


/* =========================================================
   ACTIVITY DATE
   ========================================================= */

function formatActivityTime(dateString) {

  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


export default Dashboard;