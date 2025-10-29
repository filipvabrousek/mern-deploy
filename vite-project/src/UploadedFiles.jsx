import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import axios from './axios'
//import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import './index.css';


const UploadedFiles = () => {
  const [files, setFiles] = useState([]); // State to store the files

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:3002/files'); // Adjust the URL based on your backend setup
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data); // Update the state with the fetched files
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles(); // Call the fetch function
  }, []); // Empty dependency array means this runs once when the component mounts

  return (
    <div>
      <h4>Uploaded Files</h4>
      <ul>
        {files.length > 0 ? (
          files.map((file, index) => (
            <li style={{marginBottom:"3rem", border: "3px solid green", borderRadius: "1rem"}} 
                key={file._id}>
            {file.name}{' '}
            <p>{file._id}</p>
            <a
              href={`http://localhost:3002/files/${file._id}`} // Link to download file
              download={file.name} // Suggests file name for download
            >
              Download
            </a>
          </li>
          ))
        ) : (
          <li>No files uploaded yet.</li> // Message if no files are found
        )}
      </ul>
    </div>
  );
};

export default UploadedFiles;