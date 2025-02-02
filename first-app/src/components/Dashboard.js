import React from "react";
import { useNavigate } from "react-router-dom"; // Import the navigate hook
import "../styling/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  // A simple helper function to navigate to different paths
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">+</div>
        <nav>
          <ul>
            <li onClick={() => handleNavigation("/")}>
              <span role="img" aria-label="home">🏠</span>
            </li>
            <li onClick={() => handleNavigation("/reports")}>
              <span role="img" aria-label="reports">📋</span>
            </li>
            <li onClick={() => handleNavigation("/analytics")}>
              <span role="img" aria-label="analytics">📊</span>
            </li>
            <li onClick={() => handleNavigation("/settings")}>
              <span role="img" aria-label="settings">⚙️</span>
            </li>
            {/* New icon for the form page */}
            <li onClick={() => handleNavigation("/form")}>
              <span role="img" aria-label="form">✍️</span>
            </li>
            <li onClick={() => handleNavigation("/dynamic-questionnaire")}>
              <span role="img" aria-label="form">✍️</span>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <input type="text" placeholder="Search..." className="search-bar" />
          <div className="user-profile">
            <span className="notification">🔔</span>
            <span className="user-name">Henry Roberts</span>
            <div className="user-avatar">👤</div>
          </div>
        </header>

        <section className="dashboard-stats">
          <div className="stat-card">
            50,001 <span>Total Patients</span>
          </div>
          <div className="stat-card">
            34,863 <span>Total Patients Admitted</span>
          </div>
          <div className="stat-card">
            $8,742 <span>Avg Treat. Costs</span>
          </div>
          <div className="stat-card">
            53 min <span>Avg ER Waiting Time</span>
          </div>
          <div className="stat-card">
            596 <span>Available Staff</span>
          </div>
        </section>

        <section className="charts-section">
          <div className="chart">
            <h3>Outpatients vs. Inpatients Trend</h3>
            <div className="bar-chart">[Bar Chart Placeholder]</div>
          </div>

          <div className="chart">
            <h3>Patients by Gender</h3>
            <div className="pie-chart">[Pie Chart Placeholder]</div>
          </div>
        </section>

        <section className="details-section">
          <div className="detail-card">
            <h3>Patient By Division</h3>
            <table>
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Inpatient</th>
                  <th>Outpatient</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Surgery</td>
                  <td>9,471</td>
                  <td>17,842</td>
                </tr>
                <tr>
                  <td>Dermatology</td>
                  <td>6,889</td>
                  <td>13,053</td>
                </tr>
                <tr>
                  <td>Neurology</td>
                  <td>5,299</td>
                  <td>9,772</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="detail-card">
            <h3>Avg Waiting Time By Division</h3>
            <div className="progress-bar">Cardiology - 50%</div>
            <div className="progress-bar">Dermatology - 37%</div>
            <div className="progress-bar">Neurology - 50%</div>
          </div>

          <div className="detail-card">
            <h3>The doctor explained the treatment understandably</h3>
            <div className="feedback-bar">Fully Agree - 45%</div>
            <div className="feedback-bar">Rather Agree - 26%</div>
            <div className="feedback-bar">Rather Disagree - 17%</div>
            <div className="feedback-bar">Fully Disagree - 7%</div>
            <div className="feedback-bar">Don't know - 4%</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
