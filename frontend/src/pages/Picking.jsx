import { useEffect, useState } from "react";
import {
  ScanLine,
  MapPin,
  PackageCheck,
  TriangleAlert,
  CheckCircle2,
  Flame,
  Search,
} from "lucide-react";

import api from "../services/api";

function Picking() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [details, setDetails] = useState(null);

  const [scanValues, setScanValues] = useState({});
  const [results, setResults] = useState({});

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [ordersResponse, productsResponse] =
        await Promise.all([
          api.get("/orders"),
          api.get("/products"),
        ]);

      const pickable = ordersResponse.data.filter(
        (order) =>
          order.status !== "SHIPPED" &&
          order.status !== "STAGED"
      );

      setOrders(pickable);
      setProducts(productsResponse.data);
    } catch (error) {
      console.error("Picking load error:", error);
    }
  }

  async function selectOrder(order) {
    try {
      setSelectedOrder(order);
      setResults({});
      setScanValues({});

      const response = await api.get(
        `/orders/${order.id}`
      );

      setDetails(response.data);
    } catch (error) {
      console.error("Order detail error:", error);
    }
  }

  function getProduct(sku) {
    return products.find(
      (product) => product.sku === sku
    );
  }

  async function verifyItem(item) {
    const scanned = scanValues[item.id]?.trim();

    if (!scanned) {
      setResults((previous) => ({
        ...previous,
        [item.id]: {
          verified: false,
          empty: true,
          message: "Enter or scan a SKU first.",
        },
      }));

      return;
    }

    try {
      const response = await api.post(
        `/orders/${selectedOrder.id}/verify`,
        null,
        {
          params: {
            expected_sku: item.sku,
            scanned_sku: scanned,
          },
        }
      );

      setResults((previous) => ({
        ...previous,
        [item.id]: response.data,
      }));
    } catch (error) {
      console.error("Verification error:", error);
    }
  }

  async function startPicking() {
    try {
      await api.patch(
        `/orders/${selectedOrder.id}/status`,
        null,
        {
          params: {
            status: "PICKING",
            employee: "Warehouse Operator",
          },
        }
      );

      setSelectedOrder((previous) => ({
        ...previous,
        status: "PICKING",
      }));

      await loadData();
    } catch (error) {
      console.error("Unable to start picking:", error);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();

    return (
      order.order_number.toLowerCase().includes(term) ||
      order.customer.toLowerCase().includes(term)
    );
  });

  const allVerified =
    details?.items?.length > 0 &&
    details.items.every(
      (item) => results[item.id]?.verified
    );

  return (
    <div className="page picking-page">

      <header className="page-header">
        <div>
          <p className="eyebrow">
            WAREHOUSE EXECUTION
          </p>

          <h1>Picking Station</h1>

          <p className="description">
            Pick the right product, from the right rack,
            for the right order.
          </p>
        </div>

        <div className="scanner-status">
          <span />
          Scanner ready
        </div>
      </header>

      <div className="picking-layout">

        <section className="pick-queue">

          <div className="pick-queue-header">
            <div>
              <h3>Pick Queue</h3>
              <p>
                {filteredOrders.length} orders available
              </p>
            </div>
          </div>

          <div className="pick-search">
            <Search size={15} />

            <input
              placeholder="Find order..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="pick-order-list">

            {filteredOrders.slice(0, 40).map(
              (order) => (
                <button
                  key={order.id}
                  className={
                    selectedOrder?.id === order.id
                      ? "pick-order active"
                      : "pick-order"
                  }
                  onClick={() => selectOrder(order)}
                >
                  <div>
                    <div className="pick-order-number">
                      {order.priority && (
                        <Flame size={12} />
                      )}

                      <strong>
                        {order.order_number}
                      </strong>
                    </div>

                    <span>{order.customer}</span>
                  </div>

                  <small>
                    {order.status.replaceAll("_", " ")}
                  </small>
                </button>
              )
            )}

          </div>

        </section>

        <section className="pick-workspace">

          {!selectedOrder ? (
            <div className="pick-empty">

              <div className="pick-empty-icon">
                <ScanLine size={32} />
              </div>

              <h2>Select an order to begin</h2>

              <p>
                Choose an order from the pick queue.
              </p>

            </div>
          ) : (
            <>

              <div className="pick-workspace-header">

                <div>
                  <span className="workspace-label">
                    ACTIVE PICK
                  </span>

                  <h2>
                    {selectedOrder.order_number}
                  </h2>

                  <p>
                    {selectedOrder.customer} ·{" "}
                    {selectedOrder.channel}
                  </p>
                </div>

                {selectedOrder.status !== "PICKING" && (
                  <button
                    className="primary-button"
                    onClick={startPicking}
                  >
                    <ScanLine size={16} />
                    Start Picking
                  </button>
                )}

                {selectedOrder.status === "PICKING" && (
                  <span className="picking-active-badge">
                    <span />
                    Picking in progress
                  </span>
                )}

              </div>

              <div className="pick-instruction">
                <ScanLine size={18} />

                <div>
                  <strong>
                    Scan before packing
                  </strong>

                  <p>
                    Verify every item against its expected
                    SKU. Incorrect variants will be blocked.
                  </p>
                </div>
              </div>

              <div className="pick-items">

                {details?.items?.map((item) => {
                  const product = getProduct(item.sku);
                  const result = results[item.id];

                  return (
                    <div
                      className="pick-item-card"
                      key={item.id}
                    >

                      <div className="pick-item-top">

                        <div className="product-placeholder">
                          <PackageCheck size={25} />
                        </div>

                        <div className="pick-product-info">

                          <span className="product-label">
                            PICK THIS ITEM
                          </span>

                          <h3>
                            {product?.name || item.sku}
                          </h3>

                          <p>
                            {product?.variant ||
                              "Standard variant"}
                          </p>

                        </div>

                        <div className="pick-quantity">
                          <span>QTY</span>
                          <strong>{item.quantity}</strong>
                        </div>

                      </div>

                      <div className="pick-location">

                        <div>
                          <MapPin size={16} />

                          <span>Rack location</span>
                        </div>

                        <strong>
                          {product?.rack_location ||
                            "Not assigned"}
                        </strong>

                      </div>

                      <div className="expected-sku">
                        <span>EXPECTED SKU</span>

                        <strong>{item.sku}</strong>
                      </div>

                      <div className="scan-area">

                        <div className="scan-input">
                          <ScanLine size={17} />

                          <input
                            placeholder="Scan or enter SKU..."
                            value={
                              scanValues[item.id] || ""
                            }
                            onChange={(event) =>
                              setScanValues(
                                (previous) => ({
                                  ...previous,
                                  [item.id]:
                                    event.target.value,
                                })
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter"
                              ) {
                                verifyItem(item);
                              }
                            }}
                          />
                        </div>

                        <button
                          className="verify-button"
                          onClick={() =>
                            verifyItem(item)
                          }
                        >
                          Verify
                        </button>

                      </div>

                      {result?.verified && (
                        <div className="verify-success">

                          <CheckCircle2 size={19} />

                          <div>
                            <strong>
                              Correct item verified
                            </strong>

                            <p>
                              SKU {item.sku} is safe
                              to pack.
                            </p>
                          </div>

                        </div>
                      )}

                      {result &&
                        !result.verified &&
                        !result.empty && (
                          <div className="verify-danger">

                            <TriangleAlert size={23} />

                            <div>
                              <strong>
                                WRONG ITEM — DO NOT PACK
                              </strong>

                              <p>
                                Expected {item.sku}, but{" "}
                                {scanValues[item.id]} was
                                scanned.
                              </p>

                              <span>
                                A critical exception has
                                been created automatically.
                              </span>
                            </div>

                          </div>
                        )}

                      {result?.empty && (
                        <div className="verify-warning">
                          Enter or scan a SKU before
                          verification.
                        </div>
                      )}

                    </div>
                  );
                })}

              </div>

              {allVerified && (
                <div className="all-verified">

                  <CheckCircle2 size={22} />

                  <div>
                    <strong>
                      All items verified
                    </strong>

                    <p>
                      This order is ready to move to
                      packing.
                    </p>
                  </div>

                </div>
              )}

            </>
          )}

        </section>

      </div>

    </div>
  );
}

export default Picking;