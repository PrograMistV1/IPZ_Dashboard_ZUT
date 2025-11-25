from .database import engine
from .base import Base
from .kursy_model import Kursy
from .uzytkownik_model import Uzytkownik

Base.metadata.create_all(bind=engine)
print("Database initialized and tables created.")
