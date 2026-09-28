from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import models

from database import engine, Base, get_db
from models import (
    Order,
    OrderItem,
    Product,
    Inventory,
    Courier,
    Transfer,
    ExceptionRecord,
    OrderEvent,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FulfillFlow API",
    description="Smart Fulfillment Operations Hub for XYZ",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Allows our future React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------
# HOME
# ---------------------------------------------------

@app.get("/")
def home():
    return {
        "application": "FulfillFlow",
        "message": "Smart Fulfillment Operations Hub",
        "status": "running",
    }


# ---------------------------------------------------
# DASHBOARD
# ---------------------------------------------------

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    total_orders = db.query(Order).count()

    priority_orders = (
        db.query(Order)
        .filter(Order.priority == True)
        .count()
    )

    shipped_orders = (
        db.query(Order)
        .filter(Order.status == "SHIPPED")
        .count()
    )

    open_exceptions = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.status == "OPEN")
        .count()
    )

    ready_to_pick = (
        db.query(Order)
        .filter(Order.status == "READY_TO_PICK")
        .count()
    )

    picking = (
        db.query(Order)
        .filter(Order.status == "PICKING")
        .count()
    )

    packing = (
        db.query(Order)
        .filter(Order.status == "PACKING")
        .count()
    )

    staged = (
        db.query(Order)
        .filter(Order.status == "STAGED")
        .count()
    )

    return {
        "total_orders": total_orders,
        "priority_orders": priority_orders,
        "shipped_orders": shipped_orders,
        "open_exceptions": open_exceptions,
        "workflow": {
            "ready_to_pick": ready_to_pick,
            "picking": picking,
            "packing": packing,
            "staged": staged,
        },
    }


# ---------------------------------------------------
# ORDERS
# ---------------------------------------------------

@app.get("/orders")
def get_orders(db: Session = Depends(get_db)):

    orders = (
        db.query(Order)
        .order_by(
            Order.priority.desc(),
            Order.ship_deadline.asc()
        )
        .all()
    )

    return orders


@app.get("/orders/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    items = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order_id)
        .all()
    )

    events = (
        db.query(OrderEvent)
        .filter(OrderEvent.order_id == order_id)
        .order_by(OrderEvent.timestamp.desc())
        .all()
    )

    return {
        "order": order,
        "items": items,
        "events": events,
    }


# ---------------------------------------------------
# UPDATE ORDER STATUS
# ---------------------------------------------------

@app.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    employee: str = "Warehouse Team",
    db: Session = Depends(get_db)
):

    valid_statuses = [
        "NEW",
        "READY_TO_PICK",
        "PICKING",
        "PACKING",
        "STAGED",
        "SHIPPED",
    ]

    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    old_status = order.status

    order.status = status

    event = OrderEvent(
        order_id=order.id,
        event=f"{old_status} → {status}",
        employee=employee,
    )

    db.add(event)
    db.commit()

    return {
        "success": True,
        "order_number": order.order_number,
        "old_status": old_status,
        "new_status": status,
    }


# ---------------------------------------------------
# SKU VERIFICATION
# ---------------------------------------------------

@app.post("/orders/{order_id}/verify")
def verify_sku(
    order_id: int,
    expected_sku: str,
    scanned_sku: str,
    db: Session = Depends(get_db)
):

    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    item = (
        db.query(OrderItem)
        .filter(
            OrderItem.order_id == order_id,
            OrderItem.sku == expected_sku
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Expected SKU does not belong to this order"
        )

    if expected_sku != scanned_sku:

        exception = ExceptionRecord(
            order_id=order_id,
            exception_type="WRONG_SKU",
            severity="CRITICAL",
            message=(
                f"Wrong item scanned. "
                f"Expected {expected_sku}, "
                f"received {scanned_sku}."
            ),
        )

        db.add(exception)
        db.commit()

        return {
            "verified": False,
            "warning": "WRONG ITEM",
            "expected": expected_sku,
            "scanned": scanned_sku,
            "message": "Do not pack this item.",
        }

    item.verified = True

    event = OrderEvent(
        order_id=order_id,
        event=f"SKU verified: {expected_sku}",
        employee="Warehouse Team",
    )

    db.add(event)
    db.commit()

    return {
        "verified": True,
        "message": "Product verified successfully.",
        "sku": expected_sku,
    }


# ---------------------------------------------------
# INVENTORY
# ---------------------------------------------------

@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):

    return (
        db.query(Inventory)
        .order_by(
            Inventory.sku,
            Inventory.warehouse
        )
        .all()
    )


# ---------------------------------------------------
# PRODUCTS
# ---------------------------------------------------

@app.get("/products")
def get_products(db: Session = Depends(get_db)):

    return db.query(Product).all()


# ---------------------------------------------------
# COURIERS
# ---------------------------------------------------

@app.get("/couriers")
def get_couriers(db: Session = Depends(get_db)):

    return db.query(Courier).all()


# ---------------------------------------------------
# EXCEPTIONS
# ---------------------------------------------------

@app.get("/exceptions")
def get_exceptions(db: Session = Depends(get_db)):

    return (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.status == "OPEN")
        .order_by(ExceptionRecord.created_at.desc())
        .all()
    )


@app.patch("/exceptions/{exception_id}/resolve")
def resolve_exception(
    exception_id: int,
    db: Session = Depends(get_db)
):

    exception = (
        db.query(ExceptionRecord)
        .filter(ExceptionRecord.id == exception_id)
        .first()
    )

    if not exception:
        raise HTTPException(
            status_code=404,
            detail="Exception not found"
        )

    exception.status = "RESOLVED"

    db.commit()

    return {
        "success": True,
        "message": "Exception resolved."
    }


# ---------------------------------------------------
# TRANSFERS
# ---------------------------------------------------

@app.get("/transfers")
def get_transfers(db: Session = Depends(get_db)):

    return db.query(Transfer).all()


@app.post("/transfers")
def create_transfer(
    sku: str,
    quantity: int,
    db: Session = Depends(get_db)
):

    if quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    secondary_stock = (
        db.query(Inventory)
        .filter(
            Inventory.sku == sku,
            Inventory.warehouse == "Warehouse 2"
        )
        .first()
    )

    if not secondary_stock:
        raise HTTPException(
            status_code=404,
            detail="SKU not found in Warehouse 2"
        )

    if secondary_stock.quantity < quantity:
        raise HTTPException(
            status_code=400,
            detail="Not enough stock in Warehouse 2"
        )

    transfer_count = db.query(Transfer).count()

    transfer = Transfer(
        transfer_number=f"TRF-{1001 + transfer_count}",
        sku=sku,
        quantity=quantity,
        from_warehouse="Warehouse 2",
        to_warehouse="Main Warehouse",
        status="REQUESTED",
    )

    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    return {
        "success": True,
        "message": "Stock transfer created.",
        "transfer": transfer,
    }
# ============================================================
# PACKING & DISPATCH WORKFLOW
# ============================================================


@app.get("/packing/orders")
def get_packing_orders(db: Session = Depends(get_db)):
    """
    Return orders currently involved in the warehouse
    packing / staging / dispatch workflow.
    """

    allowed_statuses = [
        "PICKING",
        "PACKING",
        "STAGED",
    ]

    orders = (
        db.query(models.Order)
        .filter(models.Order.status.in_(allowed_statuses))
        .order_by(
            models.Order.priority.desc(),
            models.Order.ship_deadline.asc(),
        )
        .all()
    )

    return orders


@app.patch("/orders/{order_id}/pack")
def pack_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    items = (
        db.query(models.OrderItem)
        .filter(models.OrderItem.order_id == order_id)
        .all()
    )

    if not items:
        raise HTTPException(
            status_code=400,
            detail="Order has no items",
        )

    unverified_items = [
        item for item in items if not item.verified
    ]

    if unverified_items:
        raise HTTPException(
            status_code=400,
            detail=(
                "All items must be verified before "
                "the order can be packed"
            ),
        )

    if order.status == "SHIPPED":
        raise HTTPException(
            status_code=400,
            detail="Order has already been shipped",
        )

    order.status = "PACKING"
    order.packed_at = datetime.utcnow()

    event = models.OrderEvent(
        order_id=order.id,
        event="ORDER_PACKED",
        employee="Packing Station",
    )

    db.add(event)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order packed successfully",
        "order_number": order.order_number,
        "status": order.status,
        "packed_at": order.packed_at,
    }


@app.patch("/orders/{order_id}/stage")
def stage_order(
    order_id: int,
    staging_location: str = "STAGE-A1",
    db: Session = Depends(get_db),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if not order.packed_at:
        raise HTTPException(
            status_code=400,
            detail="Order must be packed before staging",
        )

    if order.status == "SHIPPED":
        raise HTTPException(
            status_code=400,
            detail="Shipped orders cannot be staged",
        )

    order.status = "STAGED"
    order.staging_location = staging_location
    order.staged_at = datetime.utcnow()

    event = models.OrderEvent(
        order_id=order.id,
        event=f"ORDER_STAGED:{staging_location}",
        employee="Packing Station",
    )

    db.add(event)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order staged successfully",
        "order_number": order.order_number,
        "status": order.status,
        "staging_location": order.staging_location,
        "staged_at": order.staged_at,
    }


@app.patch("/orders/{order_id}/dispatch")
def dispatch_order(
    order_id: int,
    courier_id: int,
    db: Session = Depends(get_db),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if not order.staged_at:
        raise HTTPException(
            status_code=400,
            detail="Order must be staged before dispatch",
        )

    if order.status == "SHIPPED":
        raise HTTPException(
            status_code=400,
            detail="Order has already been shipped",
        )

    courier = (
        db.query(models.Courier)
        .filter(models.Courier.id == courier_id)
        .first()
    )

    if not courier:
        raise HTTPException(
            status_code=404,
            detail="Courier not found",
        )

    timestamp = datetime.utcnow()

    order.courier_id = courier.id
    order.status = "SHIPPED"
    order.shipped_at = timestamp

    order.tracking_number = (
        f"FF-{timestamp.strftime('%Y%m%d')}-"
        f"{order.id:05d}"
    )

    event = models.OrderEvent(
        order_id=order.id,
        event=f"ORDER_DISPATCHED:{courier.name}",
        employee="Dispatch Station",
    )

    db.add(event)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order dispatched successfully",
        "order_number": order.order_number,
        "status": order.status,
        "courier": courier.name,
        "tracking_number": order.tracking_number,
        "shipped_at": order.shipped_at,
    }


@app.get("/couriers")
def get_couriers(
    db: Session = Depends(get_db),
):
    return db.query(models.Courier).all()
# ============================================================
# SHIPMENTS & TRACKING
# ============================================================

@app.get("/shipments")
def get_shipments(
    db: Session = Depends(get_db),
):
    shipped_orders = (
        db.query(models.Order)
        .filter(models.Order.status == "SHIPPED")
        .order_by(models.Order.shipped_at.desc())
        .all()
    )

    shipments = []

    for order in shipped_orders:

        courier = None

        if order.courier_id:
            courier = (
                db.query(models.Courier)
                .filter(models.Courier.id == order.courier_id)
                .first()
            )

        shipments.append(
            {
                "id": order.id,
                "order_number": order.order_number,
                "customer": order.customer,
                "channel": order.channel,
                "priority": order.priority,
                "status": order.status,
                "tracking_number": order.tracking_number,
                "shipped_at": order.shipped_at,
                "staging_location": order.staging_location,

                "courier": (
                    courier.name
                    if courier
                    else "Not assigned"
                ),

                "courier_id": (
                    courier.id
                    if courier
                    else None
                ),

                "delivery_days": (
                    courier.delivery_days
                    if courier
                    else None
                ),

                "pickup_time": (
                    courier.pickup_time
                    if courier
                    else None
                ),
            }
        )

    return shipments
# ============================================================
# OPERATIONS ANALYTICS
# ============================================================

@app.get("/analytics/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
):
    orders = db.query(models.Order).all()
    inventory = db.query(models.Inventory).all()
    exceptions = db.query(models.ExceptionRecord).all()
    couriers = db.query(models.Courier).all()

    total_orders = len(orders)

    shipped_orders = [
        order for order in orders
        if order.status == "SHIPPED"
    ]

    priority_orders = [
        order for order in orders
        if order.priority
    ]

    open_exceptions = [
        exception for exception in exceptions
        if exception.status == "OPEN"
    ]

    total_inventory = sum(
        item.quantity or 0
        for item in inventory
    )

    fulfillment_rate = (
        round(
            (len(shipped_orders) / total_orders) * 100,
            1
        )
        if total_orders
        else 0
    )

    # --------------------------------------------------------
    # ORDER STATUS DISTRIBUTION
    # --------------------------------------------------------

    status_counts = {}

    for order in orders:
        status = order.status or "UNKNOWN"

        status_counts[status] = (
            status_counts.get(status, 0) + 1
        )

    order_status = [
        {
            "status": status,
            "count": count,
        }
        for status, count in status_counts.items()
    ]

    # --------------------------------------------------------
    # COURIER USAGE
    # --------------------------------------------------------

    courier_usage = []

    for courier in couriers:
        shipment_count = len(
            [
                order for order in shipped_orders
                if order.courier_id == courier.id
            ]
        )

        courier_usage.append(
            {
                "courier": courier.name,
                "shipments": shipment_count,
                "delivery_days": courier.delivery_days,
                "cost": courier.cost,
            }
        )

    courier_usage.sort(
        key=lambda item: item["shipments"],
        reverse=True,
    )

    # --------------------------------------------------------
    # EXCEPTION SEVERITY
    # --------------------------------------------------------

    severity_counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
    }

    for exception in open_exceptions:
        severity = (
            exception.severity or "LOW"
        ).upper()

        severity_counts[severity] = (
            severity_counts.get(severity, 0) + 1
        )

    exception_breakdown = [
        {
            "severity": severity,
            "count": count,
        }
        for severity, count in severity_counts.items()
    ]

    return {
        "summary": {
            "total_orders": total_orders,
            "shipped_orders": len(shipped_orders),
            "fulfillment_rate": fulfillment_rate,
            "priority_orders": len(priority_orders),
            "open_exceptions": len(open_exceptions),
            "total_inventory": total_inventory,
        },

        "order_status": order_status,

        "courier_usage": courier_usage,

        "exception_breakdown": exception_breakdown,
    }
# ============================================================
# ORDER ACTIVITY / AUDIT TRAIL
# ============================================================

@app.get("/orders/{order_id}/timeline")
def get_order_timeline(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    events = (
        db.query(models.OrderEvent)
        .filter(models.OrderEvent.order_id == order_id)
        .order_by(models.OrderEvent.timestamp.asc())
        .all()
    )

    timeline = []

    # Order creation becomes the first timeline event.
    if order.created_at:
        timeline.append(
            {
                "id": f"created-{order.id}",
                "event": "ORDER_CREATED",
                "label": "Order Created",
                "description": (
                    f"Order {order.order_number} entered "
                    f"the fulfillment workflow."
                ),
                "employee": "System",
                "timestamp": order.created_at,
            }
        )

    for event in events:
        event_name = event.event or "ACTIVITY"

        label = event_name.replace("_", " ").title()
        description = label

        # Handle events that contain additional information.
        if event_name.startswith("ORDER_STAGED:"):
            location = event_name.split(":", 1)[1]

            label = "Order Staged"
            description = (
                f"Order moved to staging location "
                f"{location}."
            )

        elif event_name.startswith("ORDER_DISPATCHED:"):
            courier = event_name.split(":", 1)[1]

            label = "Order Dispatched"
            description = (
                f"Shipment handed over to {courier}."
            )

        elif event_name == "ORDER_PACKED":
            label = "Order Packed"
            description = (
                "All verified items were packed "
                "for dispatch."
            )

        timeline.append(
            {
                "id": event.id,
                "event": event_name,
                "label": label,
                "description": description,
                "employee": (
                    event.employee or "System"
                ),
                "timestamp": event.timestamp,
            }
        )

    timeline.sort(
        key=lambda item: (
            item["timestamp"]
            if item["timestamp"]
            else datetime.min
        )
    )

    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "current_status": order.status,
        "tracking_number": order.tracking_number,
        "events": timeline,
    }
# ============================================================
# GLOBAL WAREHOUSE ACTIVITY FEED
# ============================================================

@app.get("/activity/recent")
def get_recent_activity(
    limit: int = 12,
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 50))

    events = (
        db.query(models.OrderEvent)
        .order_by(models.OrderEvent.timestamp.desc())
        .limit(limit)
        .all()
    )

    activity = []

    for event in events:

        order = (
            db.query(models.Order)
            .filter(models.Order.id == event.order_id)
            .first()
        )

        if not order:
            continue

        event_name = event.event or "ACTIVITY"

        label = (
            event_name
            .replace("_", " ")
            .replace(":", " - ")
            .title()
        )

        description = label

        event_type = "activity"

        # -----------------------------------------
        # SKU VERIFIED
        # -----------------------------------------

        if event_name.startswith("SKU_VERIFIED:"):

            sku = event_name.split(":", 1)[1]

            label = "SKU Verified"

            description = (
                f"{sku} verified for picking."
            )

            event_type = "verified"

        # -----------------------------------------
        # READY TO PICK
        # -----------------------------------------

        elif event_name.startswith("READY_TO_PICK"):

            label = "Ready to Pick"

            description = (
                "Order is ready for warehouse picking."
            )

            event_type = "picking"

        # -----------------------------------------
        # PACKED
        # -----------------------------------------

        elif event_name == "ORDER_PACKED":

            label = "Order Packed"

            description = (
                "Items packed and ready for staging."
            )

            event_type = "packed"

        # -----------------------------------------
        # STAGED
        # -----------------------------------------

        elif event_name.startswith("ORDER_STAGED:"):

            location = event_name.split(":", 1)[1]

            label = "Order Staged"

            description = (
                f"Moved to staging location {location}."
            )

            event_type = "staged"

        # -----------------------------------------
        # DISPATCHED
        # -----------------------------------------

        elif event_name.startswith(
            "ORDER_DISPATCHED:"
        ):

            courier = event_name.split(":", 1)[1]

            label = "Order Dispatched"

            description = (
                f"Shipment handed over to {courier}."
            )

            event_type = "dispatched"

        activity.append(
            {
                "id": event.id,

                "order_id": order.id,

                "order_number": (
                    order.order_number
                ),

                "event": event_name,

                "event_type": event_type,

                "label": label,

                "description": description,

                "employee": (
                    event.employee or "System"
                ),

                "timestamp": event.timestamp,

                "priority": order.priority,

                "status": order.status,
            }
        )

    return {
        "count": len(activity),
        "activity": activity,
    }