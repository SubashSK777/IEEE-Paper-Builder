from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import uuid
from ai_agent import refine_text
from docx_generator import generate_docx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

class RefineRequest(BaseModel):
    section_name: str
    text: str
    action: str

class SectionDef(BaseModel):
    id: str
    name: str
    content: str

class ExportRequest(BaseModel):
    doc_config: Dict[str, Any]
    sections_list: List[SectionDef]
    figures: List[Dict[str, Any]]
    tables: List[Dict[str, Any]] = []

@app.post("/api/refine")
async def api_refine(req: RefineRequest):
    suggested_text, diff_summary = refine_text(req.section_name, req.text, req.action)
    return {"suggested_text": suggested_text, "summary": diff_summary}

@app.post("/api/upload_figure")
async def upload_figure(
    file: UploadFile = File(...),
    figure_number: str = Form(...),
    caption: str = Form(...),
    target_section: str = Form("None")
):
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as f:
        f.write(await file.read())
    
    return {
        "id": str(uuid.uuid4()),
        "filepath": filepath,
        "figure_number": figure_number,
        "caption": caption
    }

@app.post("/api/export_docx")
async def export_docx(req: ExportRequest):
    output_path = f"IEEE_Paper_{uuid.uuid4()}.docx"
    generate_docx(req.doc_config, req.sections_list, req.figures, req.tables, output_path)
    return FileResponse(
        output_path, 
        filename="custom_paper.docx", 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
