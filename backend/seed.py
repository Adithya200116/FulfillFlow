import random
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
from models import (
    Product,
    Inventory,
    Courier,
    Order,
    OrderItem,
    ExceptionRecord,
)

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# -------------------------
# COURIERS
# -------------------------

couriers = [
    Courier(
        name="BlueDart",
        pickup_time="17:00",
        cost=110,
        delivery_days=2
    ),
    Courier(
        name="Delhivery",
        pickup_time="18:30",
        cost=85,
        delivery_days=3
    ),
    Courier(
        name="Xpressbees",
        pickup_time="16:30",
        cost=75,
        delivery_days=4
    ),
]

db.add_all(couriers)
db.commit()


# -------------------------
# PRODUCTS
# -------------------------

products = [
    Product(
        sku="WM-BLK-01",
        name="Wireless Mouse",
        variant="Black",
        rack_location="A-12"
    ),
    Product(
        sku="WM-WHT-01",
        name="Wireless Mouse",
        variant="White",
        rack_location="A-13"
    ),
    Product(
        sku="KB-RGB-01",
        name="Mechanical Keyboard",
        variant="RGB",
        rack_location="B-04"
    ),
    Product(
        sku="TSHIRT-BLK-M",
        name="Classic T-Shirt",
        variant="Black / Medium",
        rack_location="C-08"
    ),
    Product(
        sku="TSHIRT-BLK-L",
        name="Classic T-Shirt",
        variant="Black / Large",
        rack_location="C-09"
    ),
    Product(
        sku="HP-BLK-01",
        name="Bluetooth Headphones",
        variant="Black",
        rack_location="D-02"
    ),
    Product(
        sku="USB-C-01",
        name="USB-C Cable",
        variant="1 Metre",
        rack_location="A-21"
    ),
    Product(
        sku="PB-10K-01",
        name="Power Bank",
        variant="10000mAh",
        rack_location="D-11"
    ),
]

db.add_all(products)
db.commit()


# -------------------------
# INVENTORY
# -------------------------

for product in products:

    db.add(
        Inventory(
            sku=product.sku,
            warehouse="Main Warehouse",
            quantity=random.randint(0, 35)
        )
    )

    db.add(
        Inventory(
            sku=product.sku,
            warehouse="Warehouse 2",
            quantity=random.randint(10, 50)
        )
    )

db.commit()


# -------------------------
# ORDERS
# -------------------------

statuses = [
    "NEW",
    "READY_TO_PICK",
    "PICKING",
    "PACKING",
    "STAGED",
    "SHIPPED"
]

channels = [
    "Amazon",
    "Flipkart",
    "Website"
]

customers = [
    "Aarav Sharma",
    "Ananya Rao",
    "Rohan Mehta",
    "Priya Nair",
    "Vikram Singh",
    "Neha Kapoor",
    "Arjun Patel",
    "Kavya Reddy",
    "Rahul Verma",
    "Sneha Iyer"
]


for i in range(1, 301):

    priority = random.random() < 0.08

    created_at = datetime.now() - timedelta(
        minutes=random.randint(5, 600)
    )

    if priority:
        deadline = created_at + timedelta(hours=4)
    else:
        deadline = created_at + timedelta(hours=12)

    order = Order(
        order_number=f"ORD-{1000 + i}",
        customer=random.choice(customers),
        channel=random.choice(channels),
        priority=priority,
        status=random.choice(statuses),
        created_at=created_at,
        ship_deadline=deadline,
        courier_id=random.randint(1, 3)
    )

    db.add(order)

    # Gives us the order ID before final commit
    db.flush()

    item_count = random.randint(1, 3)

    selected_products = random.sample(
        products,
        item_count
    )

    for product in selected_products:

        item = OrderItem(
            order_id=order.id,
            sku=product.sku,
            quantity=random.randint(1, 3)
        )

        db.add(item)


db.commit()


# -------------------------
# OPERATIONAL EXCEPTIONS
# -------------------------

orders = db.query(Order).limit(30).all()

exception_types = [
    (
        "PRIORITY_RISK",
        "CRITICAL",
        "Priority order is approaching its shipping deadline."
    ),
    (
        "STOCK_SHORTAGE",
        "HIGH",
        "Required stock is unavailable in the Main Warehouse."
    ),
    (
        "COURIER_RISK",
        "HIGH",
        "Courier pickup deadline is approaching."
    ),
    (
        "PICKING_DELAY",
        "MEDIUM",
        "Order has remained in picking longer than expected."
    ),
]


for order in random.sample(orders, 10):

    exception_type, severity, message = random.choice(
        exception_types
    )

    db.add(
        ExceptionRecord(
            order_id=order.id,
            exception_type=exception_type,
            severity=severity,
            message=message
        )
    )


db.commit()
db.close()

print("-----------------------------------------")
print(" FulfillFlow demo database created!")
print("-----------------------------------------")
print(" 300 orders")
print(" 8 products")
print(" 2 warehouses")
print(" 3 couriers")
print(" 10 operational exceptions")
print("-----------------------------------------")