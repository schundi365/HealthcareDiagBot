from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
from typing import List

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MedicalBot")

from .connectors.hms_connector import HMSConnector
from .services.ai_service import AIAnalyzer

connector = HMSConnector()
ai_service = AIAnalyzer()

# Global Background Worker State
worker_running = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Background Worker
    global worker_running
    worker_running = True
    asyncio.create_task(background_worker())
    logger.info("Background Worker Started")
    yield
    # Shutdown
    worker_running = False
    logger.info("Background Worker Stopped")

app = FastAPI(title="Medical Diagnostic Bot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def background_worker():
    """Poller that checks DB for new files."""
    await asyncio.sleep(2) # Warmup
    connector.connect()
    
    while worker_running:
        try:
            tasks = connector.fetch_pending_tasks()
            for task in tasks:
                if not worker_running: break
                logger.info(f"Processing Task: {task.id}")
                
                # Analyze
                result = await ai_service.analyze_file(task.file_path, task.file_type)
                
                # Update DB
                connector.update_result(task.id, result)
            
            await asyncio.sleep(10)  # Poll every 10 seconds
        except Exception as e:
            logger.error(f"Worker Error: {e}")
            await asyncio.sleep(10)

@app.post("/upload")
async def manual_upload(
    file: UploadFile = File(...), 
    patient_id: str = Form(...),
    file_type: str = Form(...)
):
    """Manual upload endpoint for doctors."""
    # Save file locally (simulation of storage)
    upload_dir = "uploaded_files"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{patient_id}_{uuid.uuid4()}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    logger.info(f"Manual Upload: {file.filename} for {patient_id}")
    
    # Trigger Analysis Immediately
    result = await ai_service.analyze_file(file_path, file_type)
    
    # In a real app, we'd save this to DB. For now, return result.
    return {
        "status": "success",
        "task_id": str(uuid.uuid4()),
        "analysis": result
    }

@app.get("/queue")
def get_queue():
    """Get current pending tasks (View Only)."""
    return connector.fetch_pending_tasks()

@app.get("/")
def read_root():
    return {"status": "online", "service": "Medical Diagnostic Bot"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "worker": "running" if worker_running else "stopped"}
