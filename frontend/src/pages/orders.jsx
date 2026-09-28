import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Flame,
  Package,
  X,
  Clock,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import api from "../services/api";
import StatusBadge from "../components/StatusBadge";


function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityOnly, setPriorityOnly] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderTimeline, setOrderTimeline] = useState(null);

  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadOrders();
  }, []);


  async function loadOrders() {
    try {
      const response = await api.get("/orders");

      setOrders(response.data);
    } catch (error) {
      console.error(
        "Unable to load orders:",
        error
      );
    } finally {
      setLoading(false);
    }
  }


  async function openOrder(order) {
    try {
      setSelectedOrder(order);
      setOrderDetails(null);
      setOrderTimeline(null);

      const [
        detailsResponse,
        timelineResponse,
      ] = await Promise.all([
        api.get(`/orders/${order.id}`),
        api.get(`/orders/${order.id}/timeline`),
      ]);

      setOrderDetails(detailsResponse.data);
      setOrderTimeline(timelineResponse.data);
    } catch (error) {
      console.error(
        "Unable to load order details:",
        error
      );
    }
  }


  function closeOrder() {
    setSelectedOrder(null);
    setOrderDetails(null);
    setOrderTimeline(null);
  }


  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = search.toLowerCase();

      const matchesSearch =
        order.order_number
          .toLowerCase()
          .includes(term) ||
        order.customer
          .toLowerCase()
          .includes(term) ||
        order.channel
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      const matchesPriority =
        !priorityOnly || order.priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    priorityOnly,
  ]);


  if (loading) {
    return (
      <div className="state-screen">
        Loading orders...
      </div>
    );
  }


  return (
    <div className="page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <header className="page-header">

        <div>
          <p className="eyebrow">
            ORDER OPERATIONS
          </p>

          <h1>Orders</h1>

          <p className="description">
            Track every order from receipt to courier
            handover.
          </p>
        </div>


        <div className="order-total">

          <Package size={17} />

          <div>
            <strong>{orders.length}</strong>
            <span>Total orders</span>
          </div>

        </div>

      </header>


      {/* =====================================================
          FILTERS
          ===================================================== */}

      <section className="orders-toolbar">

        <div className="search-box">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search order, customer or channel..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <select
          className="filter-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="NEW">
            New
          </option>

          <option value="READY_TO_PICK">
            Ready to Pick
          </option>

          <option value="PICKING">
            Picking
          </option>

          <option value="PACKING">
            Packing
          </option>

          <option value="STAGED">
            Staged
          </option>

          <option value="SHIPPED">
            Shipped
          </option>
        </select>


        <button
          className={
            priorityOnly
              ? "priority-filter active"
              : "priority-filter"
          }
          onClick={() =>
            setPriorityOnly(!priorityOnly)
          }
        >
          <Flame size={16} />
          Priority only
        </button>

      </section>


      <div className="results-summary">
        Showing{" "}
        <strong>
          {filteredOrders.length}
        </strong>{" "}
        of {orders.length} orders
      </div>


      {/* =====================================================
          ORDERS TABLE
          ===================================================== */}

      <section className="orders-table-card">

        <table className="orders-table">

          <thead>
            <tr>
              <th>ORDER</th>
              <th>CUSTOMER</th>
              <th>CHANNEL</th>
              <th>STATUS</th>
              <th>SHIP DEADLINE</th>
              <th></th>
            </tr>
          </thead>


          <tbody>

            {filteredOrders.map((order) => (

              <tr
                key={order.id}
                onClick={() =>
                  openOrder(order)
                }
              >

                <td>

                  <div className="order-number-cell">

                    {order.priority && (
                      <div className="mini-priority">
                        <Flame size={13} />
                      </div>
                    )}


                    <div>

                      <strong>
                        {order.order_number}
                      </strong>

                      {order.priority && (
                        <span>
                          SAME-DAY PRIORITY
                        </span>
                      )}

                    </div>

                  </div>

                </td>


                <td>
                  {order.customer}
                </td>


                <td>
                  <span className="channel-pill">
                    {order.channel}
                  </span>
                </td>


                <td>
                  <StatusBadge
                    status={order.status}
                  />
                </td>


                <td>

                  <div className="deadline-cell">

                    <Clock size={14} />

                    {formatDeadline(
                      order.ship_deadline
                    )}

                  </div>

                </td>


                <td>
                  <ArrowRight
                    size={16}
                    className="table-arrow"
                  />
                </td>

              </tr>

            ))}

          </tbody>

        </table>


        {filteredOrders.length === 0 && (
          <div className="empty-orders">
            No orders match these filters.
          </div>
        )}

      </section>


      {/* =====================================================
          ORDER DETAILS DRAWER
          ===================================================== */}

      {selectedOrder && (

        <div
          className="drawer-overlay"
          onClick={closeOrder}
        >

          <aside
            className="order-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* DRAWER HEADER */}

            <div className="drawer-header">

              <div>

                <span className="drawer-label">
                  ORDER DETAILS
                </span>

                <h2>
                  {selectedOrder.order_number}
                </h2>

              </div>


              <button
                className="close-button"
                onClick={closeOrder}
                aria-label="Close order details"
              >
                <X size={19} />
              </button>

            </div>


            {/* STATUS */}

            <div className="drawer-status">

              <StatusBadge
                status={selectedOrder.status}
              />

              {selectedOrder.priority && (
                <span className="drawer-priority">
                  <Flame size={13} />
                  Priority
                </span>
              )}

            </div>


            {/* =================================================
                ORDER INFORMATION
                ================================================= */}

            <div className="detail-section">

              <h3>
                Order information
              </h3>

              <DetailRow
                label="Customer"
                value={
                  selectedOrder.customer
                }
              />

              <DetailRow
                label="Sales channel"
                value={
                  selectedOrder.channel
                }
              />

              <DetailRow
                label="Ship deadline"
                value={formatDeadline(
                  selectedOrder.ship_deadline
                )}
              />

              {orderTimeline?.current_status && (
                <DetailRow
                  label="Current status"
                  value={formatStatus(
                    orderTimeline.current_status
                  )}
                />
              )}

            </div>


            {/* =================================================
                ITEMS
                ================================================= */}

            <div className="detail-section">

              <h3>
                <ShoppingBag size={15} />
                Items
              </h3>


              {!orderDetails && (
                <p className="drawer-loading">
                  Loading items...
                </p>
              )}


              {orderDetails?.items?.length ===
                0 && (
                <p className="empty-activity">
                  No items found for this order.
                </p>
              )}


              {orderDetails?.items?.map(
                (item) => (

                  <div
                    className="drawer-item"
                    key={item.id}
                  >

                    <div>
                      <strong>
                        {item.sku}
                      </strong>

                      <span>
                        SKU
                      </span>
                    </div>


                    <div>
                      <strong>
                        × {item.quantity}
                      </strong>

                      <span>
                        Quantity
                      </span>
                    </div>

                  </div>

                )
              )}

            </div>


            {/* =================================================
                ACTIVITY TIMELINE
                ================================================= */}

            <div className="detail-section activity-section">

              <h3>
                <Clock size={15} />
                Activity Timeline
              </h3>


              {!orderTimeline && (
                <p className="drawer-loading">
                  Loading activity...
                </p>
              )}


              {orderTimeline?.events?.length ===
                0 && (
                <p className="empty-activity">
                  No workflow activity recorded yet.
                </p>
              )}


              {orderTimeline?.events?.length >
                0 && (

                <div className="order-timeline">

                  {orderTimeline.events.map(
                    (event, index) => {

                      const isLast =
                        index ===
                        orderTimeline.events.length -
                          1;

                      return (

                        <div
                          className="order-timeline-event"
                          key={event.id}
                        >

                          <div className="timeline-marker">

                            <div
                              className={
                                isLast
                                  ? "timeline-dot active"
                                  : "timeline-dot"
                              }
                            />

                            {!isLast && (
                              <div className="timeline-line" />
                            )}

                          </div>


                          <div className="timeline-content">

                            <div className="timeline-title-row">

                              <strong>
                                {event.label}
                              </strong>

                              <span>
                                {formatActivityTime(
                                  event.timestamp
                                )}
                              </span>

                            </div>


                            <p>
                              {event.description}
                            </p>


                            <div className="timeline-employee">
                              {event.employee}
                            </div>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              )}


              {/* TRACKING NUMBER */}

              {orderTimeline?.tracking_number && (

                <div className="timeline-tracking">

                  <span>
                    TRACKING NUMBER
                  </span>

                  <strong>
                    {
                      orderTimeline.tracking_number
                    }
                  </strong>

                </div>

              )}

            </div>

          </aside>

        </div>

      )}

    </div>
  );
}


/* =========================================================
   REUSABLE DETAIL ROW
   ========================================================= */

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}


/* =========================================================
   FORMAT DEADLINE
   ========================================================= */

function formatDeadline(dateString) {
  if (!dateString) return "—";

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


/* =========================================================
   FORMAT ACTIVITY TIME
   ========================================================= */

function formatActivityTime(dateString) {
  if (!dateString) return "—";

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


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(status) {
  if (!status) return "—";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


export default Orders;