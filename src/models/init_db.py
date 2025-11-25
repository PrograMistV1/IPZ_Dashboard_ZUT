from .database import engine
from .base import Base
from .kursy_model import Kursy

Base.metadata.create_all(bind=engine)
print("Database initialized and tables created.")
