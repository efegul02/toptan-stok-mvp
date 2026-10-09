from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    unit: str = Field(default="adet", min_length=1, max_length=20)
    min_stock: Decimal = Field(default=Decimal("0"), ge=0)


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sku: str
    name: str
    unit: str
    min_stock: Decimal
    is_active: bool
    created_at: datetime


class StockMovementCreate(BaseModel):
    product_id: int
    quantity_delta: Decimal
    reason: str = Field(min_length=1, max_length=250)


class StockMovementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity_delta: Decimal
    reason: str
    created_at: datetime


class StockBalanceOut(BaseModel):
    product_id: int
    sku: str
    name: str
    unit: str
    balance: Decimal
    min_stock: Decimal
