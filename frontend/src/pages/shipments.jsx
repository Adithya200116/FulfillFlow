import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Truck,
  PackageCheck,
  Clock,
  MapPin,
  Copy,
  CheckCircle2,
  RefreshCw,
  X,
  Hash,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courierFilter, setCourierFilter] = useState("ALL");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadShipments = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/shipments`);

      if (!response.ok) {
        throw new Error("Unable to load shipments.");
      }

      const data = await response.json();
      setShipments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const couriers = useMemo(() => {
    return [
      ...new Set(
        shipments
          .map((shipment) => shipment.courier)
          .filter(Boolean)
      ),
    ];
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesSearch =
        !query ||
        shipment.order_number?.toLowerCase().includes(query) ||
        shipment.customer?.toLowerCase().includes(query) ||
        shipment.tracking_number?.toLowerCase().includes(query) ||
        shipment.courier?.toLowerCase().includes(query);

      const matchesCourier =
        courierFilter === "ALL" ||
        shipment.courier === courierFilter;

      return matchesSearch && matchesCourier;
    });
  }, [shipments, search, courierFilter]);

  const copyTracking = async (shipment) => {
    if (!shipment.tracking_number) return;

    try {
      await navigator.clipboard.writeText(
        shipment.tracking_number
      );

      setCopiedId(shipment.id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1800);
    } catch (error) {
      console.error("Unable to copy tracking number", error);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="shipments-page">
        <div className="shipments-loading">
          <RefreshCw className="spin" size={23} />
          <span>Loading shipments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shipments-page">

      <div className="shipments-header">
        <div>
          <p className="shipments-eyebrow">
            OUTBOUND LOGISTICS
          </p>

          <h1>Shipments & Tracking</h1>

          <p className="shipments-description">
            Monitor dispatched orders, courier handovers
            and shipment tracking.
          </p>
        </div>

        <button
          className="shipments-refresh-btn"
          onClick={loadShipments}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="shipment-stats">

        <div className="shipment-stat-card">
          <div className="shipment-stat-icon blue">
            <PackageCheck size={20} />
          </div>

          <div>
            <span>Total Shipped</span>
            <strong>{shipments.length}</strong>
          </div>
        </div>

        <div className="shipment-stat-card">
          <div className="shipment-stat-icon green">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Dispatched</span>
            <strong>{shipments.length}</strong>
          </div>
        </div>

        <div className="shipment-stat-card">
          <div className="shipment-stat-icon purple">
            <Truck size={20} />
          </div>

          <div>
            <span>Courier Partners</span>
            <strong>{couriers.length}</strong>
          </div>
        </div>

      </div>

      <div className="shipments-panel">

        <div className="shipments-toolbar">

          <div className="shipment-search">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search order, customer or tracking..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            className="shipment-filter"
            value={courierFilter}
            onChange={(event) =>
              setCourierFilter(event.target.value)
            }
          >
            <option value="ALL">
              All Couriers
            </option>

            {couriers.map((courier) => (
              <option
                key={courier}
                value={courier}
              >
                {courier}
              </option>
            ))}
          </select>

        </div>

        <div className="shipments-table-wrapper">
          <table className="shipments-table">

            <thead>
              <tr>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>COURIER</th>
                <th>TRACKING</th>
                <th>SHIPPED</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>

              {filteredShipments.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="shipments-empty"
                  >
                    <Truck size={28} />
                    <strong>No shipments found</strong>
                    <span>
                      Dispatched orders will appear here.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    onClick={() =>
                      setSelectedShipment(shipment)
                    }
                  >
                    <td>
                      <div className="shipment-order">
                        <strong>
                          {shipment.order_number}
                        </strong>

                        <span>
                          {shipment.channel}
                        </span>
                      </div>
                    </td>

                    <td>
                      {shipment.customer}
                    </td>

                    <td>
                      <div className="shipment-courier">
                        <Truck size={14} />
                        {shipment.courier}
                      </div>
                    </td>

                    <td>
                      <div className="tracking-cell">
                        <span>
                          {shipment.tracking_number || "—"}
                        </span>

                        {shipment.tracking_number && (
                          <button
                            title="Copy tracking number"
                            onClick={(event) => {
                              event.stopPropagation();
                              copyTracking(shipment);
                            }}
                          >
                            {copiedId === shipment.id ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="shipment-date">
                        <Clock size={13} />
                        {formatDate(shipment.shipped_at)}
                      </div>
                    </td>

                    <td>
                      <span className="shipped-status">
                        SHIPPED
                      </span>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>

      {selectedShipment && (
        <div
          className="shipment-drawer-overlay"
          onClick={() => setSelectedShipment(null)}
        >
          <aside
            className="shipment-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="shipment-drawer-header">
              <div>
                <span>SHIPMENT DETAILS</span>
                <h2>
                  {selectedShipment.order_number}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedShipment(null)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="shipment-success-block">
              <div>
                <CheckCircle2 size={21} />
              </div>

              <div>
                <strong>
                  Order dispatched
                </strong>

                <span>
                  Successfully handed over for delivery
                </span>
              </div>
            </div>

            <div className="shipment-detail-section">
              <h3>Tracking Information</h3>

              <DetailRow
                icon={<Hash size={15} />}
                label="Tracking Number"
                value={
                  selectedShipment.tracking_number || "—"
                }
              />

              <DetailRow
                icon={<Truck size={15} />}
                label="Courier"
                value={selectedShipment.courier}
              />

              <DetailRow
                icon={<Clock size={15} />}
                label="Shipped At"
                value={formatDate(
                  selectedShipment.shipped_at
                )}
              />

              <DetailRow
                icon={<MapPin size={15} />}
                label="Staging Location"
                value={
                  selectedShipment.staging_location || "—"
                }
              />
            </div>

            <div className="shipment-detail-section">
              <h3>Order Information</h3>

              <div className="shipment-info-grid">
                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedShipment.customer}
                  </strong>
                </div>

                <div>
                  <span>Channel</span>
                  <strong>
                    {selectedShipment.channel}
                  </strong>
                </div>

                <div>
                  <span>Delivery SLA</span>
                  <strong>
                    {selectedShipment.delivery_days
                      ? `${selectedShipment.delivery_days} days`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Pickup Time</span>
                  <strong>
                    {selectedShipment.pickup_time || "—"}
                  </strong>
                </div>
              </div>
            </div>

            {selectedShipment.tracking_number && (
              <button
                className="drawer-copy-btn"
                onClick={() =>
                  copyTracking(selectedShipment)
                }
              >
                <Copy size={15} />

                {copiedId === selectedShipment.id
                  ? "Tracking Number Copied"
                  : "Copy Tracking Number"}
              </button>
            )}

          </aside>
        </div>
      )}

    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="shipment-detail-row">
      <div className="shipment-detail-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default Shipments;