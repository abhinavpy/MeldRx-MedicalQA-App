import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styling/DiagnosisPage.css";
import APIResponseDisplay from "./APIResponseDisplay";

const DiagnosisPage = () => {
  // Retrieve the final diagnosis data (the analysis result) passed via navigate
  const location = useLocation();
  const { finalDiagnosis, qaString, diagnosisString } = location.state || {};

  // State to hold the Perplexity API response and any error encountered
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const isDataReady = finalDiagnosis && qaString && diagnosisString;
  console.log("This is finalDiagnosis: ", finalDiagnosis);
  if(qaString) console.log("This  is qaString: ", qaString); else console.log("qaString is null");
  if(diagnosisString) console.log("This is diagnosisString: ", diagnosisString); else console.log("diagnosisString is null");


  // Use useEffect to trigger the API call when finalDiagnosis is available.
  useEffect(() => {
    if (isDataReady) {
      // Prepare the payload.
      // In this example, we use a conversation string from finalDiagnosis if available,
      // or a fallback dummy conversation.
      const payload = {
        qaString: qaString,
        diagnosisString: diagnosisString || "No diagnosis provided."
      };

      // Make the POST request to the backend endpoint for Perplexity API
      fetch("http://localhost:8000/perplexity/diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch Perplexity API response");
          }
          console.log("Response from the API: " + res);
          setApiResponse(res);
          return res.json();
        })
        .then((data) => {
          setApiResponse(data);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [isDataReady, finalDiagnosis && qaString && diagnosisString]);

  if (!finalDiagnosis || !qaString || !diagnosisString) {
    return (
      <div className="diagnosis-container">
        <div className="diagnosis-card">
          <h2 className="diagnosis-title">No diagnosis available</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="diagnosis-container">
      <div className="diagnosis-card">
        <div className="diagnosis-header">
          <h2 className="diagnosis-title">
            <span role="img" aria-label="medical-icon">🩺</span> Final Stress Analysis
          </h2>
          <p className="diagnosis-subtitle">
            Here is the analysis of your recorded session:
          </p>
        </div>

        {/* Display the analysis summary */}
        <div className="diagnosis-summary">
          <p className="summary-text">
            <span role="img" aria-label="summary-icon">💬</span> {finalDiagnosis.summary}
          </p>
        </div>

        {/* Optionally display additional diagnosis details if available */}
        {(finalDiagnosis.classification ||
          finalDiagnosis.likelihood ||
          finalDiagnosis.treatmentPlan ||
          finalDiagnosis.followUp ||
          finalDiagnosis.videoAnalysis) && (
          <ul className="diagnosis-list">
            {finalDiagnosis.classification && (
              <li>
                <strong>
                  <span role="img" aria-label="classification">🔖</span> Classification:
                </strong>{" "}
                {finalDiagnosis.classification}
              </li>
            )}
            {finalDiagnosis.likelihood && (
              <li>
                <strong>
                  <span role="img" aria-label="likelihood">🔮</span> Likelihood:
                </strong>{" "}
                {finalDiagnosis.likelihood}
              </li>
            )}
            {finalDiagnosis.treatmentPlan && (
              <li>
                <strong>
                  <span role="img" aria-label="treatment">💊</span> Treatment Plan:
                </strong>{" "}
                {finalDiagnosis.treatmentPlan}
              </li>
            )}
            {finalDiagnosis.followUp && (
              <li>
                <strong>
                  <span role="img" aria-label="follow-up">📅</span> Follow-Up:
                </strong>{" "}
                {finalDiagnosis.followUp}
              </li>
            )}
            {finalDiagnosis.videoAnalysis && (
              <li>
                <strong>
                  <span role="img" aria-label="video-analysis">📹</span> Video Analysis:
                </strong>{" "}
                {finalDiagnosis.videoAnalysis}
              </li>
            )}
          </ul>
        )}

        <div className="diagnosis-disclaimer">
          <p className="disclaimer-text">
            <strong>Disclaimer:</strong> The above analysis is generated by a language model and is provided for informational purposes only. It is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed physician for any health concerns.
          </p>
        </div>
      </div>

      {/* Display any error encountered */}
      {error && <div className="error-message">{error}</div>}
      
      {/* APIResponseDisplay component receives the response from the Perplexity API */}
      <APIResponseDisplay response={apiResponse} />
    </div>
  );
};

export default DiagnosisPage;
