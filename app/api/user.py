from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"]
)


@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    """Barcha foydalanuvchilarni olish."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Bitta foydalanuvchini ID bo'yicha olish."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return user


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Yangi foydalanuvchi qo'shish."""
    # Email tekshirish
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon mavjud")

    db_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone=user_data.phone,
        location=user_data.location,
        role=user_data.role or "Foydalanuvchi"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Foydalanuvchini yangilash."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Foydalanuvchini o'chirish."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    db.delete(user)
    db.commit()
    return {"detail": "Foydalanuvchi muvaffaqiyatli o'chirildi", "id": user_id}