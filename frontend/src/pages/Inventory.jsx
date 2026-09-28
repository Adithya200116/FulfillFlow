import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Search,
  MapPin,
  ArrowRight,
  TriangleAlert,
  Warehouse,
  PackageCheck,
  X,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [transferProduct, setTransferProduct] =
    useState(null);

  const [transferQuantity, setTransferQuantity] =
    useState(1);

  const [transferMessage, setTransferMessage] =
    useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        inventoryResponse,
        productsResponse,
        transfersResponse,
      ] = await Promise.all([
        api.get("/inventory"),
        api.get("/products"),
        api.get("/transfers"),
      ]);

      setInventory(inventoryResponse.data);
      setProducts(productsResponse.data);
      setTransfers(transfersResponse.data);
    } catch (error) {
      console.error("Inventory load error:", error);
    } finally {
      setLoading(false);
    }
  }

  function stockFor(sku, warehouse) {
    const record = inventory.find(
      (item) =>
        item.sku === sku &&
        item.warehouse === warehouse
    );

    return record?.quantity ?? 0;
  }

  const inventoryRows = useMemo(() => {
    return products.map((product) => {
      const mainStock = stockFor(
        product.sku,
        "Main Warehouse"
      );

      const warehouse2Stock = stockFor(
        product.sku,
        "Warehouse 2"
      );

      return {
        ...product,
        mainStock,
        warehouse2Stock,
        totalStock: mainStock + warehouse2Stock,
      };
    });
  }, [products, inventory]);

  const filteredRows = inventoryRows.filter(
    (product) => {
      const term = search.toLowerCase();

      const matchesSearch =
        product.sku.toLowerCase().includes(term) ||
        product.name.toLowerCase().includes(term) ||
        product.variant.toLowerCase().includes(term);

      let matchesStock = true;

      if (stockFilter === "LOW") {
        matchesStock = product.mainStock <= 10;
      }

      if (stockFilter === "OUT") {
        matchesStock = product.mainStock === 0;
      }

      return matchesSearch && matchesStock;
    }
  );

  const totalUnits = inventory.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const mainUnits = inventory
    .filter(
      (item) =>
        item.warehouse === "Main Warehouse"
    )
    .reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const warehouse2Units = inventory
    .filter(
      (item) => item.warehouse === "Warehouse 2"
    )
    .reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const lowStockCount = inventoryRows.filter(
    (item) => item.mainStock <= 10
  ).length;

  async function requestTransfer() {
    if (!transferProduct) return;

    setTransferMessage(null);

    const quantity = Number(transferQuantity);

    if (!quantity || quantity <= 0) {
      setTransferMessage({
        type: "error",
        text: "Enter a valid transfer quantity.",
      });

      return;
    }

    if (
      quantity > transferProduct.warehouse2Stock
    ) {
      setTransferMessage({
        type: "error",
        text: `Warehouse 2 only has ${transferProduct.warehouse2Stock} units available.`,
      });

      return;
    }

    try {
      const response = await api.post(
        "/transfers",
        null,
        {
          params: {
            sku: transferProduct.sku,
            quantity,
          },
        }
      );

      setTransferMessage({
        type: "success",
        text: `${response.data.transfer.transfer_number} created successfully.`,
      });

      await loadData();
    } catch (error) {
      setTransferMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Unable to create transfer.",
      });
    }
  }

  function closeTransfer() {
    setTransferProduct(null);
    setTransferQuantity(1);
    setTransferMessage(null);
  }

  if (loading) {
    return (
      <div className="state-screen">
        Loading inventory...
      </div>
    );
  }

  return (
    <div className="page">

      <header className="page-header">
        <div>
          <p className="eyebrow">
            STOCK CONTROL
          </p>

          <h1>Inventory</h1>

          <p className="description">
            Monitor stock across warehouses and replenish
            the main fulfillment location.
          </p>
        </div>

        <div className="inventory-live">
          <span />
          Inventory synced
        </div>
      </header>

      <section className="inventory-stats">

        <InventoryStat
          icon={Boxes}
          title="Total Stock"
          value={totalUnits}
          subtitle="Units across both warehouses"
        />

        <InventoryStat
          icon={Warehouse}
          title="Main Warehouse"
          value={mainUnits}
          subtitle="Available for fulfillment"
        />

        <InventoryStat
          icon={PackageCheck}
          title="Warehouse 2"
          value={warehouse2Units}
          subtitle="Reserve inventory"
        />

        <InventoryStat
          icon={TriangleAlert}
          title="Low Stock"
          value={lowStockCount}
          subtitle="SKUs at 10 units or below"
          warning
        />

      </section>

      <section className="inventory-toolbar">

        <div className="search-box">
          <Search size={17} />

          <input
            placeholder="Search SKU, product or variant..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          className="filter-select"
          value={stockFilter}
          onChange={(event) =>
            setStockFilter(event.target.value)
          }
        >
          <option value="ALL">
            All inventory
          </option>

          <option value="LOW">
            Low stock
          </option>

          <option value="OUT">
            Out of stock
          </option>
        </select>

      </section>

      <section className="inventory-table-card">

        <table className="inventory-table">

          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>RACK</th>
              <th>MAIN WAREHOUSE</th>
              <th>WAREHOUSE 2</th>
              <th>TOTAL</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {filteredRows.map((product) => {

              const lowStock =
                product.mainStock <= 10;

              return (
                <tr key={product.id}>

                  <td>
                    <div className="inventory-product">

                      <div className="inventory-product-icon">
                        <Boxes size={17} />
                      </div>

                      <div>
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {product.variant}
                        </span>
                      </div>

                    </div>
                  </td>

                  <td>
                    <code>{product.sku}</code>
                  </td>

                  <td>
                    <div className="rack-cell">
                      <MapPin size={13} />
                      {product.rack_location}
                    </div>
                  </td>

                  <td>
                    <div className="stock-value">

                      <strong
                        className={
                          product.mainStock === 0
                            ? "stock-out"
                            : lowStock
                            ? "stock-low"
                            : ""
                        }
                      >
                        {product.mainStock}
                      </strong>

                      {product.mainStock === 0 && (
                        <span className="stock-label out">
                          OUT
                        </span>
                      )}

                      {product.mainStock > 0 &&
                        lowStock && (
                          <span className="stock-label low">
                            LOW
                          </span>
                        )}

                    </div>
                  </td>

                  <td>
                    <strong>
                      {product.warehouse2Stock}
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {product.totalStock}
                    </strong>
                  </td>

                  <td>
                    <button
                      className="transfer-button"
                      disabled={
                        product.warehouse2Stock === 0
                      }
                      onClick={() => {
                        setTransferProduct(product);
                        setTransferQuantity(1);
                        setTransferMessage(null);
                      }}
                    >
                      Transfer
                      <ArrowRight size={13} />
                    </button>
                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </section>

      <section className="transfer-history">

        <div className="section-header">
          <div>
            <h3>Transfer Activity</h3>

            <p>
              Warehouse 2 → Main Warehouse
            </p>
          </div>

          <span className="transfer-count">
            {transfers.length} transfers
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="no-transfers">
            No stock transfers requested yet.
          </div>
        ) : (
          <div className="transfer-list">

            {transfers
              .slice()
              .reverse()
              .slice(0, 8)
              .map((transfer) => (
                <div
                  className="transfer-row"
                  key={transfer.id}
                >

                  <div className="transfer-id">
                    <strong>
                      {transfer.transfer_number}
                    </strong>

                    <span>{transfer.sku}</span>
                  </div>

                  <div className="transfer-route">

                    <span>
                      {transfer.from_warehouse}
                    </span>

                    <ArrowRight size={14} />

                    <span>
                      {transfer.to_warehouse}
                    </span>

                  </div>

                  <div className="transfer-qty">
                    {transfer.quantity} units
                  </div>

                  <span
                    className={`transfer-status ${transfer.status}`}
                  >
                    {transfer.status}
                  </span>

                </div>
              ))}

          </div>
        )}

      </section>

      {transferProduct && (
        <div
          className="drawer-overlay"
          onClick={closeTransfer}
        >

          <aside
            className="transfer-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="drawer-header">

              <div>
                <span className="drawer-label">
                  STOCK REPLENISHMENT
                </span>

                <h2>Request Transfer</h2>
              </div>

              <button
                className="close-button"
                onClick={closeTransfer}
              >
                <X size={19} />
              </button>

            </div>

            <div className="transfer-product-summary">

              <div className="transfer-product-icon">
                <Boxes size={25} />
              </div>

              <div>
                <h3>
                  {transferProduct.name}
                </h3>

                <p>
                  {transferProduct.variant}
                </p>

                <code>
                  {transferProduct.sku}
                </code>
              </div>

            </div>

            <div className="warehouse-route-card">

              <div>
                <span>FROM</span>
                <strong>Warehouse 2</strong>

                <small>
                  {transferProduct.warehouse2Stock} units
                  available
                </small>
              </div>

              <ArrowRight size={19} />

              <div>
                <span>TO</span>
                <strong>Main Warehouse</strong>

                <small>
                  {transferProduct.mainStock} units
                  currently
                </small>
              </div>

            </div>

            <div className="transfer-form">

              <label>
                Transfer quantity
              </label>

              <input
                type="number"
                min="1"
                max={
                  transferProduct.warehouse2Stock
                }
                value={transferQuantity}
                onChange={(event) =>
                  setTransferQuantity(
                    event.target.value
                  )
                }
              />

              <p>
                Maximum available from Warehouse 2:{" "}
                <strong>
                  {transferProduct.warehouse2Stock}
                </strong>
              </p>

              <button
                className="request-transfer-button"
                onClick={requestTransfer}
              >
                Request Stock Transfer
                <ArrowRight size={15} />
              </button>

              {transferMessage?.type ===
                "success" && (
                <div className="transfer-success">
                  <CheckCircle2 size={18} />

                  <div>
                    <strong>
                      Transfer requested
                    </strong>

                    <p>
                      {transferMessage.text}
                    </p>
                  </div>
                </div>
              )}

              {transferMessage?.type ===
                "error" && (
                <div className="transfer-error">
                  <TriangleAlert size={18} />

                  <div>
                    <strong>
                      Transfer not created
                    </strong>

                    <p>
                      {transferMessage.text}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </aside>

        </div>
      )}

    </div>
  );
}

function InventoryStat({
  icon: Icon,
  title,
  value,
  subtitle,
  warning,
}) {
  return (
    <div className="inventory-stat">

      <div
        className={
          warning
            ? "inventory-stat-icon warning"
            : "inventory-stat-icon"
        }
      >
        <Icon size={18} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>

    </div>
  );
}

export default Inventory;