import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=API_KEY)

with open('output_clean.txt', 'w', encoding='utf-8') as f:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(f"{m.name}\n")
