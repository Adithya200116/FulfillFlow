from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    ForeignKey
)

from datetime import datetime
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    variant = Column(String)
    rack_location = Column(String)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True)
    sku = Column(String, index=True)
    warehouse = Column(String)
    quantity = Column(Integer)


class Courier(Base):
    __tablename__ = "couriers"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    pickup_time = Column(String)
    cost = Column(Float)
    delivery_days = Column(Integer)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    customer = Column(String)
    channel = Column(String)
    priority = Column(Boolean, default=False)
    status = Column(String, default="NEW")
    created_at = Column(DateTime, default=datetime.utcnow)
    ship_deadline = Column(DateTime)
    courier_id = Column(Integer, ForeignKey("couriers.id"))
    staging_location = Column(String, nullable=True)

    packed_at = Column(DateTime, nullable=True)
    staged_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    tracking_number = Column(String, nullable=True)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    sku = Column(String)
    quantity = Column(Integer)
    verified = Column(Boolean, default=False)


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True)
    transfer_number = Column(String, unique=True)
    sku = Column(String)
    quantity = Column(Integer)
    from_warehouse = Column(String)
    to_warehouse = Column(String)
    status = Column(String, default="REQUESTED")
    created_at = Column(DateTime, default=datetime.utcnow)


class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    exception_type = Column(String)
    severity = Column(String)
    message = Column(String)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)


class OrderEvent(Base):
    __tablename__ = "order_events"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    event = Column(String)
    employee = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)