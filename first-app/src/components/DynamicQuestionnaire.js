import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/DynamicQuestionnaire.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use an env variable for your API key, e.g., REACT_APP_GEMINI_API_KEY in .env
// const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
//console.log("The env key: " + process.env.REACT_APP_GOOGLE_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const QUESTION_THRESHOLD = 7; // Final diagnosis threshold

const DynamicQuestionnaire = () => {
  const navigate = useNavigate();

  // Our question objects now include:
  // {
  //   id: number,
  //   text: string,
  //   answer: string,
  //   options?: string[],  // If LLM provides multiple-choice options
  // }
  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "What is your name?",
      answer: "",
      options: [],
    },
    {
      id: 2,
      text: "What is your age?",
      answer: "",
      options: [],
    },
    {
      id: 3,
      text: "Is there anything particular that brings you here? Anything unusual you've noticed? Or any symptoms you're experiencing?",
      answer: "",
      options: [],
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // STT state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState(""); // New state for voice transcription
  const recognitionRef = useRef(null);

  // ---------------------------------------------------------------
  // Video Recording State & Refs
  // ---------------------------------------------------------------
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);

  // Initialize video recording on component mount
  useEffect(() => {
    async function initVideoRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // You can set codec options if needed (ensure browser support)
        const options = { mimeType: "video/webm; codecs=vp9" };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };

        recorder.start();
        console.log("Video recording started...");
      } catch (error) {
        console.error("Error accessing webcam for video recording:", error);
      }
    }
    initVideoRecording();

    // Cleanup function stops the recorder and video stream when component unmounts
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Reset voice answer when question changes
  useEffect(() => {
    setVoiceAnswer("");
  }, [currentQuestionIndex]);

  // ---------------------------------------------------------------
  // 1. Checking Question Type
  // ---------------------------------------------------------------
  const isScaleQuestion = () => {
    return questions[currentQuestionIndex].text
      .toLowerCase()
      .includes("on a scale of 1 to 10");
  };

  const hasMultipleChoiceOptions = () => {
    const opts = questions[currentQuestionIndex].options;
    return opts && opts.length > 0;
  };

  // ---------------------------------------------------------------
  // 2. Changing Answers (Text, Scale, Options)
  // ---------------------------------------------------------------
  const handleInputChange = (e) => {
    const value = e.target.value;
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = value;
    setQuestions(updatedQuestions);

    // Clear voice answer if user manually edits
    if (voiceAnswer) {
      setVoiceAnswer("");
    }
  };

  const handleOptionClick = (option) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = option;
    setQuestions(updatedQuestions);
  };

  // ---------------------------------------------------------------
  // 3. Speech-to-Text (STT) and Text-to-Speech (TTS)
  // ---------------------------------------------------------------
  const handleSpeakQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex].text;
    const utterance = new SpeechSynthesisUtterance(currentQuestion);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("SpeechRecognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      console.log("Audio recording started...");
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log("Audio recording ended...");
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      console.error("Speech Recognition Error:", event.error);
      alert("An error occurred with SpeechRecognition.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceAnswer(transcript);
      console.log("Transcribed:", transcript);

      const updated = [...questions];
      updated[currentQuestionIndex].answer = transcript;
      setQuestions(updated);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // ---------------------------------------------------------------
  // 4. Next Question or Diagnosis
  // ---------------------------------------------------------------
  const handleNextQuestion = async () => {
    if (voiceAnswer.trim()) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex].answer = voiceAnswer;
      setQuestions(updatedQuestions);
      setVoiceAnswer("");
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question
      if (questions.length >= QUESTION_THRESHOLD) {
        await generateDiagnosis();
      } else {
        await generateNewQuestion();
      }
    }
  };

  // ---------------------------------------------------------------
  // 5. Generate New Question (LLM)
  // ---------------------------------------------------------------
  const generateNewQuestion = async () => {
    try {
      setIsLoading(true);
      const prompt = buildPrompt(questions, false);
      const result = await model.generateContent(prompt);

      const rawText = result.response.text();
      console.log("LLM returned:", rawText);

      let parsed;
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(rawText);
        }
      } catch (err) {
        console.warn("JSON parse failed, using fallback:", err);
        parsed = {
          question: rawText.replace(/```json/g, "").replace(/```/g, "").trim(),
          options: [],
        };
      }

      if (!parsed.question || !Array.isArray(parsed.options)) {
        parsed = {
          question: "Could not parse question format",
          options: [],
        };
      }

      const newQuestion = {
        id: questions.length + 1,
        text: parsed.question,
        answer: "",
        options: parsed.options.filter((opt) => typeof opt === "string"),
      };

      setQuestions((prev) => [...prev, newQuestion]);
      setCurrentQuestionIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Error generating new question:", error);
      fallbackNewQuestion();
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // 6. Generate Diagnosis (LLM)
  // ---------------------------------------------------------------
  const generateDiagnosis = async () => {
    try {
      setIsLoading(true);
      const prompt = buildPrompt(questions, true);
      const result = await model.generateContent(prompt);

      const rawText = result.response.text();
      console.log("Received final diagnosis from Gemini:", rawText);

      const finalDiagnosis = parseDiagnosis(rawText);
      navigate("/diagnosis", { state: { finalDiagnosis } });
    } catch (error) {
      console.error("Error generating diagnosis:", error);
      navigate("/diagnosis", {
        state: {
          finalDiagnosis: {
            summary: "Could not retrieve diagnosis at this time.",
            classification: "N/A",
            likelihood: "N/A",
            treatmentPlan: "N/A",
            followUp: "N/A",
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // 7. Fallback if LLM fails
  // ---------------------------------------------------------------
  const fallbackNewQuestion = () => {
    const newQuestion = {
      id: questions.length + 1,
      text: "Gemini is currently unavailable—please try again later.",
      answer: "",
      options: [],
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  // ---------------------------------------------------------------
  // 8. Prompt Building & Parsing
  // ---------------------------------------------------------------
  const buildPrompt = (qArray, isDiagnosis) => {
    const qaString = qArray
      .map((q, idx) => `Q${idx + 1}: ${q.text}\nA${idx + 1}: ${q.answer}`)
      .join("\n");

    if (!isDiagnosis) {
      return `
You are a medical assistant. The following is a conversation with a patient.
Use the patient's responses to ask a highly relevant next question about their health.
Do not ask questions that will not help in diagnosing the patient.
Do not ask if patient has enough funds/finances/health insurance or any other irrelevant questions.
STRICT INSTRUCTIONS:
1. Respond ONLY with valid JSON containing:
   - "question": string (required)
   - "options": array of strings (required)
2. Remove any markdown formatting
3. Example response:
{"question": "Where is the pain located?", "options": ["Chest", "Abdomen", "Back"]}

Patient conversation:
${qaString}

Next medical question in JSON:
      `;
    } else {
      return `
You are a highly experienced medical professional with the ability to diagnose common conditions
based on a set of Q&A. Please analyze the conversation below and provide a concise final diagnosis
in a STRICTLY in the below structured format, including all these components is REQUIRED (STRICT INSTRUCTIONS):
- Summary: (e.g., "Patient likely has X")
- Classification: (e.g., "Diagnosis X")
- Likelihood: (e.g., "High probability of X")
- Treatment: (e.g., "Prescribe medication Y")
- Follow-up: (e.g., "Schedule a follow-up in 2 weeks")

Return your response in STRICTLY plain text ONLY.

Here is the conversation so far:
${qaString}

Now provide the final diagnosis:
      `;
    }
  };

  const parseDiagnosis = (diagnosisText) => {
    const lines = diagnosisText.split("\n").map((l) => l.trim());
    const diagnosis = {
      summary: "",
      classification: "",
      likelihood: "",
      treatmentPlan: "",
      followUp: "",
    };

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith("summary:")) {
        diagnosis.summary = line.replace(/summary:/i, "").trim();
      } else if (line.toLowerCase().startsWith("classification:")) {
        diagnosis.classification = line.replace(/classification:/i, "").trim();
      } else if (line.toLowerCase().startsWith("likelihood:")) {
        diagnosis.likelihood = line.replace(/likelihood:/i, "").trim();
      } else if (line.toLowerCase().startsWith("treatment:")) {
        diagnosis.treatmentPlan = line.replace(/treatment:/i, "").trim();
      } else if (line.toLowerCase().startsWith("follow-up:")) {
        diagnosis.followUp = line.replace(/follow-up:/i, "").trim();
      }
    });

    if (!diagnosis.summary) diagnosis.summary = diagnosisText;
    return diagnosis;
  };

  // ---------------------------------------------------------------
  // Rendering Logic
  // ---------------------------------------------------------------
  const currentQuestion = questions[currentQuestionIndex];
  const isScale = isScaleQuestion();
  const isMCQ = hasMultipleChoiceOptions();

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-card">
        <h2 className="questionnaire-title">
          <span role="img" aria-label="stethoscope">🩺</span> Interactive Medical Questionnaire
        </h2>
        <p className="questionnaire-subtitle">
          Please answer the question below. You may speak or type (or choose from options).
        </p>

        <form className="questionnaire-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="question-label">
              <span role="img" aria-label="question">❓</span> {currentQuestion.text}
            </label>

            {/** 1) If LLM provided multiple-choice options, show them */}
            {isMCQ && !isScale && (
              <div className="options-container">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`option-button ${
                      currentQuestion.answer === opt ? "selected" : ""
                    }`}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isLoading || isRecording}
                  >
                    {opt}
                  </button>
                ))}
                <input
                  type="text"
                  value={voiceAnswer || questions[currentQuestionIndex].answer}
                  onChange={handleInputChange}
                  className="input-field"
                  disabled={isLoading || isRecording}
                  placeholder="Speak or type your answer..."
                />
              </div>
            )}

            {/** 2) If question is "On a scale of 1 to 10" */}
            {isScale && (
              <div className="scale-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentQuestion.answer || 5}
                  onChange={handleInputChange}
                  className="scale-slider"
                  disabled={isLoading || isRecording}
                />
                <div className="scale-value">
                  Selected: {currentQuestion.answer || 5}
                </div>
                <p className="nccn-thermometer-text">
                  This is a NCCN distress thermometer.
                </p>
              </div>
            )}

            {/** 3) Fallback: text input if no MCQ and not scale */}
            {!isMCQ && !isScale && (
              <input
                type="text"
                value={currentQuestion.answer}
                onChange={handleInputChange}
                className="input-field"
                disabled={isLoading || isRecording}
              />
            )}
          </div>

          <div className="speech-buttons">
            {/* TTS */}
            <button
              type="button"
              onClick={handleSpeakQuestion}
              className="tts-button"
              disabled={isLoading}
            >
              {isLoading ? "..." : "🔊 Read Question"}
            </button>

            {/* STT */}
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                className="stt-button start"
                disabled={isLoading}
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="stt-button stop"
                disabled={isLoading}
              >
                🛑 Stop Recording
              </button>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cta-button"
              onClick={handleNextQuestion}
              disabled={isLoading || isRecording}
            >
              {isLoading
                ? "Generating..."
                : currentQuestionIndex < questions.length - 1
                ? "Next"
                : questions.length < QUESTION_THRESHOLD
                ? "Submit & Generate Next"
                : "Get Final Diagnosis"}
            </button>
          </div>
        </form>

        <div className="answers-section">
          <h3 className="answers-title">Previous Q &amp; A</h3>
          <div className="answers-list">
            <ul>
              {questions.slice(0, currentQuestionIndex + 1).map((q) => (
                <li key={q.id} className="answers-list-item">
                  <strong>{q.text}</strong> — {q.answer || "..."}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/** Video Preview Box */}
      <div className="video-preview">
        <video ref={videoRef} autoPlay muted className="video-element" />
      </div>
    </div>
  );
};

export default DynamicQuestionnaire;
