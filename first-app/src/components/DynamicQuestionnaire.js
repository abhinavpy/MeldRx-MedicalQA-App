import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/DynamicQuestionnaire.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use an env variable for your API key, e.g., REACT_APP_GEMINI_API_KEY in .env
// const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI("AIzaSyBRCU_XwrX9ay2LXYsCgAuWUtY_QtrRcLI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const QUESTION_THRESHOLD = 7; // Final diagnosis threshold

const DynamicQuestionnaire = () => {
  const navigate = useNavigate();

  // ======================
  // 1. Questions & STT State (unchanged)
  // ======================
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
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const recognitionRef = useRef(null);

  // ======================
  // 2. Video Recording State & Refs
  // ======================
  // New state to store recorded video chunks
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoStreamRef = useRef(null);

  // ======================
  // 3. Reset voice answer when question changes (unchanged)
  // ======================
  useEffect(() => {
    setVoiceAnswer("");
  }, [currentQuestionIndex]);

  // ======================
  // 4. Initialize Video Recording on Mount
  // ======================
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
        // Set up MediaRecorder with MIME type video/webm
        const options = { mimeType: "video/webm; codecs=vp9" };
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        // Collect recorded chunks
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

    // Cleanup: Stop recorder and video stream on unmount
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

  // ======================
  // 5. Helper Functions for Question Handling (unchanged)
  // ======================
  const isScaleQuestion = () => {
    return questions[currentQuestionIndex].text
      .toLowerCase()
      .includes("on a scale of 1 to 10");
  };

  const hasMultipleChoiceOptions = () => {
    const opts = questions[currentQuestionIndex].options;
    return opts && opts.length > 0;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = value;
    setQuestions(updatedQuestions);
    if (voiceAnswer) {
      setVoiceAnswer("");
    }
  };

  const handleOptionClick = (option) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = option;
    setQuestions(updatedQuestions);
  };

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

  // ======================
  // 6. generateDiagnosis: Final Diagnosis Using Video Analysis & Conversation Q&A
  // ======================
  const generateDiagnosis = async () => {
    try {
      setIsLoading(true);

      // Stop video recording if still active
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        console.log("Stopped video recording for final diagnosis.");
      }

      // Brief delay to ensure all video data is captured
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Combine recorded video chunks into a single Blob
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });

      // Prepare FormData to upload the video to the backend
      const formData = new FormData();
      formData.append("file", videoBlob, "session_video.webm");

      // 6a. Upload video via the /upload/ endpoint
      const uploadResponse = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok) {
        throw new Error("Video upload failed.");
      }
      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename;
      console.log("Uploaded video filename:", filename);

      // 6b. Trigger video analysis via the /analyze/ endpoint
      const analyzeFormData = new FormData();
      analyzeFormData.append("filename", filename);
      const analyzeResponse = await fetch("http://localhost:8000/analyze/", {
        method: "POST",
        body: analyzeFormData,
      });
      if (!analyzeResponse.ok) {
        throw new Error("Video analysis failed.");
      }
      const analyzeData = await analyzeResponse.json();
      const videoAnalysisText = analyzeData.analysis;
      console.log("Video analysis result:", videoAnalysisText);

      // 6c. Build a prompt that includes the conversation and video analysis results
      // (The original prompt builder for diagnosis is used here.)
      const prompt = buildPrompt(questions, true) + "\nVideo Analysis: " + videoAnalysisText;
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      console.log("Final diagnosis from Gemini:", rawText);

      // Use parseDiagnosis to create a final diagnosis object
      const finalDiagnosis = parseDiagnosis(rawText);
      navigate("/diagnosis", { state: { finalDiagnosis } });
    } catch (error) {
      console.error("Error generating final diagnosis:", error);
      navigate("/diagnosis", {
        state: {
          finalDiagnosis: {
            summary: "Could not retrieve diagnosis at this time.",
            classification: "N/A",
            likelihood: "N/A",
            treatmentPlan: "N/A",
            followUp: "N/A",
            videoAnalysis: "N/A",
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ======================
  // 7. handleNextQuestion: Generate New Question or Final Diagnosis
  // ======================
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
      // At the end of the conversation, if the number of questions is below the threshold,
      // generate a new question; otherwise, generate the final diagnosis.
      if (questions.length < QUESTION_THRESHOLD) {
        await generateNewQuestion();
      } else {
        await generateDiagnosis();
      }
    }
  };

  // ======================
  // 8. generateNewQuestion & fallbackNewQuestion (unchanged)
  // ======================
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

  // ======================
  // 9. buildPrompt & parseDiagnosis (unchanged)
  // ======================
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
based on a set of Q&A. Please analyze the conversation and video below and provide a concise final diagnosis
in a STRICTLY in the below structured format, including all these components is REQUIRED (STRICT INSTRUCTIONS):
- Summary: (e.g., "Patient likely has X")
- Classification: (e.g., "Diagnosis X")
- Likelihood: (e.g., "High probability of X")
- Treatment: (e.g., "Prescribe medication Y")
- Follow-up: (e.g., "Schedule a follow-up in 2 weeks")
- Video-Analysis: (Include any relevant details from the video analysis)

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
      videoAnalysis: "",
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
      } else if (line.toLowerCase().startsWith("video-analysis:")) {
        diagnosis.videoAnalysis = line.replace(/video-analysis:/i, "").trim();
      }
    });
    if (!diagnosis.summary) diagnosis.summary = diagnosisText;
    return diagnosis;
  };

  // ======================
  // 10. Render the Component
  // ======================
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

            {isMCQ && !isScale && (
              <div className="options-container">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`option-button ${currentQuestion.answer === opt ? "selected" : ""}`}
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
                <div className="scale-value">Selected: {currentQuestion.answer || 5}</div>
                <p className="nccn-thermometer-text">This is a NCCN distress thermometer.</p>
              </div>
            )}

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
            <button
              type="button"
              onClick={handleSpeakQuestion}
              className="tts-button"
              disabled={isLoading}
            >
              {isLoading ? "..." : "🔊 Read Question"}
            </button>
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

      <div className="video-preview">
        <video ref={videoRef} autoPlay muted className="video-element" />
      </div>
    </div>
  );
};

export default DynamicQuestionnaire;
