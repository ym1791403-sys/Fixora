#include "ai_engine.hpp"
#include <iostream>

int main(int argc, char* argv[]) {
    std::cout << "======================================================" << std::endl;
    std::cout << "Fixora C++ Core Diagnosis & High-Performance Engine" << std::endl;
    std::cout << "======================================================" << std::endl;

    std::string device = "Laptop";
    std::string brand = "Dell";
    std::string model = "XPS 15";
    std::string problem = "Laptop overheats and shuts down suddenly after 10 minutes";

    if (argc > 1) {
        problem = argv[1];
    }

    std::cout << "\nAnalyzing device: " << brand << " " << model << " (" << device << ")" << std::endl;
    std::cout << "Problem description: \"" << problem << "\"\n" << std::endl;

    Fixora::DiagnosisResult result = Fixora::AIEngine::diagnose(device, brand, model, problem);

    std::cout << "--- DIAGNOSTIC REPORT [" << result.report_id << "] ---" << std::endl;
    std::cout << "Severity: " << result.severity << std::endl;
    std::cout << "Confidence Score: " << (result.confidence_score * 100.0) << "%" << std::endl;
    std::cout << "Requires Certified Technician: " << (result.requires_technician ? "YES" : "NO") << std::endl;

    std::cout << "\n[Root Causes Ranked by Probability]:" << std::endl;
    for (const auto& cause : result.possible_causes) {
        std::cout << " - (" << (cause.probability * 100.0) << "%) " << cause.title_en << std::endl;
        std::cout << "   " << cause.explanation_en << std::endl;
    }

    std::cout << "\n[Calibrated Troubleshooting Steps]:" << std::endl;
    for (const auto& step : result.troubleshooting_steps) {
        std::cout << " Step " << step.step_number << ": " << step.title_en << std::endl;
        std::cout << "   " << step.instruction_en << std::endl;
    }

    std::cout << "\nEstimated Time: " << result.estimated_minutes << " minutes | Difficulty: " << result.estimated_difficulty << std::endl;
    std::cout << "======================================================" << std::endl;
    return 0;
}
