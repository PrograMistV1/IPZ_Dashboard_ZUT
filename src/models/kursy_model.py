from sqlalchemy import Column, Integer, String, Float, Date
from base import Base

class Kursy(Base):
    __tablename__ = "kursy"

    id = Column(Integer, primary_key=True, autoincrement=True)
    currency = Column(String(10), nullable=False)       
    date = Column(Date, nullable=False)                 
    source = Column(String(20), default="NBP")          
    rate = Column(Float, nullable=False)                

    def __repr__(self):
        return f"<Kursy {self.currency} {self.date}: {self.rate}>"
