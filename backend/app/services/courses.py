import uuid


def make_slug(title: str) -> str:
    base = "".join(char.lower() if char.isalnum() else "-" for char in title).strip("-")
    return "-".join(part for part in base.split("-") if part) or uuid.uuid4().hex[:8]
