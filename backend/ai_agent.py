import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

def refine_text(section_name: str, text: str, action: str):
    if not API_KEY:
        return "Error: GEMINI_API_KEY environment variable not set in backend.", "No change"

    model = genai.GenerativeModel('gemini-2.5-flash')
    
    if action == "verify_and_clean":
        prompt = f"""
        You are a strict formatting engine for an IEEE paper section called '{section_name}'.
        
        TASKS:
        1. STRIP DUPLICATE TITLES: If the user pasted the title '{section_name}' at the very beginning of the text, remove it.
        2. EQUATIONS: If you find inline or block math equations or formulas, you MUST preserve them but wrap them neatly inside [MATH] ... [/MATH] tags. Convert the formulas into perfectly spaced, clean Unicode math characters instead of raw LaTeX or plain ASCII (Use characters like ℝ, ᵢ, ᵈ, ∑, 𝛂, ², ∈). Example: [MATH] 𝒆ᵢ = 𝔼[𝑻ᵢ], 𝒆ᵢ ∈ ℝᵈ, d=256 [/MATH].
        3. Do NOT rewrite the user's base ideas or content, this is strictly a formatting pass.
        4. Return ONLY the finalized cleaned text. Do NOT add markdown wrappers like ```text ... ```. Do NOT add conversational filler.
        
        Original Text:
        {text}
        """
    else:
        prompt = f"""
        You are an academic editor working on an IEEE paper.
        Modify the following text for the section '{section_name}' according to the action: '{action}'.
        
        Available actions and their meanings:
        - fix_grammar: Fix grammatical and spelling errors perfectly.
        - make_longer: Expand the length of the text by 15-30% while retaining meaning.
        - make_shorter: Reduce the length of the text by 15-30% while retaining meaning.
        
        IMPORTANT RULES:
        1. Return ONLY the finalized, modified text.
        2. Do NOT add markdown wrappers or conversational filler.
        3. If there are equations wrapped in [MATH] tags or plain form, preserve them entirely.
        
        Original Text:
        {text}
        """
    
    try:
        response = model.generate_content(prompt)
        suggested = response.text.strip()
        
        if suggested.startswith("```"):
            suggested = suggested.split("\n", 1)[-1]
            if suggested.endswith("```"):
                suggested = suggested[:-3]
        
        return suggested.strip(), f"Action {action} processed."
    except Exception as e:
        return f"Error connecting to AI: {str(e)}", "Error"
