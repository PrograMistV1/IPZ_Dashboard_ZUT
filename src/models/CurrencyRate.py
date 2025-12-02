from sqlalchemy import String, Float, Date, PrimaryKeyConstraint
from sqlalchemy.orm import validates, Mapped, mapped_column
import datetime

from src.db import Base


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    rate: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("currency", "date", "source"),)

    @validates("currency")
    def validate_currency(self, key, value):
        if not value or not isinstance(value, str):
            raise ValueError("Invalid currency symbol.")
        if len(value) != 3:
            raise ValueError("Currency symbol must be 3 characters long.")
        return value

    @validates("rate")
    def validate_rate(self, key, value):
        if value <= 0:
            raise ValueError("Exchange rate must be a positive number.")
        return value

    def __repr__(self):
        return (
            f"CurrencyRate("
            f"currency='{self.currency}', "
            f"date={self.date}, "
            f"rate={self.rate}, "
            f"source='{self.source}'"
            f")"
        )
