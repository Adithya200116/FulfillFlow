import { useEffect, useState } from "react";
import {
  PackageCheck,
  MapPin,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Boxes,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function PackingDispatch() {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ordersResponse, couriersResponse] = await Promise.all([
        fetch(`${API_URL}/packing/orders`),
        fetch(`${API_URL}/couriers`),
      ]);

      if (!ordersResponse.ok || !couriersResponse.ok) {
        throw new Error("Unable to load fulfillment data.");
      }

      const ordersData = await ordersResponse.json();
      const couriersData = await couriersResponse.json();

      setOrders(ordersData);
      setCouriers(couriersData);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  const performAction = async (orderId, endpoint) => {
    try {
      setProcessingId(orderId);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Operation failed.");
      }

      showMessage("success", data.message);
      await loadData();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePack = (order) => {
    performAction(
      order.id,
      `/orders/${order.id}/pack`
    );
  };

  const handleStage = (order) => {
    performAction(
      order.id,
      `/orders/${order.id}/stage?staging_location=STAGE-A1`
    );
  };

  const handleDispatch = async (order, courierId) => {
    if (!courierId) {
      showMessage("error", "Select a courier before dispatch.");
      return;
    }

    await performAction(
      order.id,
      `/orders/${order.id}/dispatch?courier_id=${courierId}`
    );
  };

  const packingOrders = orders.filter(
    (order) => order.status === "PICKING"
  );

  const stagingOrders = orders.filter(
    (order) => order.status === "PACKING"
  );

  const dispatchOrders = orders.filter(
    (order) => order.status === "STAGED"
  );

  if (loading) {
    return (
      <div className="packing-page">
        <div className="packing-loading">
          <RefreshCw size={24} className="spin" />
          <span>Loading fulfillment workflow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="packing-page">

      <div className="packing-header">
        <div>
          <p className="page-eyebrow">
            FULFILLMENT EXECUTION
          </p>

          <h1>Packing & Dispatch</h1>

          <p className="page-description">
            Pack verified orders, stage shipments and hand
            them over to the right courier.
          </p>
        </div>

        <div className="dispatch-live">
          <span className="live-dot" />
          Dispatch station online
        </div>
      </div>

      {message && (
        <div
          className={
            message.type === "success"
              ? "packing-message success"
              : "packing-message error"
          }
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{message.text}</span>
        </div>
      )}

      <div className="packing-summary">

        <div className="packing-stat">
          <div className="stat-icon blue">
            <Boxes size={20} />
          </div>

          <div>
            <span>Ready to Pack</span>
            <strong>{packingOrders.length}</strong>
          </div>
        </div>

        <div className="packing-stat">
          <div className="stat-icon orange">
            <PackageCheck size={20} />
          </div>

          <div>
            <span>Packing</span>
            <strong>{stagingOrders.length}</strong>
          </div>
        </div>

        <div className="packing-stat">
          <div className="stat-icon purple">
            <MapPin size={20} />
          </div>

          <div>
            <span>Ready to Dispatch</span>
            <strong>{dispatchOrders.length}</strong>
          </div>
        </div>

      </div>

      <div className="packing-board">

        <WorkflowColumn
          title="Ready to Pack"
          subtitle="Verified orders awaiting packing"
          icon={<Boxes size={18} />}
          orders={packingOrders}
          emptyText="No orders waiting for packing"
        >
          {(order) => (
            <button
              className="workflow-primary-btn"
              disabled={processingId === order.id}
              onClick={() => handlePack(order)}
            >
              <PackageCheck size={16} />

              {processingId === order.id
                ? "Packing..."
                : "Pack Order"}
            </button>
          )}
        </WorkflowColumn>

        <WorkflowColumn
          title="Packing"
          subtitle="Packed orders awaiting staging"
          icon={<PackageCheck size={18} />}
          orders={stagingOrders}
          emptyText="No packed orders waiting"
        >
          {(order) => (
            <button
              className="workflow-primary-btn"
              disabled={processingId === order.id}
              onClick={() => handleStage(order)}
            >
              <MapPin size={16} />

              {processingId === order.id
                ? "Staging..."
                : "Move to Staging"}
            </button>
          )}
        </WorkflowColumn>

        <WorkflowColumn
          title="Dispatch"
          subtitle="Staged orders ready for courier"
          icon={<Truck size={18} />}
          orders={dispatchOrders}
          emptyText="No orders ready for dispatch"
        >
          {(order) => (
            <DispatchAction
              order={order}
              couriers={couriers}
              processing={processingId === order.id}
              onDispatch={handleDispatch}
            />
          )}
        </WorkflowColumn>

      </div>
    </div>
  );
}


function WorkflowColumn({
  title,
  subtitle,
  icon,
  orders,
  emptyText,
  children,
}) {
  return (
    <section className="workflow-column">

      <div className="workflow-column-header">
        <div className="workflow-column-title">
          <span className="workflow-column-icon">
            {icon}
          </span>

          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <span className="workflow-count">
          {orders.length}
        </span>
      </div>

      <div className="workflow-list">

        {orders.length === 0 ? (
          <div className="workflow-empty">
            <CheckCircle2 size={25} />
            <p>{emptyText}</p>
          </div>
        ) : (
          orders.map((order) => (
            <article
              className="workflow-card"
              key={order.id}
            >
              <div className="workflow-card-top">

                <div>
                  <span className="order-label">
                    ORDER
                  </span>

                  <h3>{order.order_number}</h3>
                </div>

                {order.priority && (
                  <span className="priority-pill">
                    PRIORITY
                  </span>
                )}

              </div>

              <div className="workflow-customer">
                {order.customer}
                <span>•</span>
                {order.channel}
              </div>

              <div className="workflow-details">

                <div>
                  <Clock size={14} />

                  <span>
                    {order.ship_deadline
                      ? new Date(
                          order.ship_deadline
                        ).toLocaleString()
                      : "No deadline"}
                  </span>
                </div>

                {order.staging_location && (
                  <div>
                    <MapPin size={14} />
                    <span>
                      {order.staging_location}
                    </span>
                  </div>
                )}

              </div>

              <div className="workflow-action">
                {children(order)}
              </div>

            </article>
          ))
        )}

      </div>
    </section>
  );
}


function DispatchAction({
  order,
  couriers,
  processing,
  onDispatch,
}) {
  const [courierId, setCourierId] = useState("");

  return (
    <div className="dispatch-action">

      <select
        value={courierId}
        disabled={processing}
        onChange={(event) =>
          setCourierId(event.target.value)
        }
      >
        <option value="">
          Select courier
        </option>

        {couriers.map((courier) => (
          <option
            key={courier.id}
            value={courier.id}
          >
            {courier.name} · {courier.delivery_days}d
          </option>
        ))}
      </select>

      <button
        className="workflow-primary-btn"
        disabled={processing || !courierId}
        onClick={() =>
          onDispatch(order, courierId)
        }
      >
        <Truck size={16} />

        {processing
          ? "Dispatching..."
          : "Dispatch Order"}
      </button>

    </div>
  );
}


export default PackingDispatch;