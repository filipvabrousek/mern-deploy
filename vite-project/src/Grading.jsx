import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import axios from './axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import './index.css';

const GradingForm = ({ fileId }) => { // fileId is the ID of the file being graded
    const API = import.meta.env.VITE_API_URL || "http://localhost:3002";

  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleGradeChange = (e) => setGrade(e.target.value);
  const handleFeedbackChange = (e) => setFeedback(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("SENDING BOTH GRADE AND FEEDBACK TO ");
    console.log("Hello");
    console.log(grade);
    console.log(feedback);


    // IMPORTANT !!!!!!!
    const comment = feedback;

    try {
      const response = await fetch(`${API}/grade/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, comment }),
      });

      const result = await response.json();
      if (response.ok) {
        setGrade('');
        setFeedback('');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to submit grade:', error);
      alert('Failed to submit grade. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    try {
      const response = await fetch(`${API}/submissions`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete submissions');
      }

      const result = await response.json();
      alert(result.message); // Display success message
    } catch (error) {
      console.error('Error deleting submissions:', error);
      alert('Failed to delete submissions. Please try again.');
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <h4>Grading Form</h4>
      <div className="mb-3">
        <label htmlFor="grade" className="form-label">Grade</label>
        <input 
          type="text" 
          className="form-control" 
          id="grade" 
          value={grade} 
          onChange={handleGradeChange} 
          required 
        />
      </div>
      <div className="mb-3">
        <label htmlFor="feedback" className="form-label">Feedback</label>
        <textarea 
          className="form-control" 
          id="feedback" 
          rows="4" 
          value={feedback} 
          onChange={handleFeedbackChange} 
          required 
        />
      </div>
      <button type="submit" className="btn btn-primary">Submit Grade</button>
    </form>

    <div>
       <button className="btn btn-danger" onClick={handleDeleteAll}>
      Delete All Submissions
    </button>
    </div>
    </div>
  );
};

export default GradingForm;