from sqlalchemy import Column, Integer, String, Date
from .base import Base
from datetime import date

class Uzytkownik(Base):
    __tablename__ = "uzytkownicy"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(50), unique=True, nullable=False)
    haslo = Column(String(255), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    imie = Column(String(50))
    nazwisko = Column(String(50))
