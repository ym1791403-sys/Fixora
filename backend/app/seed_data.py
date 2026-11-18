import json
from app.core.security import hash_password
from app.models.db import (
    init_db, get_user_by_email, create_user, create_technician_profile,
    create_device, get_connection
)

def seed():
    # 1. Initialize schema
    init_db()
    
    # 2. Seed Admin
    admin = get_user_by_email("admin@techrepair.com")
    if not admin:
        admin = create_user(
            email="admin@techrepair.com",
            hashed_pw=hash_password("Admin123456!"),
            full_name="Platform Administrator",
            role="admin",
            phone="+201000000000"
        )
        print("Seeded default Admin: admin@techrepair.com / Admin123456!")

    # 3. Seed Demo User
    demo = get_user_by_email("user@techrepair.com")
    if not demo:
        demo = create_user(
            email="user@techrepair.com",
            hashed_pw=hash_password("User123456!"),
            full_name="Ahmed Mansour",
            role="user",
            phone="+201012345678"
        )
        create_device(
            user_id=demo["id"],
            category="Laptop",
            brand="Dell",
            model="XPS 15 9500",
            serial="DELL-9500-2022",
            year=2022,
            os_v="Windows 11 Pro"
        )
        print("Seeded demo User: user@techrepair.com / User123456!")

    # 4. Seed Verified Technicians
    tech_data = [
        {
            "email": "cairo.fix@techrepair.com",
            "name": "Eng. Mahmoud Hassan",
            "business": "Apex Laptop & Board Diagnostics",
            "bio": "Certified IPC specialist with 8+ years experience in micro-soldering, motherboard repairs, and GPU reballing.",
            "specs": "Laptops, Motherboard Repair, Micro-soldering, MacBooks",
            "city": "Cairo",
            "rating": 4.9,
            "reviews": 128
        },
        {
            "email": "alex.tech@techrepair.com",
            "name": "Sarah Al-Ghamdi",
            "business": "SmartFix Mobile & Tablet Lab",
            "bio": "Specialized laboratory in advanced OLED screen lamination, face-ID repair, and battery management board swaps.",
            "specs": "Smartphones, Tablets, Screen Refurbishing, Water Damage Recovery",
            "city": "Alexandria",
            "rating": 4.8,
            "reviews": 94
        },
        {
            "email": "giza.pc@techrepair.com",
            "name": "Khaled El-Sayed",
            "business": "ProBuild Workstations & Data Recovery",
            "bio": "Cleanroom data recovery expert from failed HDDs and SSDs, alongside custom high-end PC troubleshooting.",
            "specs": "Desktop Computers, Data Recovery, NVMe SSDs, Custom PCs",
            "city": "Giza",
            "rating": 5.0,
            "reviews": 76
        }
    ]

    for td in tech_data:
        existing = get_user_by_email(td["email"])
        if not existing:
            u = create_user(
                email=td["email"],
                hashed_pw=hash_password("Tech123456!"),
                full_name=td["name"],
                role="technician"
            )
            create_technician_profile(
                user_id=u["id"],
                business_name=td["business"],
                specializations=td["specs"],
                city=td["city"],
                bio=td["bio"],
                status="approved",
                rating=td["rating"],
                reviews=td["reviews"]
            )
            print(f"Seeded technician: {td['business']} ({td['city']})")

    # 5. Seed Repair Guides
    guides_data = [
        {
            "device_category": "Laptop",
            "problem_category": "Hardware",
            "title_en": "Complete Laptop Dust Cleaning and Thermal Paste Replacement",
            "title_ar": "دليل تنظيف مروحة اللابتوب وتجديد المعجون الحراري",
            "summary_en": "Learn how to open your laptop safely, clean heatsink fins from dust, and re-apply thermal compound to drop temperatures by 15-25C.",
            "summary_ar": "تعلم كيفية فك اللابتوب بأمان وتنظيف شفرات المروحة من الغبار المتراكم وتجديد المعجون الحراري لخفض الحرارة حتى 25 درجة مئوية.",
            "difficulty": "moderate",
            "estimated_minutes": 45,
            "required_tools": ["Precision Screwdriver", "Compressed Air Can", "Thermal Paste", "99% Isopropyl Alcohol"],
            "safety_precautions": ["Always disconnect internal battery before touching internal components", "Ground yourself against electrostatic discharge (ESD)"],
            "steps": [
                {
                    "step_number": 1,
                    "title_en": "Chassis Back Cover Removal",
                    "title_ar": "فك مسامير الغطاء الخلفي",
                    "instruction_en": "Remove all perimeter screws from the bottom casing. Group screws by length as corner screws often differ.",
                    "instruction_ar": "انزع جميع المسامير المحيطية من الغطاء الخلفي ورتبها حسب الطول."
                },
                {
                    "step_number": 2,
                    "title_en": "Disconnect Battery Connector",
                    "title_ar": "فصل كابل البطارية الداخلي",
                    "instruction_en": "Locate the main battery flex connector. Gently slide the plastic latch back and unplug.",
                    "instruction_ar": "حدد مكان كابل البطارية المتصل باللوحة الأم وافصله برفق لتفريغ أي تيار."
                },
                {
                    "step_number": 3,
                    "title_en": "Heatsink Unscrewing in Diagonal Order",
                    "title_ar": "فك مسامير المشتت الحراري بنظام قطري",
                    "instruction_en": "Unscrew heat sink retaining screws following the numbered sequence stamped on the copper arm (1, 2, 3, 4) to ensure even pressure release.",
                    "instruction_ar": "فك مسامير المبرد النحاسي بالترتيب الرقمي المكتوب عليه (1-2-3-4) لضمان تخفيف الضغط المتساوي."
                },
                {
                    "step_number": 4,
                    "title_en": "Clean Old Paste & Apply New Dot",
                    "title_ar": "تنظيف المعجون الجاف ووضع المعجون الجديد",
                    "instruction_en": "Wipe mirror-clean with isopropyl alcohol and apply a single rice-grain bead of thermal paste directly in the center of the silicon die.",
                    "instruction_ar": "امسح المعجون القديم بكحول نقي حتى يلمع سطح المعالج، ثم ضع نقطة صغيرة بحجم حبة الأرز في المنتصف."
                }
            ]
        },
        {
            "device_category": "Smartphone",
            "problem_category": "Hardware",
            "title_en": "Safe Smartphone USB-C / Lightning Port Deep Cleaning",
            "title_ar": "طريقة تنظيف منفذ شحن الهاتف الذكي بأمان دون إتلاف الأسنان",
            "summary_en": "Fix slow or intermittent charging caused by compressed pocket debris without damaging fragile golden terminal pins.",
            "summary_ar": "علاج مشكلة بطء الشحن أو انقطاع الكابل بسبب تراكم الأتربة والألياف داخل المنفذ دون إيذاء الأسنان النحاسية الحساسة.",
            "difficulty": "easy",
            "estimated_minutes": 15,
            "required_tools": ["Non-conductive Bamboo Probe / Toothpick", "Bright LED Flashlight", "Soft Antistatic Brush"],
            "safety_precautions": ["Do NOT use conductive metal pins or needles", "Do not spray aerosol liquids directly into port"],
            "steps": [
                {
                    "step_number": 1,
                    "title_en": "Port Visual Inspection",
                    "title_ar": "المعاينة البصرية لمنفذ الشحن",
                    "instruction_en": "Shine flashlight directly inside port to check if lint layer is compressed at the bottom floor.",
                    "instruction_ar": "سلط ضوء الكشاف داخل المنفذ لفحص طبقة الغبار المتراكمة في القاع."
                },
                {
                    "step_number": 2,
                    "title_en": "Gentle Longitudinal Sweep",
                    "title_ar": "تنظيف طولي خفيف بعود غير معدني",
                    "instruction_en": "Carefully slide wooden toothpick along the walls to scrape compacted debris, avoiding center tongue pins.",
                    "instruction_ar": "حرك العود الخشبي بمحاذاة الجوانب برفق لإخراج الأتربة المتكتلة مبتعداً عن شريحة الأسنان الوسطى."
                }
            ]
        },
        {
            "device_category": "Desktop Computer",
            "problem_category": "Hardware",
            "title_en": "Diagnosing RAM Beep Codes and Memory Contact Cleaning",
            "title_ar": "تشخيص صفارات الذاكرة العشوائية RAM وتنظيف نقاط التوصيل النحاسية",
            "summary_en": "Resolve black screen on power-on and continuous motherboard beep codes caused by memory stick oxidation.",
            "summary_ar": "حل مشكلة الشاشة السوداء عند تشغيل الجهاز وسماع صفارات متكررة بسبب أكسدة أطراف رامات الكمبيوتر.",
            "difficulty": "easy",
            "estimated_minutes": 20,
            "required_tools": ["Pencil Eraser", "Microfiber Cloth", "Phillips Screwdriver"],
            "safety_precautions": ["Unplug wall power cord and press case power button once before opening case"],
            "steps": [
                {
                    "step_number": 1,
                    "title_en": "RAM Retention Clip Release",
                    "title_ar": "فتح كلبسات تثبيت الرام",
                    "instruction_en": "Push down on retention latches at both ends of the DIMM slot to eject RAM module.",
                    "instruction_ar": "اضغط على المقابض الجانبية لمنفذ الرام للخارج لتحرير الشريحة بسلاسة."
                },
                {
                    "step_number": 2,
                    "title_en": "Contact Polishing with Clean Eraser",
                    "title_ar": "مسح أسنان النحاس بممحاة رصاص ناعمة",
                    "instruction_en": "Lightly rub gold contact fingers on both sides with clean white eraser to remove oxide film, then brush away eraser dust.",
                    "instruction_ar": "امسح الأطراف النحاسية الصفراء بممحاة رصاص بيضاء نظيفة لإزالة طبقة الأكسدة ثم نظف البقايا."
                }
            ]
        }
    ]

    con = get_connection()
    try:
        for gd in guides_data:
            existing = con.execute("SELECT id FROM repair_guides WHERE title_en = ?", (gd["title_en"],)).fetchone()
            if not existing:
                con.execute("""
                    INSERT INTO repair_guides (device_category, problem_category, title_en, title_ar, summary_en, summary_ar, difficulty, estimated_minutes, required_tools, safety_precautions, steps_json, is_published, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
                """, (
                    gd["device_category"], gd["problem_category"], gd["title_en"], gd["title_ar"],
                    gd["summary_en"], gd["summary_ar"], gd["difficulty"], gd["estimated_minutes"],
                    json.dumps(gd["required_tools"]), json.dumps(gd["safety_precautions"]),
                    json.dumps(gd["steps"])
                ))
                print(f"Seeded guide: {gd['title_en']}")
        con.commit()
    finally:
        con.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
