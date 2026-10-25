import hashlib
import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from database.db import get_db
from module5_auth.models import User
from module5_auth.schemas import UserRegister, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Module 5 - Authentication"])


def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Hash password using SHA-256 PBKDF2 with salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000  # Iterations
    ).hex()
    return pwd_hash, salt


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """FastAPI dependency to retrieve the currently authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication header"
        )
    token = authorization.split(" ")[1]
    user = db.query(User).filter(User.session_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Create a new user account with hashed password."""
    # Check if email is already taken
    email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered"
        )

    pwd_hash, salt = hash_password(payload.password)
    db_user = User(
        email=email,
        name=payload.name,
        password_hash=pwd_hash,
        salt=salt
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {exc}"
        )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate email/password, issue session token."""
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    pwd_hash, _ = hash_password(payload.password, user.salt)
    if pwd_hash != user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate session token
    session_token = uuid.uuid4().hex
    user.session_token = session_token
    try:
        db.commit()
        db.refresh(user)
        return TokenResponse(token=session_token, user=user)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {exc}"
        )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Invalidate session token."""
    current_user.session_token = None
    try:
        db.commit()
        return {"status": "success", "message": "Successfully logged out"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {exc}"
        )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the logged in user."""
    return current_user
