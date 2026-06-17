from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./lms.db"
    secret_key: str = "dev-secret-change-me"
    access_token_minutes: int = 30
    refresh_token_days: int = 7
    frontend_origin: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    zoom_account_id: str | None = None
    zoom_client_id: str | None = None
    zoom_client_secret: str | None = None
    zoom_user_id: str = "me"
    zoom_timezone: str = "Asia/Karachi"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
