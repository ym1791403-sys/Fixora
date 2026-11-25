# -*- coding: utf-8 -*-
"""
Multi-Provider AI Diagnostic Assistant Engine (Pure Python stdlib)
Connects ByteForce's real datasets (Open Repair Alliance, MyFixit / iFixit, Backblaze ML)
to external LLM APIs when configured via environment variables (.env / Vercel) or Admin Panel.
Supported providers: Gemini (GEMINI_API_KEY / GOOGLE_API_KEY), OpenAI (OPENAI_API_KEY),
Groq (GROQ_API_KEY), and OpenRouter (OPENROUTER_API_KEY).
Never fabricates AI output when unconfigured.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_FILE_PATH = os.path.join(PROJECT_ROOT, ".env")

PROVIDER_ENV_MAP = [
    ("gemini", ("BYTEFORCE_GEMINI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY")),
    ("openai", ("BYTEFORCE_OPENAI_API_KEY", "OPENAI_API_KEY")),
    ("groq", ("BYTEFORCE_GROQ_API_KEY", "GROQ_API_KEY")),
    ("openrouter", ("BYTEFORCE_OPENROUTER_API_KEY", "OPENROUTER_API_KEY")),
]

_FAILED_AUTH_KEYS: set = set()


def _load_dotenv_file() -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not os.path.exists(ENV_FILE_PATH):
        return values
    try:
        with open(ENV_FILE_PATH, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and v:
                    values[k] = v
    except Exception:
        pass
    return values


def get_active_ai_provider() -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Returns (provider_name, env_var_name, api_key) preferring .env / BYTEFORCE_* over ambient IDE vars."""
    dotenv_vals = _load_dotenv_file()
    for provider, env_names in PROVIDER_ENV_MAP:
        for var_name in env_names:
            val = (dotenv_vals.get(var_name) or os.environ.get(var_name) or "").strip()
            if not val or val.startswith("your_"):
                continue
            # Standard Google Generative AI REST keys start with AIza; reject non-REST session tokens
            if provider == "gemini" and var_name in ("GEMINI_API_KEY", "GOOGLE_API_KEY") and not val.startswith("AIza"):
                continue
            if (provider, val) in _FAILED_AUTH_KEYS:
                continue
            return provider, var_name, val
    return None, None, None


def get_ai_status() -> Dict[str, Any]:
    """Returns safe, non-secret status of configured AI provider(s)."""
    provider, env_var, key = get_active_ai_provider()
    masked = None
    if key and len(key) >= 8:
        masked = f"{key[:4]}...{key[-4:]}"
    elif key:
        masked = "****"
    return {
        "configured": bool(provider and key),
        "provider": provider,
        "env_var": env_var,
        "masked_key": masked,
        "supported_providers": [
            {"id": "gemini", "name": "Google Gemini", "env_var": "GEMINI_API_KEY"},
            {"id": "openai", "name": "OpenAI GPT", "env_var": "OPENAI_API_KEY"},
            {"id": "groq", "name": "Groq Llama", "env_var": "GROQ_API_KEY"},
            {"id": "openrouter", "name": "OpenRouter", "env_var": "OPENROUTER_API_KEY"},
        ],
    }


def save_ai_api_key(provider: str, api_key: str) -> Dict[str, Any]:
    """
    Sets the API key in the current process environment and persists cleanly to .env
    when local filesystem is writable.
    """
    clean_provider = (provider or "gemini").strip().lower()
    env_lookup = dict(PROVIDER_ENV_MAP)
    if clean_provider not in env_lookup:
        raise ValueError("Unsupported AI provider. Use: gemini, openai, groq, or openrouter.")
    clean_key = (api_key or "").strip()
    if len(clean_key) < 10:
        raise ValueError("API key looks too short.")

    var_name = env_lookup[clean_provider][0]
    os.environ[var_name] = clean_key
    _FAILED_AUTH_KEYS.discard((clean_provider, clean_key))

    persisted_to_env = False
    try:
        lines: List[str] = []
        if os.path.exists(ENV_FILE_PATH):
            with open(ENV_FILE_PATH, "r", encoding="utf-8") as f:
                lines = f.read().splitlines()
        updated = False
        new_lines = []
        for ln in lines:
            if ln.strip().startswith(f"{var_name}="):
                new_lines.append(f"{var_name}={clean_key}")
                updated = True
            else:
                new_lines.append(ln)
        if not updated:
            new_lines.append(f"{var_name}={clean_key}")
        with open(ENV_FILE_PATH, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines) + "\n")
        persisted_to_env = True
    except Exception:
        persisted_to_env = False

    return {
        **get_ai_status(),
        "persisted_to_env": persisted_to_env,
        "vercel_note": f"For permanent Vercel serverless deployment, add {var_name} in Vercel Environment Variables.",
    }


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    raw = (text or "").strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        raw = "\n".join(lines).strip()
    try:
        return json.loads(raw)
    except Exception:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end + 1])
            except Exception:
                pass
    return None


def _call_gemini(api_key: str, prompt: str, timeout: float = 10.0) -> Dict[str, Any]:
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.25,
            "responseMimeType": "application/json",
        },
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    candidates = body.get("candidates") or []
    parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
    text = parts[0].get("text", "") if parts else ""
    parsed = _extract_json_object(text)
    if not parsed:
        raise RuntimeError("Gemini returned non-JSON response")
    return parsed


def _call_openai_compatible(url: str, api_key: str, model: str, prompt: str, timeout: float = 10.0) -> Dict[str, Any]:
    payload = {
        "model": model,
        "temperature": 0.25,
        "messages": [
            {"role": "system", "content": "You are ByteForce Hardware Diagnostics AI. Reply strictly in valid JSON."},
            {"role": "user", "content": prompt},
        ],
    }
    if "openai.com" in url:
        payload["response_format"] = {"type": "json_object"}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    choices = body.get("choices") or []
    content = ((choices[0].get("message") or {}).get("content") or "") if choices else ""
    parsed = _extract_json_object(content)
    if not parsed:
        raise RuntimeError("LLM provider returned non-JSON response")
    return parsed


class AIAssistantService:
    """Grounded AI reasoning layered cleanly over empirical hardware repair datasets."""

    def analyze_with_datasets(
        self,
        device_info: Dict[str, Any],
        ora_summary: Dict[str, Any],
        guide_summary: Optional[Dict[str, Any]],
        timeout: float = 9.0,
    ) -> Dict[str, Any]:
        provider, _, api_key = get_active_ai_provider()
        if not provider or not api_key:
            return {
                "configured": False,
                "status": "awaiting_api_key",
                "provider": None,
                "supported_providers": ["gemini", "openai", "groq", "openrouter"],
            }

        prompt = (
            "Analyze this real hardware fault using the empirical dataset facts below. "
            "Never invent fake repair percentages; cite only genuine technical reasoning.\n"
            f"Device Category: {device_info.get('device_category')}\n"
            f"Brand: {device_info.get('brand')}\n"
            f"Model: {device_info.get('model')}\n"
            f"Error Code: {device_info.get('error_message') or 'None'}\n"
            f"User Symptom Description: {device_info.get('description')}\n"
            f"Open Repair Alliance Stats: sample={ora_summary.get('category_sample_size')}, "
            f"fix_rate={ora_summary.get('empirical_repair_status', {}).get('fixed_rate')}%, "
            f"matched_cluster={ora_summary.get('matched_failure_cluster')}\n"
            f"Matched Repair Manual: {guide_summary.get('title') if guide_summary else 'None'}\n\n"
            "Return valid JSON ONLY with keys:\n"
            "{\n"
            '  "diagnosis_summary_ar": "ملخص دقيق ومباشر للعطل بالعربية",\n'
            '  "diagnosis_summary_en": "Concise technical summary in English",\n'
            '  "visual_image_query": "short English query for exact device + component repair images (e.g. iPhone 13 battery replacement)",\n'
            '  "root_causes": [\n'
            '    {"title_ar": "...", "title_en": "...", "explanation_ar": "...", "explanation_en": "...", "repair_method_ar": "...", "repair_method_en": "..."}\n'
            '  ],\n'
            '  "repair_steps_ar": ["خطوة 1...", "خطوة 2..."],\n'
            '  "repair_steps_en": ["Step 1...", "Step 2..."]\n'
            "}"
        )

        try:
            if provider == "gemini":
                out = _call_gemini(api_key, prompt, timeout=timeout)
            elif provider == "openai":
                out = _call_openai_compatible("https://api.openai.com/v1/chat/completions", api_key, os.environ.get("OPENAI_MODEL", "gpt-4o-mini"), prompt, timeout=timeout)
            elif provider == "groq":
                out = _call_openai_compatible("https://api.groq.com/openai/v1/chat/completions", api_key, os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"), prompt, timeout=timeout)
            elif provider == "openrouter":
                out = _call_openai_compatible("https://openrouter.ai/api/v1/chat/completions", api_key, os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini"), prompt, timeout=timeout)
            else:
                return {"configured": False, "status": "unsupported_provider", "provider": provider}

            return {
                "configured": True,
                "status": "completed",
                "provider": provider,
                **out,
            }
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                _FAILED_AUTH_KEYS.add((provider, api_key))
            return {
                "configured": False if e.code in (401, 403) else True,
                "status": "invalid_api_key" if e.code in (401, 403) else "provider_error",
                "provider": provider,
                "error": str(e),
            }
        except Exception as e:
            return {
                "configured": True,
                "status": "provider_error",
                "provider": provider,
                "error": str(e),
            }
