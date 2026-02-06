from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pydantic import BaseModel

class DiagnosticTask(BaseModel):
    id: str  # Unique ID from the source DB
    patient_id: str
    file_path: str  # Path to local file or URL
    file_type: str  # XRAY, CT, REPORT, ECG
    status: str = "PENDING"
    metadata: Optional[Dict] = {}

class BaseConnector(ABC):
    """Abstract Base Class for Hospital System Connectors."""

    @abstractmethod
    def connect(self):
        """Establish connection to the HMS Database."""
        pass

    @abstractmethod
    def fetch_pending_tasks(self) -> List[DiagnosticTask]:
        """Retrieve a list of diagnostics that need analysis."""
        pass

    @abstractmethod
    def update_result(self, task_id: str, findings: Dict):
        """Write the analysis results back to the HMS."""
        pass
