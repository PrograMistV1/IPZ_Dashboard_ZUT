from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from src.back.core.config import DATABASE_URL

_engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
Base = declarative_base()
# Private session factory. Do not use directly!
# To work with the database, use the get_db() function,
# it will automatically open and close the session securely.
_session_local = sessionmaker(
    bind=_engine, autocommit=False, autoflush=False, future=True
)


def init_db():
    """Initialize database: check connection and create tables if needed."""
    try:
        with _engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection successful!")

        import src.models  # noqa: F401

        print("Tables known to Base:", list(Base.metadata.tables.keys()))
        Base.metadata.create_all(bind=_engine)
        print("All tables are up-to-date.")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        raise


def get_db():
    db = _session_local()
    try:
        yield db
    finally:
        db.close()
