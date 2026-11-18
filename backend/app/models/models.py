from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # 'user', 'technician', 'admin'
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    devices = relationship("Device", back_populates="owner", cascade="all, delete-orphan")
    diagnoses = relationship("DiagnosisReport", back_populates="user", cascade="all, delete-orphan")
    technician_profile = relationship("TechnicianProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    repair_requests = relationship("RepairRequest", back_populates="customer", foreign_keys="RepairRequest.user_id")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)  # Computer, Laptop, Smartphone, Tablet, etc.
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    purchase_year = Column(Integer, nullable=True)
    os_version = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    owner = relationship("User", back_populates="devices")

class DiagnosisReport(Base):
    __tablename__ = "diagnosis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Can be guest or registered user
    device_category = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    problem_category = Column(String(100), nullable=True)  # Hardware, Software, Network
    raw_description = Column(Text, nullable=False)
    extracted_symptoms = Column(Text, nullable=True)  # JSON or comma-separated tags
    severity_level = Column(String(50), default="medium")  # 'low', 'medium', 'high', 'critical'
    confidence_score = Column(Float, default=0.85)  # 0.0 - 1.0
    possible_causes = Column(Text, nullable=False)  # JSON array of causes with probability
    recommended_steps = Column(Text, nullable=False)  # JSON array of step instructions
    required_tools = Column(Text, nullable=True)  # JSON array of tool names
    estimated_difficulty = Column(String(50), default="moderate")  # 'easy', 'moderate', 'hard', 'expert'
    estimated_minutes = Column(Integer, default=30)
    safety_warnings = Column(Text, nullable=True)  # JSON array of safety warnings
    requires_technician = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="diagnoses")
    repair_requests = relationship("RepairRequest", back_populates="diagnosis")

class RepairGuide(Base):
    __tablename__ = "repair_guides"
    
    id = Column(Integer, primary_key=True, index=True)
    device_category = Column(String(100), nullable=False)
    problem_category = Column(String(100), nullable=False)
    title_en = Column(String(255), nullable=False)
    title_ar = Column(String(255), nullable=False)
    summary_en = Column(Text, nullable=False)
    summary_ar = Column(Text, nullable=False)
    difficulty = Column(String(50), default="moderate")  # 'easy', 'moderate', 'hard', 'expert'
    estimated_minutes = Column(Integer, default=30)
    required_tools = Column(Text, nullable=True)  # JSON list
    safety_precautions = Column(Text, nullable=True)  # JSON list
    steps_json = Column(Text, nullable=False)  # JSON array of steps: [{step_num, title, text, image, caution}]
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

class TechnicianProfile(Base):
    __tablename__ = "technician_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    specializations = Column(Text, nullable=False)  # JSON list or comma-separated
    experience_years = Column(Integer, default=1)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    rating = Column(Float, default=5.0)
    total_reviews = Column(Integer, default=0)
    verification_status = Column(String(50), default="pending")  # 'pending', 'approved', 'rejected'
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    
    user = relationship("User", back_populates="technician_profile")
    requests = relationship("RepairRequest", back_populates="technician", foreign_keys="RepairRequest.technician_id")
    reviews = relationship("Review", back_populates="technician")

class RepairRequest(Base):
    __tablename__ = "repair_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technician_profiles.id"), nullable=False)
    diagnosis_id = Column(Integer, ForeignKey("diagnosis_reports.id"), nullable=True)
    device_info = Column(String(255), nullable=False)
    problem_summary = Column(Text, nullable=False)
    status = Column(String(50), default="pending")  # 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
    customer_notes = Column(Text, nullable=True)
    estimated_quote = Column(Float, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    customer = relationship("User", back_populates="repair_requests", foreign_keys=[user_id])
    technician = relationship("TechnicianProfile", back_populates="requests", foreign_keys=[technician_id])
    diagnosis = relationship("DiagnosisReport", back_populates="repair_requests")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("technician_profiles.id"), nullable=False)
    rating = Column(Integer, default=5)  # 1 - 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    technician = relationship("TechnicianProfile", back_populates="reviews")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title_en = Column(String(255), nullable=False)
    title_ar = Column(String(255), nullable=False)
    message_en = Column(Text, nullable=False)
    message_ar = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    recipient = relationship("User", back_populates="notifications")
