import os
import sys
import uvicorn

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    print("=" * 60)
    print("Starting TechRepair AI Platform...")
    print("API Documentation: http://127.0.0.1:8000/docs")
    print("Web Application:   http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)

