# 📦 FulfillFlow

### Warehouse Fulfillment Operations Platform

FulfillFlow is a full-stack warehouse operations and order fulfillment platform designed to manage the complete lifecycle of an order — from warehouse picking and SKU verification to packing, staging, dispatch, shipment tracking, inventory management, exception handling, and operational analytics.

The project simulates a real-world fulfillment environment where warehouse teams need visibility into orders, inventory, operational exceptions, courier handoffs, and fulfillment performance from one centralized system.

---

## 🚀 Key Features

### 📊 Command Center

A centralized operations dashboard providing a real-time overview of warehouse activity.

Includes:

- Orders Today
- Priority Orders
- Shipped Orders
- Orders Requiring Attention
- Fulfillment Pipeline
- Priority Queue
- Exception Alerts
- Live Warehouse Activity Feed
- Manual Activity Refresh

The activity feed surfaces recent operational events such as SKU verification, packing, staging, and dispatch.

---

### 📦 Order Management

View and manage fulfillment orders from a centralized interface.

Features include:

- Order search
- Status filtering
- Priority identification
- Customer and sales-channel information
- Order item details
- Current fulfillment status
- Order-level activity history
- Shipment tracking information

---

### 🔍 Picking Station

A warehouse-focused picking workflow designed to reduce fulfillment errors.

Features:

- Ready-to-pick order queue
- SKU verification
- Item quantity visibility
- Verification status
- Incorrect SKU detection
- Warehouse activity logging

Orders progress through the fulfillment workflow only after the required items are verified.

---

### 📦 Packing & Dispatch

Manage orders after warehouse picking has been completed.

Workflow:

```text
Picking
   ↓
SKU Verification
   ↓
Packing
   ↓
Staging
   ↓
Courier Selection
   ↓
Dispatch
   ↓
Shipment
```

Features include:

- Pack verified orders
- Assign staging locations
- Select courier
- Dispatch shipments
- Generate tracking numbers
- Record operational timestamps

---

### 🚚 Shipments & Tracking

Provides visibility into dispatched orders.

Features:

- Shipment search
- Courier filtering
- Tracking numbers
- Tracking number copy action
- Shipment timestamps
- Staging location information
- Estimated delivery information
- Shipment detail drawer

---

### 🏭 Inventory Management

Provides warehouse-level stock visibility.

Features:

- SKU inventory
- Warehouse quantities
- Product information
- Rack locations
- Stock transfers between warehouses
- Inventory availability monitoring

---

### ⚠️ Exception Management

Operational problems are surfaced through the **Needs Attention** workspace.

Examples include:

- Wrong SKU detection
- Fulfillment exceptions
- Critical warehouse issues
- Order-related operational problems

This allows warehouse teams to identify and respond to fulfillment issues without losing visibility across the wider operation.

---

### 📈 Operations Analytics

FulfillFlow includes an analytics workspace powered by live backend data.

Metrics include:

- Total Orders
- Shipped Orders
- Fulfillment Rate
- Priority Orders
- Open Exceptions
- Total Inventory

Analytics also provide visibility into:

- Order status distribution
- Courier usage
- Exception breakdown

Interactive charts are implemented using Recharts.

---

### 🕒 Order Activity & Audit Trail

Each order maintains an operational activity timeline.

Events can include:

- Order Created
- SKU Verified
- Ready to Pick
- Order Packed
- Order Staged
- Order Dispatched

Each activity record can contain:

- Event type
- Employee/system actor
- Timestamp
- Operational description

This provides traceability across the complete fulfillment lifecycle.

---

## 🔄 Fulfillment Lifecycle

FulfillFlow models the following operational process:

```text
Order Created
      ↓
Ready to Pick
      ↓
Picking
      ↓
SKU Verification
      ↓
Packing
      ↓
Staging
      ↓
Courier Assignment
      ↓
Dispatch
      ↓
Shipped
```

Operational events generated throughout this lifecycle are recorded in the audit trail and surfaced through the warehouse activity feed.

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Axios
- Lucide React
- Recharts

### Backend

- Python
- FastAPI
- SQLAlchemy
- REST APIs

### Database

- SQLite

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│        React Frontend       │
│                             │
│ Dashboard                   │
│ Orders                      │
│ Picking Station             │
│ Packing & Dispatch          │
│ Shipments                   │
│ Inventory                   │
│ Exceptions                  │
│ Analytics                   │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│        FastAPI Backend      │
│                             │
│ Order Management            │
│ Fulfillment Workflow        │
│ Inventory Operations        │
│ Shipment Operations         │
│ Exception Management        │
│ Analytics                   │
│ Activity / Audit Events     │
└──────────────┬──────────────┘
               │
               │ SQLAlchemy
               ▼
┌─────────────────────────────┐
│          SQLite DB          │
│                             │
│ Orders                      │
│ Order Items                 │
│ Products                    │
│ Inventory                   │
│ Couriers                    │
│ Transfers                   │
│ Exceptions                  │
│ Order Events                │
└─────────────────────────────┘
```

---

## 📁 Project Structure

```text
FULFILLFLOW/
│
├── backend/
│   ├── database.py
│   ├── main.py
│   ├── migrate_db.py
│   ├── models.py
│   ├── requirements.txt
│   └── seed.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🔌 API Capabilities

The FastAPI backend provides REST endpoints supporting the major warehouse operations, including:

- Orders
- Order details
- Order activity timeline
- Picking
- Packing
- Staging
- Dispatch
- Shipments
- Couriers
- Inventory
- Stock transfers
- Exceptions
- Dashboard metrics
- Operations analytics
- Recent warehouse activity

FastAPI also provides interactive API documentation while the backend is running.

```text
http://127.0.0.1:8000/docs
```

---

## 💻 Running FulfillFlow Locally

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd FulfillFlow
```

---

### 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Initialize sample data if required:

```bash
python seed.py
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open another terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 📸 Screenshots

Add screenshots of the completed application here.

### Command Center

![FulfillFlow Command Center](screenshots/command-center.png)

### Orders

![FulfillFlow Orders](screenshots/orders.png)

### Picking Station

![FulfillFlow Picking Station](screenshots/picking-station.png)

### Packing & Dispatch

![FulfillFlow Packing and Dispatch](screenshots/packing-dispatch.png)

### Shipments & Tracking

![FulfillFlow Shipments](screenshots/shipments.png)

### Inventory

![FulfillFlow Inventory](screenshots/inventory.png)

### Needs Attention

![FulfillFlow Needs Attention](screenshots/needs-attention.png)

### Operations Analytics

![FulfillFlow Operations Analytics](screenshots/analytics.png)

---

## 🎯 Project Highlights

FulfillFlow demonstrates:

- Full-stack application development
- REST API design
- Relational data modeling
- Warehouse workflow modeling
- Operational dashboard development
- Inventory management
- Exception management
- Shipment lifecycle management
- Audit/event tracking
- Data visualization
- Frontend/backend integration
- Real-world business process implementation

---

## 🔮 Future Improvements

Possible future enhancements include:

- Authentication and role-based access
- Barcode scanner integration
- PostgreSQL deployment
- Automated courier integrations
- SLA monitoring
- Advanced warehouse forecasting
- Real-time WebSocket updates
- Cloud deployment
- Automated testing
- Docker containerization

---

## 👨‍💻 Author

**Adithya M Kaushik**

Data Analytics | Data Science | AI/ML | Full-Stack Development

GitHub: `Adithya200116`

---

## ⭐ About This Project

FulfillFlow was built as a portfolio project to demonstrate how software, analytics, and operational workflows can be combined to solve real-world warehouse fulfillment challenges.

The application focuses not only on displaying data, but on modeling an operational process where actions performed at one stage affect downstream warehouse activities, shipment visibility, analytics, and audit history.