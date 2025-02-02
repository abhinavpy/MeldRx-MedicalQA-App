import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => (
  <nav className="sidebar">
    <ul>
      <li>
        <Link to="/">Dashboard</Link>
      </li>
      <li>
        <Link to="/patient-data">Patient Data</Link>
      </li>
      <li>
        <Link to="/decision-tools">Decision Tools</Link>
      </li>
      <li>
        <Link to="/reports">Reports</Link>
      </li>
    </ul>
  </nav>
);

export default Navigation;