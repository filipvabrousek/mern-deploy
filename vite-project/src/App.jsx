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
import FileUpload from './Submitter';
import UploadedFiles from './UploadedFiles';
import Submissions from './Submissions';
import GradingForm from './Grading';
import Questions from "./Questions";
import {ClozeWrapper} from "./Cloze";

// cd mongotest
// npm install react-router-dom and sth???

const App = () => {
  return (
    <Provider store={store}>
    <Router>
      <Routes>
        <Route exact path="/" element={<Home/>} />
        <Route path="/exam" element={<Exam/>} />
        <Route path="/questions" element={<Questions/>} />
        <Route path="/submitter" element={<FileUpload/>} />
        <Route path="/uploaded" element={<UploadedFiles/>} />
        <Route path="/grading" element={<Submissions/>} />
        <Route path="/cloze" element={<ClozeWrapper/>} />
      </Routes>
    </Router>
    </Provider>
  );
};


function Exam() {
  const dispatch = useDispatch();
  const timeLeft = useSelector((state) => state.timer.timeLeft);
  const timeLeftRef = useRef(timeLeft);

  // Fetch the exam time when the component is mounted
  useEffect(() => {
    dispatch(fetchExamTimeThunk());
  }, [dispatch]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Set up a timer to decrement every second
  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        dispatch(decrementTimer()); // Dispatch action every second
      }, 1000);
      return () => clearInterval(interval); // Cleanup the interval on unmount
    }
  }, [timeLeft, dispatch]);

  return (
    <div>
      <h1>Exam Running</h1>
      <p>Time Left: {timeLeft} seconds</p>
      {/* Render other parts of the exam as usual */}
    </div>
  );
}

function Home() {
  const [users, setUsers] = useState([]); // State to store users
  const [newUser, setNewUser] = useState({ name: '', age: '', email: '', password: '' }); // State to hold new user input
  const [loginUser, setLoginUser] = useState({ email: '', password: '' }); // State to hold new user input
  const [error, setError] = useState(null); // State to hold any error messages
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3002/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginUser),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        localStorage.setItem("user", data.user.email);
        setMessage(`Welcome back ${data.user.email}`);

      } else {
        setMessage("Unknown user")
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("USER");
      console.log(newUser);

      const response = await fetch("http://localhost:3002/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      console.log(response);

      const data = await response.json();

      if (response.ok) {
        setMessage(`Registration successful ${data.user.email}`);
        localStorage.setItem("user", data.user.email);

        const addedUser = newUser;
        setUsers((prevUsers) => [addedUser, ...prevUsers]); // Add the new user to the list
        setNewUser({ name: '', age: '', email: '', password: '' }); // Reset the form

      } else {
        setMessage(data.message || "Error during registrations");
       // alert(data.message);
        console.log(data.error); 
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };


  useEffect(() => {

    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:3002"); // Fetch from the backend
        if (!response.ok) { // Check if response is OK
          throw new Error('Network response was not ok');
        }
        const data = await response.json(); // Parse JSON response
        console.log(data); // Log the response data
        setUsers(data.reverse());
      } catch (err) {
        //  setError(err.message); // Set error message in state
        console.error('Fetch error:', err);
      }
    }; // komu všemu? 
    //  co s výkou v úterý (komu všemu)

    fetchUsers(); // Call the function to fetch users

    if (localStorage.getItem("user") != null) {
     let email = localStorage.getItem("user");
      setMessage(`Welcome back ${email}`);
    }
   
  }, []);

  return (
    <>

      <h2 class="mb-4">Welcome!</h2>
      <a href="/questions">Exam</a><br></br>
      <a href="/submitter">Submit</a><br></br>
      <a href="/cloze">Cloze</a>
      <h3>{ message }</h3>

      <h2 class="mb-4">Add New User</h2>
      <form onSubmit={handleSubmit} class="needs-validation" noValidate>
        <div class="mb-3">
          <label for="name" class="form-label">Name:</label>
          <input
            type="text"
            class="form-control"
            id="name"
            name="name"
            value={newUser.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div class="mb-3">
          <label for="age" class="form-label">Age:</label>
          <input
            type="number"
            class="form-control"
            id="age"
            name="age"
            value={newUser.age}
            onChange={handleInputChange}
            required
          />
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">Email:</label>
          <input
            type="email"
            class="form-control"
            id="email"
            name="email"
            value={newUser.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password:</label>
          <input
            type="password"
            class="form-control"
            id="password"
            name="password"
            value={newUser.password}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" class="btn btn-primary mb-2">Add User</button>
      </form>



    <form onSubmit={handleLoginSubmit}>
    <div class="mb-3">
          <label for="email" class="form-label">Email:</label>
          <input
            type="email"
            class="form-control"
            id="email"
            name="email"
            value={loginUser.email}
            onChange={handleLoginChange}
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password:</label>
          <input
            type="password"
            class="form-control"
            id="password"
            name="password"
            value={loginUser.password}
            onChange={handleLoginChange}
            required
          />
        </div>

        <button type="submit" class="btn btn-primary mb-2">Login</button>
    </form>

      <ul class="list-group">
        {users.map((user) => (
          <li key={user._id} class="list-group-item d-flex justify-content-between align-items-center">
            <span>
              <strong>{user.name}</strong> - {user.age} years old - {user.email}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App


// Secure exam reset
/*

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(403);  // Forbidden

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    
    req.user = user;
    next();
  });
};

// Example: Block exam reset if the exam is in progress
app.post('/resetExam', authenticateToken, (req, res) => {
  const examStatus = getExamStatus(req.user.id); // Get exam status based on user
  
  if (examStatus === 'started') {
    return res.status(403).json({ message: 'Exam already started, cannot reset.' });
  }
  
  // Proceed with reset logic
  resetExam(req.user.id);
  res.status(200).json({ message: 'Exam reset.' });
});
*/