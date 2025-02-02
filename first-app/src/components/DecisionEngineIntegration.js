import React, { useState, useEffect } from 'react';

const DecisionEngineIntegration = ({ patientData }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientData) return;
    setLoading(true);
    setError(null);

    // Simulate an API call or algorithm processing delay
    const timeout = setTimeout(() => {
      try {
        // Example "decision" based on age; adjust the logic as needed
        const age = parseInt(patientData.age, 10);
        const prediction = age > 60 ? 'High risk' : 'Low risk';
        const recommendation =
          age > 60 ? 'Schedule regular check-ups' : 'Maintain current lifestyle';
        setResult({ prediction, recommendation });
      } catch (err) {
        setError('Error processing data');
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [patientData]);

  return (
    <div className="decision-engine-integration">
      {loading && <p>Processing decision...</p>}
      {error && <p className="error">{error}</p>}
      {result && (
        <div>
          <h3>Decision Output</h3>
          <p>
            <strong>Prediction:</strong> {result.prediction}
          </p>
          <p>
            <strong>Recommendation:</strong> {result.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};

export default DecisionEngineIntegration;