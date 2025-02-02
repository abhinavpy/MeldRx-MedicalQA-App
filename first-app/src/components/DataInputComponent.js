import React, { useState } from 'react';

const DataInputComponent = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    symptoms: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (!formData.age || isNaN(formData.age) || formData.age <= 0) {
      newErrors.age = 'A valid age is required';
    }
    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Please provide symptoms';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
    } else {
      setErrors({});
      // Handle form submission logic (e.g., call a decision engine service)
      console.log('Submitted data:', formData);
    }
  };

  return (
    <div className="data-input-component">
      <h2>Enter Patient Data</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="patientName">Patient Name:</label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
          />
          {errors.patientName && <span className="error">{errors.patientName}</span>}
        </div>

        <div>
          <label htmlFor="age">Age:</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
          />
          {errors.age && <span className="error">{errors.age}</span>}
        </div>

        <div>
          <label htmlFor="symptoms">Symptoms:</label>
          <textarea
            id="symptoms"
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
          ></textarea>
          {errors.symptoms && <span className="error">{errors.symptoms}</span>}
        </div>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default DataInputComponent;