import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Search,
  PackageX,
  Clock3,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

function NeedsAttention() {
  const [exceptions, setExceptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [resolving, setResolving] = useState(null);
  const [resolvedMessage, setResolvedMessage] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [exceptionResponse, orderResponse] =
        await Promise.all([
          api.get("/exceptions"),
          api.get("/orders"),
        ]);

      setExceptions(exceptionResponse.data);
      setOrders(orderResponse.data);
    } catch (error) {
      console.error("Exception load error:", error);
    }
  }

  function getOrder(orderId) {
    return orders.find(
      (order) => order.id === orderId
    );
  }

  async function resolveException(exception) {
    try {
      setResolving(exception.id);

      await api.patch(
        `/exceptions/${exception.id}/resolve`
      );

      setResolvedMessage(
        `Exception #${exception.id} resolved successfully.`
      );

      await loadData();

      setTimeout(() => {
        setResolvedMessage("");
      }, 3000);
    } catch (error) {
      console.error("Resolve error:", error);
    } finally {
      setResolving(null);
    }
  }

  const filteredExceptions = useMemo(() => {
    return exceptions.filter((exception) => {
      const order = getOrder(exception.order_id);

      const term = search.toLowerCase();

      const matchesSearch =
        exception.exception_type
          .toLowerCase()
          .includes(term) ||
        exception.message
          .toLowerCase()
          .includes(term) ||
        order?.order_number
          ?.toLowerCase()
          .includes(term);

      const matchesSeverity =
        severity === "ALL" ||
        exception.severity === severity;

      return matchesSearch && matchesSeverity;
    });
  }, [exceptions, orders, search, severity]);

  const criticalCount = exceptions.filter(
    (item) => item.severity === "CRITICAL"
  ).length;

  const highCount = exceptions.filter(
    (item) => item.severity === "HIGH"
  ).length;

  const mediumCount = exceptions.filter(
    (item) => item.severity === "MEDIUM"
  ).length;

  return (
    <div className="page attention-page">

      <header className="page-header">
        <div>
          <p className="eyebrow">
            EXCEPTION CONTROL
          </p>

          <h1>Needs Attention</h1>

          <p className="description">
            Resolve operational exceptions before they
            impact fulfillment.
          </p>
        </div>

        <div className="attention-live">
          <span />
          Live exception queue
        </div>
      </header>

      <section className="attention-stats">

        <StatCard
          icon={ShieldAlert}
          label="Open Exceptions"
          value={exceptions.length}
        />

        <StatCard
          icon={PackageX}
          label="Critical"
          value={criticalCount}
          type="critical"
        />

        <StatCard
          icon={AlertTriangle}
          label="High"
          value={highCount}
          type="high"
        />

        <StatCard
          icon={Clock3}
          label="Medium"
          value={mediumCount}
          type="medium"
        />

      </section>

      {criticalCount > 0 && (
        <div className="critical-banner">

          <ShieldAlert size={22} />

          <div>
            <strong>
              Immediate action required
            </strong>

            <p>
              {criticalCount} critical{" "}
              {criticalCount === 1
                ? "exception is"
                : "exceptions are"}{" "}
              currently blocking safe fulfillment.
            </p>
          </div>

        </div>
      )}

      {resolvedMessage && (
        <div className="resolved-toast">

          <CheckCircle2 size={18} />

          {resolvedMessage}

        </div>
      )}

      <section className="attention-toolbar">

        <div className="search-box">
          <Search size={16} />

          <input
            placeholder="Search order, exception or message..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="filter-select"
          value={severity}
          onChange={(event) =>
            setSeverity(event.target.value)
          }
        >
          <option value="ALL">
            All severities
          </option>

          <option value="CRITICAL">
            Critical
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="MEDIUM">
            Medium
          </option>
        </select>

        <button
          className="refresh-button"
          onClick={loadData}
        >
          <RefreshCw size={14} />
          Refresh
        </button>

      </section>

      <section className="exception-list">

        {filteredExceptions.length === 0 ? (
          <div className="all-clear">

            <div className="all-clear-icon">
              <CheckCircle2 size={30} />
            </div>

            <h2>All clear</h2>

            <p>
              There are no open exceptions matching
              your filters.
            </p>

          </div>
        ) : (
          filteredExceptions.map((exception) => {
            const order = getOrder(
              exception.order_id
            );

            return (
              <article
                className={`exception-card ${exception.severity.toLowerCase()}`}
                key={exception.id}
              >

                <div
                  className={`exception-icon ${exception.severity.toLowerCase()}`}
                >
                  <AlertTriangle size={20} />
                </div>

                <div className="exception-content">

                  <div className="exception-top">

                    <div>
                      <div className="exception-labels">

                        <span
                          className={`severity-badge ${exception.severity.toLowerCase()}`}
                        >
                          {exception.severity}
                        </span>

                        <span className="exception-type">
                          {exception.exception_type.replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                      </div>

                      <h3>
                        {exception.exception_type ===
                        "WRONG_SKU"
                          ? "Wrong product detected during picking"
                          : exception.exception_type.replaceAll(
                              "_",
                              " "
                            )}
                      </h3>

                    </div>

                    <span className="exception-id">
                      EXC-{String(
                        exception.id
                      ).padStart(4, "0")}
                    </span>

                  </div>

                  <p className="exception-message">
                    {exception.message}
                  </p>

                  <div className="exception-meta">

                    <div>
                      <span>ORDER</span>

                      <strong>
                        {order?.order_number ||
                          `Order #${exception.order_id}`}
                      </strong>
                    </div>

                    <div>
                      <span>CUSTOMER</span>

                      <strong>
                        {order?.customer || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>ORDER STATUS</span>

                      <strong>
                        {order?.status?.replaceAll(
                          "_",
                          " "
                        ) || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>CREATED</span>

                      <strong>
                        {new Date(
                          exception.created_at
                        ).toLocaleString()}
                      </strong>
                    </div>

                  </div>

                </div>

                <div className="exception-action">

                  <button
                    disabled={
                      resolving === exception.id
                    }
                    onClick={() =>
                      resolveException(exception)
                    }
                  >
                    <CheckCircle2 size={15} />

                    {resolving === exception.id
                      ? "Resolving..."
                      : "Mark Resolved"}
                  </button>

                  <small>
                    Removes from active queue
                  </small>

                </div>

              </article>
            );
          })
        )}

      </section>

    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  type = "",
}) {
  return (
    <div className="attention-stat">

      <div
        className={`attention-stat-icon ${type}`}
      >
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

    </div>
  );
}

export default NeedsAttention;