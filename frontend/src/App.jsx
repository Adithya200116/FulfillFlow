import { useState } from "react";
import Orders from "./pages/Orders";
import Picking from "./pages/Picking";
import Inventory from "./pages/Inventory";
import NeedsAttention from "./pages/NeedsAttention";
import PackingDispatch from "./pages/PackingDispatch";
import Shipments from "./pages/Shipments";
import Analytics from "./pages/Analytics";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

import "./App.css";

function App() {
  const [activePage, setActivePage] =
    useState("dashboard");

    function renderPage() {
      switch (activePage) {
        case "orders":
          return <Orders />;
    
        case "picking":
          return <Picking />;

        case "packing":
          return <PackingDispatch />;

        case "shipments":
          return <Shipments />;

        case "analytics":
          return <Analytics />;
    
        case "inventory":
          return <Inventory />;
    
        case "exceptions":
          return <NeedsAttention />;
    
        case "dashboard":
        default:
          return (
            <Dashboard
              setActivePage={setActivePage}
            />
          );
      }
    }

  return (
    <div className="app">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main">
        {renderPage()}
      </main>

    </div>
  );
}

export default App;