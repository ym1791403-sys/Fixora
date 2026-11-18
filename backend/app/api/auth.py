from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import hash_password, verify_password, create_access_token
from app.models.db import get_user_by_email, create_user, create_technician_profile
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate):
    existing = get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    role = user_in.role if user_in.role in ["user", "technician"] else "user"
    user = create_user(
        email=user_in.email,
        hashed_pw=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=role,
        phone=user_in.phone
    )
    
    if role == "technician":
        create_technician_profile(
            user_id=user["id"],
            business_name=f"{user['full_name']} Repair Services",
            specializations="Laptops, Smartphones, Diagnostics",
            city="Cairo",
            bio="Certified device technician",
            status="pending"
        )

    token = create_access_token(subject=user["id"])
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            phone=user.get("phone"),
            is_active=bool(user["is_active"]),
            is_verified=bool(user.get("is_verified", True)),
            created_at=user["created_at"]
        )
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin):
    user = get_user_by_email(login_in.email)
    if not user or not verify_password(login_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )

    token = create_access_token(subject=user["id"])
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            phone=user.get("phone"),
            is_active=bool(user["is_active"]),
            is_verified=bool(user.get("is_verified", True)),
            created_at=user["created_at"]
        )
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        is_active=bool(current_user["is_active"]),
        is_verified=bool(current_user.get("is_verified", True)),
        created_at=current_user["created_at"]
    )
