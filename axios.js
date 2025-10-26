// src/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3002', // Change this to your API's base URL
  timeout: 1000, // Optional: Set a timeout for requests
  headers: {
    'Content-Type': 'application/json', // Set default headers if needed
  },
});

export default axiosInstance;
