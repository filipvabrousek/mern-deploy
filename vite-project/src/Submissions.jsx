import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import axios from './axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import './index.css';
import GradingForm from './Grading';


const Submissions = () => {
  const [files, setFiles] = useState([]); // State to store the files
  const [images, setImages] = useState([]);
  const [bwi, setBWI] = useState([]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:3002/submissions'); // Adjust the URL based on your backend setup
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      console.log("DATA ARE");
      console.log(data);
      setFiles(data); // Update the state with the fetched files
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };



  const fetchImages = async () => {
    try {
      const response = await fetch('http://localhost:3002/images'); // Adjust backend URL
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  useEffect(() => {
    fetchFiles(); // Call the fetch function
    fetchImages();
  }, []); // Empty dependency array means this runs once when the component mounts

   const readContents = async (obj) => {

    console.log("GET");
    console.log(obj.path);
    //console.log(`http://localhost:3002/readFile/${obj.path}`)
    const response = await fetch(`http://localhost:3002/readFile/${obj.path.split("/").pop()}`); // Adjust the URL based on your backend setup
    try {
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
   } catch (error) {
      console.error('Error fetching files:', error);
    }
   
    const data = await response.json();
    console.log("READ DATA");
    console.log(data);
    setBWI(data);

    
  
  }



  const toBW = async (obj) => {

    console.log("GET");
    console.log(obj.path);
    //console.log(`http://localhost:3002/readFile/${obj.path}`)
    const response = await fetch(`http://localhost:3002/image/bw/${obj.path.split("/").pop()}`); // Adjust the URL based on your backend setup
    try {
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
   } catch (error) {
      console.error('Error fetching files:', error);
    }
   
    const data = await response.json();
    console.log("READ BW DATA");
    console.log(data);

    fetchImages();

  
  }



  return (
    <div>
      <h4>Submissions</h4>
      <h5>Teacher, grade this work</h5>
      <h5>After pressing read contents, you must refresh the page to download image of the document.</h5>
      <h4>{files.length}</h4>
      <ul>
        {files.length > 0 ? (
          files.map((file, index) => (
            <li key={file._id}>
            {file.name}{' '}
            <a
              href={`http://localhost:3002/files/${file._id}`} // Link to download file
              download={file.name}
            >
              Download </a>
              <p>{file._id}</p>
              <button onClick={() => readContents({path: `http://localhost:3002/files/${file._id}`})}>Read contents</button>
              <GradingForm fileId={file._id} />
          </li>
          ))
        ) : (
          <li>No files uploaded yet.</li> // Message if no files are found
        )}
      </ul>


      {images.length > 0 ? (
        <ul>
          {images.map((image) => (
            <li key={image._id} style={{display: "flex", flexDirection: "column"}}>
              <p>ID: {image._id}</p>
              <p>File Name: {image.fileName}</p>
              <a
                href={`http://localhost:3002/image/${image._id}`}
                download={image.fileName}
                className="btn btn-primary"
                style={{width: "200px"}}
              >
                Download
              </a>

              <img style={{width: "200px"}} src={`http://localhost:3002/image/${image._id}`}></img>


              <button onClick={() => toBW({path: `http://localhost:3002/image/${image._id}`})}>Black and white</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No images found</p>
      )}
     




     {bwi.length > 0 ? (
        <ul>
          {bwi.map((image) => (
              <img style={{width: "200px"}} src={`http://localhost:3002/images/bw/${image._id}`}></img>
          ))}
        </ul>
      ) : (
        <p>No images found</p>
      )}


    </div>
  );
};

export default Submissions;