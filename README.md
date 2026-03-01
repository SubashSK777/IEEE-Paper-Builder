# IEEE Paper Builder Suite

This suite contains an intelligent backend API and a dynamic frontend UI specifically built to help construct, refine, and format IEEE academic papers.

## Project Structure

1. **`backend/`**: A Python-based API utilizing the Google Gemini API to analyze, review, and correct various sections of IEEE papers (e.g., Abstract, Introduction, Equations, etc.).
2. **`frontend/`**: The frontend UI for users to seamlessly interact with the API, allowing them to construct their paper sections efficiently.

## Prerequisites

To run this project, make sure you have:

*   **Node.js**
*   **Python 3.8+**
*   **Google Gemini API Key** (Make sure to keep this safe!)

## Setup backend

Create a `.env` file inside the `backend` directory.

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Navigate inside the backend directory:

```bash
cd backend
```

Install standard python libraries (like `google.generativeai`, `python-dotenv`). (Assuming you have a `requirements.txt` file setup for the backend Python environment; otherwise, install manually):
```bash
pip install -r requirements.txt
```

Run the API:
```bash
python main.py
```

## Setup Frontend

Navigate inside the frontend directory:

```bash
cd frontend
```

Install modules:
```bash
npm install
```

Start the application:
```bash
npm start
``` 

## Security Note

*   **Important**: This repository is set up with `.gitignore` properly. Never commit the `.env` file since it exposes your sensitive API Keys!

## Contributing

Pull requests are always welcome!
