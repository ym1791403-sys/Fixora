from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "user"  # 'user', 'technician', 'admin'
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- DEVICE SCHEMAS ---
class DeviceBase(BaseModel):
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_year: Optional[int] = None
    os_version: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceOut(DeviceBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- DIAGNOSIS SCHEMAS ---
class DiagnosisRequest(BaseModel):
    device_category: str  # Computer, Laptop, Smartphone, Tablet, Other
    brand: Optional[str] = None
    model: Optional[str] = None
    problem_category: Optional[str] = None  # Hardware, Software, Network, Unknown
    description: str = Field(..., min_length=5)
    device_age_years: Optional[float] = None
    os_version: Optional[str] = None
    recent_changes: Optional[str] = None
    error_message: Optional[str] = None

class DiagnosisCause(BaseModel):
    title_en: str
    title_ar: str
    probability: float  # e.g., 0.85
    explanation_en: str
    explanation_ar: str
    is_hardware: bool = True

class TroubleshootingStep(BaseModel):
    step_number: int
    title_en: str
    title_ar: str
    instruction_en: str
    instruction_ar: str
    caution_en: Optional[str] = None
    caution_ar: Optional[str] = None
    requires_tools: bool = False

class DiagnosisResponse(BaseModel):
    report_id: Optional[int] = None
    device_category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    severity: str  # low, medium, high, critical
    confidence_score: float
    extracted_symptoms: List[str]
    possible_causes: List[DiagnosisCause]
    troubleshooting_steps: List[TroubleshootingStep]
    required_tools: List[str]
    estimated_difficulty: str  # easy, moderate, hard, expert
    estimated_minutes: int
    safety_warnings_en: List[str]
    safety_warnings_ar: List[str]
    requires_technician: bool
    technician_recommendation_reason: Optional[str] = None
    created_at: datetime

# --- REPAIR GUIDE SCHEMAS ---
class RepairGuideOut(BaseModel):
    id: int
    device_category: str
    problem_category: str
    title_en: str
    title_ar: str
    summary_en: str
    summary_ar: str
    difficulty: str
    estimated_minutes: int
    required_tools: List[str]
    safety_precautions: List[str]
    steps: List[Any]
    is_published: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- TECHNICIAN SCHEMAS ---
class TechnicianProfileCreate(BaseModel):
    business_name: str
    bio: Optional[str] = None
    specializations: List[str]
    experience_years: int = 1
    city: str
    address: Optional[str] = None

class TechnicianProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    specializations: Optional[List[str]] = None
    experience_years: Optional[int] = None
    city: Optional[str] = None
    address: Optional[str] = None
    is_available: Optional[bool] = None

class TechnicianProfileOut(BaseModel):
    id: int
    user_id: int
    business_name: str
    bio: Optional[str] = None
    specializations: List[str]
    experience_years: int
    city: str
    address: Optional[str] = None
    rating: float
    total_reviews: int
    verification_status: str
    is_available: bool
    user: Optional[UserOut] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- REPAIR REQUEST SCHEMAS ---
class RepairRequestCreate(BaseModel):
    technician_id: int
    diagnosis_id: Optional[int] = None
    device_info: str
    problem_summary: str
    customer_notes: Optional[str] = None
    scheduled_date: Optional[datetime] = None

class RepairRequestStatusUpdate(BaseModel):
    status: str  # pending, accepted, in_progress, completed, cancelled
    estimated_quote: Optional[float] = None

class RepairRequestOut(BaseModel):
    id: int
    user_id: int
    technician_id: int
    diagnosis_id: Optional[int] = None
    device_info: str
    problem_summary: str
    status: str
    customer_notes: Optional[str] = None
    estimated_quote: Optional[float] = None
    scheduled_date: Optional[datetime] = None
    customer_name: Optional[str] = None
    technician_business: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- NOTIFICATION SCHEMAS ---
class NotificationOut(BaseModel):
    id: int
    title_en: str
    title_ar: str
    message_en: str
    message_ar: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
