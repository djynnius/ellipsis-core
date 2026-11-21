from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, StandardColumns


class User(StandardColumns, Base):
    """Starter model. created_by / updated_by on every table hold a users.id."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
