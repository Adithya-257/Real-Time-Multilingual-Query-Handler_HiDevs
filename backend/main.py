from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect
from deep_translator import GoogleTranslator
from langcodes import Language

import requests

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------- REQUEST BODY ----------------
class Query(BaseModel):
    text: str


# --------------- TRANSLATE FUNCTION ----------------
def translate_to_english(text: str):
    try:
        return GoogleTranslator(source="auto", target="en").translate(text)
    except:
        return text


def translate_from_english(text: str, target_lang: str):
      try:
        return GoogleTranslator(source="en", target=target_lang).translate(text)
      except:
        return text  # fallback


# --------------- RESPONSE LOGIC ----------------
def generate_response(english_text: str):
    e = english_text.lower()

    if "weather" in e:
        return "The weather is clear and pleasant today."
    elif "name" in e:
        return "I am your multilingual AI assistant."
    elif "time" in e:
        return "I cannot check the exact time, but I'm here to help!"
    elif "hello" in e or "hi" or "hey" in e:
        return "Hello! How can I assist you today?"


    # default fallback
    return "I have received your query and processed it successfully."


# --------------- MAIN ROUTE ----------------
@app.post("/query")
def handle_query(q: Query):
    user_text = q.text

    try:
        detected_lang = detect(user_text)
    except:
        detected_lang = "unknown"

    # STEP 1: Translate to English
    english_version = translate_to_english(user_text)

    # STEP 2: Generate a response in English
    reply_english = generate_response(english_version)

    # STEP 3: Translate back to user language if not English
    if detected_lang != "en" and detected_lang != "unknown":
        final_reply = translate_from_english(reply_english, detected_lang)
    else:
        final_reply = reply_english

    try:
        full_language = Language.get(detected_lang).display_name()
    except:
        full_language = detected_lang

    return {
        "detected_language": detected_lang,
        "language_name": full_language,
        "english_query": english_version,
        "answer": final_reply
    }


@app.get("/")
def root():
    return {"message": "Backend is running!"}
