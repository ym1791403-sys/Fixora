# -*- coding: utf-8 -*-
"""
Wired USB / Cable & Serial Telemetry Fault Diagnostics Engine (Zero AI Tokens)
Analyzes genuine WebUSB / Web Serial hardware descriptors (VID, PID, device classes,
interfaces, and optional UART console logs) to identify real hardware/firmware faults.
"""

import re
from typing import Dict, Any, List, Optional

USB_VENDOR_MAP: Dict[int, Dict[str, str]] = {
    0x05AC: {"brand": "Apple", "category": "Smartphone"},
    0x04E8: {"brand": "Samsung", "category": "Smartphone"},
    0x18D1: {"brand": "Google / Android", "category": "Smartphone"},
    0x2717: {"brand": "Xiaomi", "category": "Smartphone"},
    0x12D1: {"brand": "Huawei", "category": "Smartphone"},
    0x22D9: {"brand": "OPPO / Realme", "category": "Smartphone"},
    0x2A70: {"brand": "OnePlus", "category": "Smartphone"},
    0x22B8: {"brand": "Motorola", "category": "Smartphone"},
    0x0FCE: {"brand": "Sony Xperia", "category": "Smartphone"},
    0x05C6: {"brand": "Qualcomm Chipset", "category": "Smartphone"},
    0x0E8D: {"brand": "MediaTek Chipset", "category": "Smartphone"},
    0x054C: {"brand": "Sony PlayStation", "category": "Gaming Console"},
    0x045E: {"brand": "Microsoft Xbox", "category": "Gaming Console"},
    0x057E: {"brand": "Nintendo", "category": "Gaming Console"},
    0x0BC2: {"brand": "Seagate", "category": "Storage"},
    0x1058: {"brand": "Western Digital", "category": "Storage"},
    0x0781: {"brand": "SanDisk", "category": "Storage"},
    0x0951: {"brand": "Kingston", "category": "Storage"},
    0x0480: {"brand": "Toshiba Storage", "category": "Storage"},
    0x04E8_0: {"brand": "Samsung", "category": "Storage"},
    0x03F0: {"brand": "HP", "category": "Laptop"},
    0x413C: {"brand": "Dell", "category": "Laptop"},
    0x17EF: {"brand": "Lenovo", "category": "Laptop"},
    0x0B05: {"brand": "ASUS", "category": "Laptop"},
    0x04A9: {"brand": "Canon", "category": "Printer"},
    0x04B8: {"brand": "Epson", "category": "Printer"},
    0x04F9: {"brand": "Brother", "category": "Printer"},
    0x046D: {"brand": "Logitech", "category": "Desktop Computer"},
    0x1A86: {"brand": "WCH CH340 USB-Serial", "category": "Other"},
    0x10C4: {"brand": "Silicon Labs CP210x UART", "category": "Other"},
    0x0403: {"brand": "FTDI USB-UART Bridge", "category": "Other"},
    0x2341: {"brand": "Arduino / Embedded Board", "category": "Other"},
    0x303A: {"brand": "Espressif ESP32", "category": "Other"},
}

# Exact VID:PID diagnostic signatures seen in bricked / recovery / bootloader states
EXACT_VID_PID_SIGNATURES: Dict[tuple, Dict[str, Any]] = {
    (0x05C6, 0x9008): {
        "mode": "Qualcomm HS-USB QDLoader 9008 (EDL Mode)",
        "category": "Smartphone",
        "severity": "critical",
        "title_ar": "تلف في البوتلودر أو ذاكرة التخزين — الجهاز عالق في وضع الطوارئ (EDL 9008)",
        "title_en": "Bootloader / eMMC-UFS Failure — Stuck in Qualcomm EDL 9008 Mode",
        "explanation_ar": "رصد الفحص المباشر عبر كابل USB دخول المعالج في وضع الطوارئ Qualcomm 9008، مما يعني تعذر إقلاع النظام بسبب تلف قطاع الإقلاع (Bootloader/XBL) أو تلف شريحة الذاكرة الداخلية (UFS/eMMC).",
        "explanation_en": "USB descriptor identified Qualcomm 9008 EDL emergency mode, indicating primary bootloader corruption or UFS/eMMC flash storage failure.",
        "repair_method_ar": "فحص استقرار الفولت على دوائر تغذية الذاكرة، وإعادة تفليش السوفت وير عبر أداة الصيانة أو فحص سلامة شريحة الذاكرة (UFS/eMMC) عند فني متخصص.",
        "repair_method_en": "Inspect storage power rails and perform authorized EDL firmware recovery or eMMC/UFS chip testing.",
        "steps_ar": [
            "افصل الكابل واضغط مطولاً على زر الباور + خفض الصوت لمدة 15 ثانية للتأكد من عدم وجود تعليق مؤقت.",
            "إذا استمر الجهاز في الظهور بوضع Qualcomm 9008 بدون شاشة، فهناك تلف في ملفات البوتلودر أو ذاكرة التخزين الداخلية.",
            "تأكد من كفاءة البطارية (فولتها فوق 3.7V) لأن هبوط البطارية الحاد قد يدخل الجهاز في وضع الطوارئ.",
            "تجنب التفليش العشوائي بملفات غير متطابقة وتوجه لفني برمجيات/صيانة لفحص الذاكرة وإعادة الإقلاع الآمن.",
        ],
    },
    (0x05AC, 0x1227): {
        "mode": "Apple DFU Mode",
        "category": "Smartphone",
        "severity": "high",
        "title_ar": "توقف الإقلاع — جهاز Apple عالق في وضع DFU الطارئ",
        "title_en": "Apple iBoot Hang — Stuck in DFU Mode (0x05AC:1227)",
        "explanation_ar": "كشف الكابل عن وجود الجهاز في وضع DFU (شاشة سوداء تماماً مع استجابة USB فقط)، وهو مؤشر على فشل تحميل iOS أو خلل في دائرة الطاقة/الناند (NAND).",
        "explanation_en": "Device enumerated in Apple DFU mode over USB (0x05AC:1227), indicating failed iOS boot or NAND/PMIC fault.",
        "repair_method_ar": "تجربة إعادة تشغيل إجبارية ثم اختبار استعادة النظام (Restore/Update) وملاحظة رمز الخطأ إن ظهر، مع فحص كابل الشحن والبطارية.",
        "repair_method_en": "Attempt hard restart, then run OS recovery check (watch for NAND/Baseband error codes) and verify battery voltage.",
        "steps_ar": [
            "نفذ إعادة تشغيل إجبارية للجهاز وراقب هل يظهر شعار التفاحة أم يبقى على شاشة سوداء.",
            "استخدم كابل USB أصلي موصل مباشرة بمنفذ اللوحة الأم وليس عبر موزع USB.",
            "اختبر تحديث النظام دون مسح البيانات (Update)؛ إذا ظهر خطأ في التخزين أو الناند فقد يتطلب فحصاً هاردويرياً.",
        ],
    },
    (0x05AC, 0x1281): {
        "mode": "Apple Recovery Mode (iBoot)",
        "category": "Smartphone",
        "severity": "moderate",
        "title_ar": "خطأ في نظام التشغيل — الجهاز عالق على وضع الاسترداد (Recovery Mode)",
        "title_en": "iOS Boot Failure — Stuck in Apple Recovery Mode (0x05AC:1281)",
        "explanation_ar": "تعرف الكمبيوتر عبر الوصلة على الجهاز في وضع Recovery Mode، وغالباً ينتج عن انقطاع تحديث أو امتلاء الذاكرة أو تلف فلاتة السنسور/السماعة العلوية.",
        "explanation_en": "Device reported Apple Recovery Mode (0x05AC:1281) over USB, commonly caused by failed update, full storage, or proximity flex short.",
        "repair_method_ar": "اختبار الخروج من Recovery وتمرير التحديث؛ وفي حال التكرار يجب فصل فلاتة السماعة العلوية (FaceID/Proximity) للتجربة.",
        "repair_method_en": "Attempt non-destructive OS Update; if bootloop persists, test by isolating top sensor/earpiece flex.",
        "steps_ar": [
            "قم بتمرير التحديث (Update بدون فورمات) عبر كابل أصلي مستقر.",
            "إذا أعاد الجهاز التشغيل على نفس الوضع، افحص وجود سخونة أو خلل في فلاتة السماعة العلوية أو الكاميرا الأمامية.",
        ],
    },
    (0x0E8D, 0x2000): {
        "mode": "MediaTek Preloader Mode",
        "category": "Smartphone",
        "severity": "high",
        "title_ar": "عطل إقلاع في معالج MediaTek (Preloader Loop)",
        "title_en": "MediaTek Boot Failure — Preloader USB Loop (0x0E8D:2000)",
        "explanation_ar": "الاتصال المتقطع عبر منفذ MediaTek Preloader يعني أن المعالج يبدأ التهيئة ثم يفشل في استكمال الإقلاع بسبب البطارية أو السوفت وير أو الذاكرة.",
        "explanation_en": "Detected MediaTek Preloader handshake over USB, indicating interrupted boot due to PMIC, battery drop, or firmware corruption.",
        "repair_method_ar": "فحص فولت البطارية أولاً، ثم فحص منفذ الشحن، ثم معالجة ملفات الإقلاع.",
        "repair_method_en": "Verify battery voltage > 3.75V and charging port rails before attempting firmware recovery.",
        "steps_ar": [
            "افحص البطارية أولاً لأن انخفاض جهد البطارية يسبب فصل وإعادة اتصال Preloader باستمرار.",
            "نظف منفذ الشحن وأعد المحاولة بكابل بيانات سليم.",
            "إذا لم يعمل، يحتاج الجهاز لفحص الذاكرة الداخلية وإعادة برمجة السوفت وير.",
        ],
    },
    (0x0E8D, 0x0003): {
        "mode": "MediaTek BROM Emergency Mode",
        "category": "Smartphone",
        "severity": "critical",
        "title_ar": "فشل كامل في البوتلودر — دخول وضع BROM الطارئ (MediaTek)",
        "title_en": "MediaTek BROM Mode — Missing/Corrupt Preloader",
        "explanation_ar": "الجهاز دخل مباشرة على وضع BootROM لأن ملف Preloader أو ذاكرة eMMC لا تستجيب.",
        "explanation_en": "Processor fell back to BROM emergency mode because Preloader or storage failed to respond.",
        "repair_method_ar": "فحص شريحة الذاكرة ومنظم الجهد (PMIC) قبل محاولة إعادة التفليش.",
        "repair_method_en": "Inspect eMMC/UFS storage health and PMIC output rails prior to re-flashing.",
        "steps_ar": [
            "تأكد من فصل أي زر مضغوط بالغلط (زر رفع/خفض الصوت) لأن الضغط المستمر يدخل الجهاز BROM.",
            "توجه لمركز صيانة لفحص شريحة الذاكرة وإعادة إحياء البوتلودر.",
        ],
    },
}


def analyze_cable_telemetry(
    usb_telemetry: Optional[Dict[str, Any]] = None,
    serial_logs: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Performs zero-token deterministic fault inspection on real USB / Serial data captured over cable.
    Returns structured diagnostic enrichment or None if no cable telemetry was supplied.
    """
    usb = usb_telemetry if isinstance(usb_telemetry, dict) else {}
    logs = (serial_logs or "").strip()
    if not usb and not logs:
        return None

    vid_raw = usb.get("vendorId")
    pid_raw = usb.get("productId")
    try:
        vid = int(vid_raw) if vid_raw is not None else None
    except (TypeError, ValueError):
        vid = None
    try:
        pid = int(pid_raw) if pid_raw is not None else None
    except (TypeError, ValueError):
        pid = None

    vendor_info = USB_VENDOR_MAP.get(vid) if vid is not None else None
    detected_brand = (usb.get("manufacturerName") or (vendor_info["brand"] if vendor_info else "") or "Unknown").strip()
    detected_model = (usb.get("productName") or "").strip()
    detected_category = vendor_info["category"] if vendor_info else None

    interfaces = usb.get("interfaces") if isinstance(usb.get("interfaces"), list) else []
    usb_classes = {int(usb.get("deviceClass"))} if usb.get("deviceClass") is not None else set()
    has_adb = False
    has_fastboot = False
    has_mtp = False
    has_mass_storage = False
    has_printer = False
    has_audio = False

    for iface in interfaces:
        if not isinstance(iface, dict):
            continue
        cls = iface.get("interfaceClass")
        sub = iface.get("interfaceSubclass")
        proto = iface.get("interfaceProtocol")
        if cls is not None:
            usb_classes.add(int(cls))
        if cls == 255 and sub == 66 and proto == 1:
            has_adb = True
        elif cls == 255 and sub == 66 and proto == 3:
            has_fastboot = True
        elif cls == 6:
            has_mtp = True
        elif cls == 8:
            has_mass_storage = True
        elif cls == 7:
            has_printer = True
        elif cls == 1:
            has_audio = True

    if has_mass_storage and not detected_category:
        detected_category = "Storage"
    elif has_printer and not detected_category:
        detected_category = "Printer"
    elif has_audio and not detected_category:
        detected_category = "Audio"
    elif (has_adb or has_fastboot or has_mtp) and not detected_category:
        detected_category = "Smartphone"

    causes: List[Dict[str, Any]] = []
    steps_ar: List[str] = []
    steps_en: List[str] = []
    detected_mode = ""
    severity = "moderate"
    summary_ar_parts: List[str] = []
    summary_en_parts: List[str] = []

    sig = EXACT_VID_PID_SIGNATURES.get((vid, pid)) if (vid is not None and pid is not None) else None
    if sig:
        detected_mode = sig["mode"]
        severity = sig["severity"]
        detected_category = sig.get("category") or detected_category
        causes.append({
            "title_ar": sig["title_ar"],
            "title_en": sig["title_en"],
            "source_dataset": f"فحص كابل USB المباشر (VID: 0x{vid:04X} | PID: 0x{pid:04X})",
            "explanation_ar": sig["explanation_ar"],
            "explanation_en": sig["explanation_en"],
            "repair_method_ar": sig["repair_method_ar"],
            "repair_method_en": sig["repair_method_en"],
            "is_hardware": True,
        })
        steps_ar.extend(sig["steps_ar"])
        summary_ar_parts.append(sig["title_ar"])
        summary_en_parts.append(sig["title_en"])

    if has_fastboot:
        detected_mode = detected_mode or "Android Fastboot / Bootloader Mode"
        severity = "high"
        causes.append({
            "title_ar": "توقف الإقلاع في وضع Fastboot (تلف ملفات النظام أو البوت)",
            "title_en": "Device Stuck in Fastboot Bootloader Mode",
            "source_dataset": "بروتوكول USB Fastboot المباشر",
            "explanation_ar": "رصدت الوصلة واجهة Fastboot مباشرة، مما يشير لتلف قسم النظام (System/Boot Partition) أو تعليق زر خفض الصوت أثناء التشغيل.",
            "explanation_en": "USB interface enumerated Fastboot (Class 255 / Subclass 66 / Protocol 3), indicating failed OS boot or stuck volume-down key.",
            "repair_method_ar": "افحص أولاً أزرار الصوت الجانبية للتأكد من عدم تعليقها، ثم أعد التشغيل أو مرر ملف الإقلاع الأصلي.",
            "repair_method_en": "Check physical volume buttons for stuck contacts before reflashing stock boot partition.",
            "is_hardware": False,
        })
        steps_ar.extend([
            "اضغط على أزرار الصوت وتأكد أنها غير عالقة أو متضررة بالرطوبة لأن تعليق زر خفض الصوت يدخل الجهاز وضع Fastboot.",
            "اضغط مطولاً على زر الباور 15 ثانية للخروج من وضع Fastboot واختبار الإقلاع الطبيعي.",
        ])

    if has_adb and not sig:
        detected_mode = detected_mode or "Android Debug Bridge (ADB) Connected"
        summary_ar_parts.append("تم التعرف على واجهة التصحيح ADB بنجاح عبر الكابل")
        summary_en_parts.append("USB ADB debugging interface detected")
        steps_ar.append("الواجهة البرمجية ADB مستجيبة عبر الكابل — التوصيل الكهربائي لخطوط البيانات (D+/D-) سليم ولا يوجد قطع في فلاتة الشحن.")

    # Inspect UART / Serial Console Logs if captured via Web Serial
    if logs:
        low_logs = logs.lower()
        log_matches = []
        if any(k in low_logs for k in ("panic", "watchdog", "fatal", "crash", "segfault", "oom")):
            log_matches.append(("انهيار نواة النظام (Kernel Panic / Boot Crash) في سجلات السيريال", "Kernel panic / fatal boot crash detected in serial console"))
            severity = "high"
        if any(k in low_logs for k in ("thermal", "overheat", "temp", "tjmax", "throttle")):
            log_matches.append(("تحذير ارتفاع حرارة حرج في سجلات اللوحة الأم (Thermal Trip)", "Critical thermal / overheat event observed in serial logs"))
        if any(k in low_logs for k in ("emmc", "nvme", "nand", "mmc0", "i/o error", "bad block", "read error")):
            log_matches.append(("أخطاء قراءة/كتابة في وحدة التخزين (eMMC / NAND / NVMe Error)", "Storage I/O or flash memory error detected in serial output"))
            severity = "high"
        if any(k in low_logs for k in ("undervoltage", "brownout", "low battery", "vbus", "pmic", "i2c")):
            log_matches.append(("اضطراب فولت التغذية أو دائرة الطاقة/PMIC/I2C", "Power rail undervoltage or PMIC/I2C bus fault in console logs"))

        for title_ar, title_en in log_matches:
            causes.append({
                "title_ar": title_ar,
                "title_en": title_en,
                "source_dataset": "تحليل سجلات منفذ السيريال المباشر (UART Console)",
                "explanation_ar": f"تم استخراج مؤشرات العطل مباشرة من تدفق بيانات الكابل التسلسلي دون تخمين.",
                "explanation_en": f"Detected fault signature directly from serial UART console stream.",
                "repair_method_ar": "عزل الدائرة المسؤولة عن الخطأ الظاهر في السجل وفحص التغذية والمكونات المربوطة بها.",
                "repair_method_en": "Isolate and test the subsystem referenced in the UART error trace.",
                "is_hardware": True,
            })
            summary_ar_parts.append(title_ar)
            summary_en_parts.append(title_en)

    # Generic healthy USB connection insight if enumerated normally without crash flags
    open_err = (usb.get("openError") or "").strip()
    if vid is not None and not causes:
        summary_ar_parts.append(
            f"تم قراءة الجهاز عبر الوصلة بنجاح: {detected_brand} {detected_model} (VID: 0x{vid:04X}, PID: 0x{pid:04X}) — خطوط نقل البيانات USB سليمة"
        )
        summary_en_parts.append(
            f"Connected via USB: {detected_brand} {detected_model} (VID: 0x{vid:04X}, PID: 0x{pid:04X}) — USB data lines are responsive."
        )
        if open_err and ("access" in open_err.lower() or "claim" in open_err.lower()):
            steps_ar.append("ملاحظة: نظام التشغيل يحجز واجهة USB حالياً للاتصال القياسي (MTP/الشحن)، مما يؤكد أن آي سي الشحن والبيانات (USB Controller) يعمل كهربائياً بدون تلف.")

    return {
        "detected_brand": detected_brand,
        "detected_model": detected_model,
        "detected_category": detected_category,
        "vid_hex": f"0x{vid:04X}" if vid is not None else None,
        "pid_hex": f"0x{pid:04X}" if pid is not None else None,
        "mode": detected_mode or ("USB Connected" if vid is not None else "Serial Stream"),
        "severity": severity,
        "summary_ar": " | ".join(summary_ar_parts) or "تم فحص الاتصال عبر الكابل بنجاح.",
        "summary_en": " | ".join(summary_en_parts) or "Wired cable telemetry inspected cleanly.",
        "causes": causes,
        "steps_ar": steps_ar,
        "steps_en": steps_en,
    }
