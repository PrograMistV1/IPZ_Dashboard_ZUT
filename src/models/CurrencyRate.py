from sqlalchemy import Column, String, Float, Date, PrimaryKeyConstraint
from sqlalchemy.orm import validates

from src.models.base import Base


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    currency_symbol = Column(String(1), nullable=False)
    load_date = Column(Date, nullable=False)
    source = Column(String(50), nullable=False)
    exchange_rate = Column(Float, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("currency_symbol", "load_date", "source"),)

    @validates("currency_symbol")
    def validate_currency(self, key, value):
        if not value or not isinstance(value, str):
            raise ValueError("Invalid currency symbol.")
        return value

    @validates("exchange_rate")
    def validate_rate(self, key, value):
        if value <= 0:
            raise ValueError("Exchange rate must be a positive number.")
        return value

    def __repr__(self):
        return (
            f"CurrencyRate("
            f"currency_symbol='{self.currency_symbol}', "
            f"load_date={self.load_date}, "
            f"exchange_rate={self.exchange_rate}, "
            f"source='{self.source}'"
            f")"
        )
