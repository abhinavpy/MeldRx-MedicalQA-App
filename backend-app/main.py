import os
import uuid
import shutil
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
print(API_KEY)
if not API_KEY:
    raise Exception("API_KEY environment variable not set")

# Create a FastAPI instance
app = FastAPI()

# Allow requests from your frontend (http://localhost:3000)
origins = [
    "http://localhost:3000",
    # You can add more origins here if needed.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or use ["*"] to allow all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store uploaded videos
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# Pydantic model for the request payload from the frontend.
class PerplexityRequest(BaseModel):
    qaString: str
    diagnosisString: str

# External Perplexity API endpoint and API key (ensure you have set this in your .env file)
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY")
print(PERPLEXITY_API_KEY)
if not PERPLEXITY_API_KEY:
    raise Exception("PERPLEXITY_API_KEY environment variable not set.")

@app.post("/perplexity/diagnosis")
def perplexity_diagnosis(request: PerplexityRequest):
    """
    This endpoint receives qaString and diagnosisString from the frontend,
    constructs the message content, makes a POST request to the Perplexity API,
    and returns the JSON response.
    """
    # Construct the message content using the provided strings.
    message_content = (
        f"I have provided a diagnosis based on a conversation. "
        f"The conversation is as follows: {request.qaString}. "
        f"The diagnosis I provided is as follows: {request.diagnosisString}. "
        "I want you to back my diagnosis with reasoning and citations."
    )

    # Build the payload in the required format.
    payload = {
        "messages": [
            {
                "content": message_content,
                "role": "user"
            }
        ],
        "model": "sonar"
    }

    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        # Make the POST request to the Perplexity API.
        response = requests.post(PERPLEXITY_API_URL, json=payload, headers=headers)
        response.raise_for_status()  # Raise an HTTPError if the response was unsuccessful.
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling Perplexity API: {str(e)}")

    # Return the JSON response received from the Perplexity API.
    return response.json()


# ----------------------------
# Endpoint: Upload Video File
# ----------------------------
@app.post("/upload/")
async def upload_video(file: UploadFile = File(...)):
    """
    Accepts a video file upload, checks for valid MIME type,
    saves it to the file system, and returns the generated filename.
    """
    allowed_types = [
        "video/mp4",
        "video/mpeg",
        "video/mov",
        "video/avi",
        "video/x-flv",
        "video/mpg",
        "video/webm",
        "video/wmv",
        "video/3gpp",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid video file.")

    # Generate a unique filename to avoid collisions
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file.") from e

    return JSONResponse(content={"filename": unique_filename, "file_path": file_path})


# ---------------------------------------------------
# Endpoint: Analyze Video with Gemini Stress Detection
# ---------------------------------------------------
@app.post("/analyze/")
async def analyze_video(filename: str = Form(...)):
    """
    Accepts a filename (from the uploads folder), then uploads the video
    to the Gemini File API, polls until the file is processed,
    and finally calls Gemini's generative model to perform stress,
    emotion, and facial expression analysis. The result is returned as JSON.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Retrieve your Gemini API key from environment variables
    API_KEY = os.environ.get("GOOGLE_GEMINI_API_KEY")
    print(API_KEY)
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API_KEY not set in environment variables")

    try:
        # -------------------------
        # Step 1: Upload the Video
        # -------------------------
        # (This uses pseudo-code for the Gemini File API. Replace with your actual SDK calls.)
        #
        # For example, if you have a Python SDK:
        #
        # from google.generative_ai.server import GoogleAIFileManager
        # file_manager = GoogleAIFileManager(API_KEY)
        # upload_response = file_manager.upload_file(file_path, mime_type="video/mp4", display_name=filename)
        #
        # For this example, assume the following pseudo-response:
        class FileData:
            def __init__(self, name, mimeType, uri, state):
                self.name = name
                self.mimeType = mimeType
                self.uri = uri
                self.state = state

        # Pseudo-upload response
        file_data = FileData(name=str(uuid.uuid4()), mimeType="video/mp4", uri="gemini://file/" + filename, state="PROCESSING")

        # Simulate polling for file processing (in production, replace with actual API calls)
        # from google.generative_ai.server import FileState  # e.g., FileState.PROCESSING
        poll_interval = 10  # seconds
        max_polls = 12      # wait up to 2 minutes
        polls = 0

        while file_data.state == "PROCESSING" and polls < max_polls:
            # In your actual code, retrieve the file status:
            # file_data = file_manager.get_file(file_data.name)
            await asyncio.sleep(poll_interval)
            polls += 1
            # For demonstration, we change the state after a few polls
            if polls == 2:
                file_data.state = "ACTIVE"

        if file_data.state != "ACTIVE":
            raise HTTPException(status_code=500, detail="Video processing failed or timed out.")

        # ----------------------------------------------------
        # Step 2: Analyze Video Using Gemini Generative API
        # ----------------------------------------------------
        # (This is pseudo-code; replace with the actual SDK calls.)
        #
        # from google.generative_ai import GoogleGenerativeAI
        # gen_ai = GoogleGenerativeAI(API_KEY)
        # model = gen_ai.getGenerativeModel({"model": "gemini-1.5-pro"})
        # prompt = [
        #     {
        #         "fileData": {
        #             "mimeType": file_data.mimeType,
        #             "fileUri": file_data.uri
        #         }
        #     },
        #     {
        #         "text": "Analyze the stress levels, emotions, and facial expressions in this video and provide a comprehensive evaluation."
        #     }
        # ]
        # result = model.generateContent(prompt)
        # analysis_text = result.response.text()
        #
        # For this example, we will simulate the analysis result:
        analysis_text = (
            "Stress Level: Moderate. Emotions indicate slight anxiety with occasional expressions of concern. "
            "Facial analysis shows furrowed brows and tightened jaw muscles."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during video analysis: {str(e)}")

    return JSONResponse(content={"analysis": analysis_text})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
