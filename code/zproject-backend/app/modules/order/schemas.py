from pydantic import BaseModel

from app.modules.order.enums import OrderStatus


class OrderStatusUpdate(BaseModel):
    status: OrderStatus