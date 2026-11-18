#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <map>
#include <sstream>

namespace Fixora {

struct PossibleCause {
    std::string title_en;
    std::string title_ar;
    double probability;
    std::string explanation_en;
    std::string explanation_ar;
    bool is_hardware;
};

struct TroubleshootingStep {
    int step_number;
    std::string title_en;
    std::string title_ar;
    std::string instruction_en;
    std::string instruction_ar;
    bool requires_tools;
};

struct DiagnosisResult {
    std::string report_id;
    std::string device_category;
    std::string brand;
    std::string model;
    std::string problem_category;
    std::vector<std::string> extracted_symptoms;
    std::string severity; // "low", "medium", "high", "critical"
    double confidence_score;
    std::vector<PossibleCause> possible_causes;
    std::vector<TroubleshootingStep> troubleshooting_steps;
    std::vector<std::string> required_tools;
    std::string estimated_difficulty;
    int estimated_minutes;
    std::vector<std::string> safety_warnings_en;
    std::vector<std::string> safety_warnings_ar;
    bool requires_technician;
};

class AIEngine {
public:
    static std::string to_lower(const std::string& str) {
        std::string lower = str;
        std::transform(lower.begin(), lower.end(), lower.begin(), ::tolower);
        return lower;
    }

    static DiagnosisResult diagnose(
        const std::string& device_category,
        const std::string& brand,
        const std::string& model,
        const std::string& description,
        const std::string& error_msg = ""
    ) {
        DiagnosisResult result;
        result.report_id = "cpp_rep_" + std::to_string(std::time(nullptr));
        result.device_category = device_category.empty() ? "Laptop" : device_category;
        result.brand = brand.empty() ? "Generic" : brand;
        result.model = model.empty() ? "Standard" : model;
        result.problem_category = "Hardware";

        std::string full_text = to_lower(description + " " + error_msg);

        // 1. Safety Triage
        bool is_critical = false;
        if (full_text.find("swollen") != std::string::npos || full_text.find("bulge") != std::string::npos ||
            full_text.find("انتفاخ") != std::string::npos || full_text.find("منتفخ") != std::string::npos) {
            is_critical = true;
            result.severity = "critical";
            result.safety_warnings_en.push_back("DANGER: Swollen lithium battery detected. Explosion hazard.");
            result.safety_warnings_ar.push_back("خطر جسيم: تم اكتشاف انتفاخ في بطارية الليثيوم. خطر اشتعال وانفجار.");
        } else if (full_text.find("smoke") != std::string::npos || full_text.find("sparks") != std::string::npos ||
                   full_text.find("دخان") != std::string::npos || full_text.find("شرر") != std::string::npos) {
            is_critical = true;
            result.severity = "critical";
            result.safety_warnings_en.push_back("CRITICAL HAZARD: Electrical short-circuit detected.");
            result.safety_warnings_ar.push_back("خطر حرج: تم اكتشاف قصر كهربائي مباشر في الدوائر.");
        } else if (full_text.find("water") != std::string::npos || full_text.find("spill") != std::string::npos ||
                   full_text.find("ماء") != std::string::npos || full_text.find("سوائل") != std::string::npos) {
            result.severity = "high";
            result.safety_warnings_en.push_back("WARNING: Liquid ingress detected. Power off immediately.");
            result.safety_warnings_ar.push_back("تحذير: تسرب سوائل للجهاز. أوقف التشغيل فوراً.");
        } else {
            result.severity = "medium";
        }

        // 2. Symptom Extraction
        if (full_text.find("hot") != std::string::npos || full_text.find("overheat") != std::string::npos ||
            full_text.find("حرارة") != std::string::npos || full_text.find("ساخن") != std::string::npos) {
            result.extracted_symptoms.push_back("overheating");
        }
        if (full_text.find("shut") != std::string::npos || full_text.find("off") != std::string::npos ||
            full_text.find("يطفئ") != std::string::npos || full_text.find("يفصل") != std::string::npos) {
            result.extracted_symptoms.push_back("unexpected_shutdown");
        }
        if (full_text.find("charge") != std::string::npos || full_text.find("battery") != std::string::npos ||
            full_text.find("شحن") != std::string::npos || full_text.find("بطارية") != std::string::npos) {
            result.extracted_symptoms.push_back("battery_charging_issue");
        }
        if (result.extracted_symptoms.empty()) {
            result.extracted_symptoms.push_back("general_hardware_fault");
        }

        // 3. Probabilistic Causes
        result.confidence_score = is_critical ? 0.95 : 0.88;
        result.requires_technician = is_critical;

        if (std::find(result.extracted_symptoms.begin(), result.extracted_symptoms.end(), "overheating") != result.extracted_symptoms.end()) {
            result.possible_causes.push_back({
                "Dried Thermal Paste & Blocked Heat Sink",
                "جفاف المعجون الحراري وانسداد فتحات التبريد",
                0.72,
                "Degraded thermal paste between CPU and heatsink prevents cooling.",
                "جفاف المعجون الحراري يمنع تصريف الحرارة بكفاءة.",
                true
            });
            result.possible_causes.push_back({
                "Cooling Fan Dust Accumulation",
                "تراكم الأتربة على مروحة التبريد",
                0.28,
                "Dust restricts airflow, causing emergency thermal shutdown.",
                "الغبار يعيق تدفق الهواء ويؤدي لإيقاف تشغيل الجهاز تلقائياً للحماية.",
                true
            });

            result.troubleshooting_steps.push_back({
                1, "Check Air Vents", "فحص فتحات التهوية",
                "Ensure device is on a hard, flat surface with open intake vents.",
                "ضع الجهاز على سطح مستوٍ وتأكد من عدم انسداد فتحات الهواء.",
                false
            });
            result.troubleshooting_steps.push_back({
                2, "Clean Exhaust Vents with Compressed Air", "تنظيف فتحات المروحة بالهواء المضغوط",
                "Power off and blow short air bursts through vents.",
                "أوقف التشغيل واستخدم بخاخ هواء مضغوط لتنظيف الفتحات.",
                true
            });
            result.troubleshooting_steps.push_back({
                3, "Reapply High-Performance Thermal Paste", "تجديد المعجون الحراري",
                "Clean old paste with isopropyl alcohol and apply a small dot on CPU die.",
                "نظف المعجون القديم بكحول طبي وضع نقطة من المعجون الجديد.",
                true
            });

            result.required_tools = {"Precision Screwdriver", "Compressed Air Can", "Thermal Paste", "99% Isopropyl Alcohol"};
            result.estimated_difficulty = "moderate";
            result.estimated_minutes = 35;
        } else {
            result.possible_causes.push_back({
                "Degraded Battery or Faulty Charging Port",
                "تراجع كفاءة البطارية أو عطل في منفذ الشاحن",
                0.70,
                "Internal chemical wear or loose connector pins.",
                "تلف كيميائي بالخلايا أو تراكم أتربة بالمنفذ.",
                true
            });

            result.troubleshooting_steps.push_back({
                1, "Test Certified Charger", "تجربة شاحن معتمد آخر",
                "Use an authentic charging brick and cable on a direct wall outlet.",
                "جرب شاحناً أصلياً على مقبس جداري مباشر للتأكد.",
                false
            });

            result.required_tools = {"Non-conductive Probe / Toothpick", "Certified OEM Charger"};
            result.estimated_difficulty = "easy";
            result.estimated_minutes = 15;
        }

        return result;
    }
};

} // namespace Fixora
