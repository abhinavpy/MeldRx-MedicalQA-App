import React from 'react';

const DecisionOutputComponent = ({ decisionResult }) => {
  if (!decisionResult) {
    return null;
  }

  return (
    <div className="decision-output-component">
      <h3>Decision Output</h3>
      <div className="result-card">
        <p>
          <strong>Prediction:</strong> {decisionResult.prediction}
        </p>
        <p>
          <strong>Recommendation:</strong> {decisionResult.recommendation}
        </p>
        {decisionResult.classification && (
          <p>
            <strong>Classification:</strong> {decisionResult.classification}
          </p>
        )}
        {decisionResult.evaluation && (
          <p>
            <strong>Evaluation:</strong> {decisionResult.evaluation}
          </p>
        )}
        {decisionResult.analysis && (
          <p>
            <strong>Analysis:</strong> {decisionResult.analysis}
          </p>
        )}
      </div>
    </div>
  );
};

export default DecisionOutputComponent;