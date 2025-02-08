import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components
import Dashboard from "./components/Dashboard";
import FormPage from "./components/FormPage";
import DataInputComponent from "./components/DataInputComponent";
import DecisionEngineIntegration from "./components/DecisionEngineIntegration";
import DecisionOutputComponent from "./components/DecisionOutputComponent";
import DynamicQuestionnaire from "./components/DynamicQuestionnaire";
import DiagnosisPage from "./components/DiagnosisPage";
import APIResponseDisplay from "./components/APIResponseDisplay";

function App() {
  // Example patientData and decisionResult for demonstration
  const patientData = {
    patientName: "John Doe",
    age: "45",
    symptoms: "Headache, nausea",
  };

  const decisionResult = {
    prediction: "Low risk",
    recommendation: "Maintain current lifestyle",
    classification: "A",
    evaluation: "Normal",
    analysis: "No immediate concerns",
  };

  return (
    <Router>
      <Routes>
        {/* Dashboard as the default route */}
        <Route path="/" element={<Dashboard />} />

        {/* Direct route to the Form page */}
        <Route path="/form" element={<FormPage />} />
        <Route path="/dynamic-questionnaire" element={<DynamicQuestionnaire />} />
        <Route path="/diagnosis" element={<DiagnosisPage />} />
        <Route path="/api-response-display" element={<APIResponseDisplay />} />

        {/* Other routes */}
        <Route path="/patient-data" element={<DataInputComponent />} />
        <Route
          path="/decision-tools"
          element={
            <div>
              <DecisionEngineIntegration patientData={patientData} />
              <DecisionOutputComponent decisionResult={decisionResult} />
            </div>
          }
        />
        <Route path="/reports" element={<div>Reports content</div>} />
      </Routes>
    </Router>
  );
}

export default App;
