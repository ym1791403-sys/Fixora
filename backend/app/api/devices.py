from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.db import create_device, get_user_devices, delete_device
from app.schemas.schemas import DeviceCreate, DeviceOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("", response_model=List[DeviceOut])
def list_devices(current_user: Dict[str, Any] = Depends(get_current_user)):
    devices = get_user_devices(current_user["id"])
    return [DeviceOut(
        id=d["id"],
        user_id=d["user_id"],
        category=d["category"],
        brand=d.get("brand"),
        model=d.get("model"),
        serial_number=d.get("serial_number"),
        purchase_year=d.get("purchase_year"),
        os_version=d.get("os_version"),
        created_at=d["created_at"]
    ) for d in devices]

@router.post("", response_model=DeviceOut)
def add_device(device_in: DeviceCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    d = create_device(
        user_id=current_user["id"],
        category=device_in.category,
        brand=device_in.brand,
        model=device_in.model,
        serial=device_in.serial_number,
        year=device_in.purchase_year,
        os_v=device_in.os_version
    )
    return DeviceOut(
        id=d["id"],
        user_id=d["user_id"],
        category=d["category"],
        brand=d.get("brand"),
        model=d.get("model"),
        serial_number=d.get("serial_number"),
        purchase_year=d.get("purchase_year"),
        os_version=d.get("os_version"),
        created_at=d["created_at"]
    )

@router.delete("/{device_id}")
def remove_device(device_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = delete_device(device_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return {"message": "Device removed successfully"}
