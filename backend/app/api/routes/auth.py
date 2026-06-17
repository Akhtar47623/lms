from jose import JWTError, jwt
from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.db.session import Db
from app.models import User
from app.repositories.users import assign_role, get_user_by_email
from app.schemas import ForgotPasswordIn, LoginIn, RefreshIn, RegisterIn, ResetPasswordIn, TokenAction, Tokens, UserOut
from app.services.security import CurrentUser, build_tokens, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(payload: RegisterIn, db: Db) -> dict[str, UserOut | Tokens]:
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_verified=False,
    )
    db.add(user)
    db.flush()
    assign_role(db, user, payload.role)
    db.commit()
    db.refresh(user)
    return {"user": UserOut.model_validate(user), "tokens": build_tokens(user)}


@router.post("/login")
def login(payload: LoginIn, db: Db) -> dict[str, UserOut | Tokens]:
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is cancelled")
    return {"user": UserOut.model_validate(user), "tokens": build_tokens(user)}


@router.post("/refresh", response_model=Tokens)
def refresh(payload: RefreshIn, db: Db) -> Tokens:
    try:
        decoded = jwt.decode(payload.refresh_token, settings.secret_key, algorithms=["HS256"])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user = db.get(User, int(decoded["sub"]))
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is cancelled")
    return build_tokens(user)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn) -> dict[str, str]:
    return {"detail": f"If {payload.email} exists, a reset link has been prepared."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn) -> dict[str, str]:
    return {"detail": "Password reset tokens are stubbed for local development.", "token": payload.token}


@router.post("/verify-email")
def verify_email(payload: TokenAction, user: CurrentUser, db: Db) -> dict[str, str]:
    user.is_verified = True
    db.commit()
    return {"detail": "Email verified", "token": payload.token}
