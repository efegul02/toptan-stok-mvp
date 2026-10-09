from contextlib import asynccontextmanager
from decimal import Decimal
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Product, StockMovement
from .schemas import (
    ProductCreate, ProductOut, StockBalanceOut,
    StockMovementCreate, StockMovementOut,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Sadece ilk yerel prototip içindir. Üretim sürümünde Alembic migration kullanılmalı.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Toptan Stok API",
    version="0.1.0",
    description="Geliştirme amaçlı ilk stok yazılımı API'si.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/products", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.scalars(
        select(Product).where(Product.is_active.is_(True)).order_by(Product.name)
    ).all()


@app.post("/api/v1/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        sku=payload.sku.strip(),
        name=payload.name.strip(),
        unit=payload.unit.strip(),
        min_stock=payload.min_stock,
    )
    if not product.sku or not product.name:
        raise HTTPException(status_code=422, detail="SKU ve ürün adı boş olamaz.")
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bu SKU zaten kayıtlı.")
    return product


@app.get("/api/v1/stock/movements", response_model=list[StockMovementOut])
def list_stock_movements(db: Session = Depends(get_db)):
    return db.scalars(
        select(StockMovement).order_by(StockMovement.created_at.desc(), StockMovement.id.desc()).limit(100)
    ).all()


@app.post("/api/v1/stock/movements", response_model=StockMovementOut, status_code=status.HTTP_201_CREATED)
def create_stock_movement(payload: StockMovementCreate, db: Session = Depends(get_db)):
    if payload.quantity_delta == 0:
        raise HTTPException(status_code=422, detail="Stok hareketi miktarı sıfır olamaz.")
    product = db.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Aktif ürün bulunamadı.")
    movement = StockMovement(
        product_id=payload.product_id,
        quantity_delta=payload.quantity_delta,
        reason=payload.reason.strip(),
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


@app.get("/api/v1/stock/balances", response_model=list[StockBalanceOut])
def stock_balances(db: Session = Depends(get_db)):
    statement = (
        select(
            Product.id.label("product_id"),
            Product.sku,
            Product.name,
            Product.unit,
            func.coalesce(func.sum(StockMovement.quantity_delta), 0).label("balance"),
            Product.min_stock,
        )
        .outerjoin(StockMovement, StockMovement.product_id == Product.id)
        .where(Product.is_active.is_(True))
        .group_by(Product.id, Product.sku, Product.name, Product.unit, Product.min_stock)
        .order_by(Product.name)
    )
    rows = db.execute(statement).all()
    return [
        StockBalanceOut(
            product_id=row.product_id,
            sku=row.sku,
            name=row.name,
            unit=row.unit,
            balance=Decimal(str(row.balance)),
            min_stock=row.min_stock,
        )
        for row in rows
    ]
