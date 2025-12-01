from src.models.base import Base
from src.models.database import engine

Base.metadata.create_all(bind=engine)
print("Database initialized and tables created.")
