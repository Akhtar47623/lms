import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.core.config import settings
from app.schemas import UploadOut
from app.services.security import CurrentUser, require_roles


router = APIRouter(prefix="/uploads", tags=["uploads"])
upload_path = Path(settings.upload_dir)


@router.post("", response_model=UploadOut)
def upload_file(user: CurrentUser, file: UploadFile = File(...)) -> UploadOut:
    require_roles(user, "instructor", "admin")
    upload_path.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "upload").suffix
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = upload_path / filename
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return UploadOut(filename=filename, url=f"/uploads/{filename}", content_type=file.content_type, size=destination.stat().st_size)
