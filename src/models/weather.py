import datetime

from sqlalchemy import String, Float, Integer, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.db import Base


class Weather(Base):
    __tablename__ = "weather"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    temp: Mapped[float] = mapped_column(Float, nullable=True)
    feels_like: Mapped[float] = mapped_column(Float, nullable=True)
    humidity: Mapped[int] = mapped_column(Integer, nullable=True)
    pressure: Mapped[int] = mapped_column(Integer, nullable=True)
    wind_speed: Mapped[float] = mapped_column(Float, nullable=True)
    pollution: Mapped[float] = mapped_column(Float, nullable=True)
    weather_main: Mapped[str] = mapped_column(String(50), nullable=True)
    weather_description: Mapped[str] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, default="openweather"
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "lat", "lon", "timestamp", "source", name="uidx_weather_point_time"
        ),
    )

    def __repr__(self):
        return (
            "Weather(id={id}, lat={lat}, lon={lon}, timestamp={ts}, "
            "temp={temp}, pollution={poll})".format(
                id=self.id,
                lat=self.lat,
                lon=self.lon,
                ts=self.timestamp,
                temp=self.temp,
                poll=self.pollution,
            )
        )
