from enum import Enum


class OrderStatus(str, Enum):
    pending = "pending"
    inProgress = "inProgress"
    finished = "finished"
    cancelled = "cancelled"