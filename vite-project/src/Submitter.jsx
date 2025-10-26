import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import axios from './axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import './index.css';

import { useSelector, useDispatch } from 'react-redux';
import { fetchExamTimeThunk, decrementTimer } from './timerslicer';
import { Provider } from 'react-redux';
import store from './store'; // Import the Redux store

// submitter
const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const files = useSelector((state) => state.files);
  const [deadline, setDeadline] = useState(null); // State to store the deadline
  const [message, setMessage] = useState(null); // State to store the message

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/txt' || selectedFile.type === "text/plain")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        const fileData = {
          name: selectedFile.name,
          data: base64data.split(',')[1], // Get base64 string (remove header)
        };
        setFile(fileData);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert('Please select a PDF file.');
    }
  };

  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const response = await fetch('http://localhost:3002/deadline');
        if (!response.ok) {
          throw new Error('Failed to fetch deadline');
        }
        const data = await response.json();
        setDeadline(new Date(data.deadline)); // Store as Date object
      } catch (error) {
        console.error('Error fetching deadline:', error);
      }
    };

    // http://127.0.0.1:5173/submitter
    const fetchFeedback = async () => {
      try {


        const r1 = await fetch("http://localhost:3002/latest-submission");//.then(res => res.json()).then(res => console.log(res.feedback));
        const waitForMe = await r1.json();

        const myID = waitForMe.id;
        console.log(`Fetch this document below: ${myID}`);



        const response = await fetch(`http://localhost:3002/grade/${myID}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        const data = await response.json();
        console.log(data); // {grade: 'ib'} fetching this
        setFeedback(data.feedback); // Store as Date object
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchDeadline(); // Fetch deadline when the component mounts
    fetchFeedback(); // Fetch deadline when the component mounts
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (file) {
      try {
        const response = await fetch('http://localhost:3002/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(file), // Convert the file object to JSON
        });

        if (!response.ok) {
          throw new Error('File upload failed.');
        }

        const result = await response.json();
      //  alert(result.message);
        console.log(result);
        setFile(null); // Clear the input


        if (result.action === "you-are-fucked") {
          setMessage("The task has been submitted after deadline.");
        }

        if (result.action === "OK") {
          setMessage("The file has been uploaded successfully.");
        }


      } catch (error) {
        console.error('File upload failed:', error);
        alert('File upload failed. Please try again.');
      }
    }
  };

  return (
    <div>


    <h6 className="text-muted fw-semibold mb-3">
  Deadline: {deadline ? deadline.toLocaleString() : 'Loading...'}
</h6>

<h3 className="text-danger fw-bold mb-4">
  {message}
</h3>

    <div className="text-start">
  <h3 className="fs-4 fw-bold text-dark mb-2">
    Feedback
  </h3>
  <h3 className="fs-5 text-muted">
    {feedback}
  </h3>
</div>



  { feedback === null ?
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="fileUpload" className="form-label">Upload Assignment (PDF only)</label>
        <input 
          type="file" 
          className="form-control" 
          id="fileUpload" 
          accept=".pdf, .txt" 
          onChange={handleFileChange} 
        />
      </div>
      <button type="submit" className="btn btn-primary">Upload</button>
    </form> : null
}


    </div>
  );
};

export default FileUpload;

