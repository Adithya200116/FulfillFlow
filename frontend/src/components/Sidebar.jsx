import {
  LayoutDashboard,
  Package,
  ScanLine,
  Warehouse,
  TriangleAlert,
  Truck,
  PackageCheck,
  BarChart3,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: Package },
  { id: "picking", label: "Picking Station", icon: ScanLine },
  { id: "packing", label: "Packing & Dispatch", icon: Truck },
  { id: "shipments", label: "Shipments", icon: PackageCheck },
  { id: "analytics", label: "Operations Analytics", icon: BarChart3 },
  { id: "inventory", label: "Inventory", icon: Warehouse },
  { id: "exceptions", label: "Needs Attention", icon: TriangleAlert },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">
          <Truck size={22} />
        </div>

        <div>
          <h2>FulfillFlow</h2>
          <span>Operations Hub</span>
        </div>
      </div>

      <p className="sidebar-label">OPERATIONS</p>

      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={
                activePage === item.id
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>

              {item.id === "exceptions" && (
                <span className="alert-dot" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="online-dot" />

        <div>
          <strong>Main Warehouse</strong>
          <small>Operations online</small>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;