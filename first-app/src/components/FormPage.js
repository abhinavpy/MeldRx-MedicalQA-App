import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styling/FormPage.css"; // Use the popup-form styling or a similar file

const FormPage = () => {
  const navigate = useNavigate();

  // Prepopulate with some example data or leave blank
  const [formData, setFormData] = useState({
    firstName: "Aaron",
    lastName: "Harrison",
    email: "aaron_harrison@email.com",
    phone: "+1 213-284-6605",
    age: "45",
    gender: "Male", // e.g., "Female", "Other"
    allergies: "None",
    existingConditions: "Hypertension",
    reasonForVisit: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Medical form submitted:", formData);

    // After successful submit, navigate away or show a success message
    navigate("/");
  };

  const handleCancel = () => {
    // Reset the form or navigate away
    navigate("/");
  };

  return (
    <div className="popup-form-container">
      <form onSubmit={handleSubmit} className="popup-form">
        {/* First Row */}
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              className="input-field"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              className="input-field"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="form-row">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Third Row */}
        <div className="form-row">
          <div className="form-group">
            <label>Age</label>
            <input
              type="text"
              name="age"
              className="input-field"
              value={formData.age}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              className="input-field"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Fourth Row */}
        <div className="form-row">
          <div className="form-group">
            <label>Allergies</label>
            <input
              type="text"
              name="allergies"
              className="input-field"
              value={formData.allergies}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Existing Conditions</label>
            <input
              type="text"
              name="existingConditions"
              className="input-field"
              value={formData.existingConditions}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Fifth Row (Single Column) */}
        <div className="form-row">
          <div className="form-group" style={{ width: "100%" }}>
            <label>Reason for Visit</label>
            <textarea
              name="reasonForVisit"
              className="input-field"
              rows={3}
              value={formData.reasonForVisit}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Form Buttons */}
        <div className="form-actions">
          <button type="submit" className="save-button">
            Save Changes
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormPage;
