import express, { json } from 'express';
import { connect, Schema, model } from 'mongoose';
import { genSalt, hash, compare } from 'bcrypt';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
const app = express();
app.use(json({ limit: '100mb' })); // Middleware to parse JSON
// limit too large error
const NODE_ENV = 'production';
const MONGO_URI = "mongodb+srv://filipvabrousek:Elelema-2025@cluster0.9g60lki.mongodb.net/?appName=Cluster0";
const JWT_SECRET = 'yourSuperSecretKey';  // 19:34:59 Works!!! 09/10/2024

let startTime = null; // Server-side variable to store exam start time
const EXAM_DURATION = 70;//80000; // was 70
let isRunning = false;
let isOver = true;
let shouldAllowExamStart = true;

// require('dotenv').config();
import dotenv from 'dotenv';
dotenv.config(); // Loads variables from .env

import cors from 'cors';
// import { GREEK } from 'mysql/lib/protocol/constants/charsets';
app.use(cors());

import { writeFileSync } from "fs";
import { createCanvas, loadImage } from 'canvas';

// Connect to MongoDB
/* LOCAL
mongoose.connect('mongodb://localhost:27017/testdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Could not connect to MongoDB", err));
*/

// ONLINE
connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})




const userSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Password field
  createdAt: { type: Date, default: Date.now }
});

const fileSchema = new Schema({
  name: { type: String, required: true },
  data: { type: String, required: true }, // Store the file as a base64 string
});

const submissionSchema = new Schema({
  studentID: { type: String, required: true },
  name: { type: String, required: true },
  data: { type: String, required: true },
  grade: { type: String, default: "-" },
  comment: { type: String, default: "-" },
  date: { type: Date, default: Date.now }
  // Store the file as a base64 string
}, { timestamps: true });

// timestamps: true} 23:52:29


const imageSchema = new Schema({
  fileName: String,
  data: Buffer,
  contentType: String,
});

const Image = model('Image', imageSchema);


const emschema = new Schema({
  userId: { type: String, required: true },   // could also be email or session ID
  examId: { type: String, required: true },
  answers: { type: Object, default: {} },     // { questionId: answer }
  currentQuestionId: { type: String, default: null }, // 🆕 track last question
  updatedAt: { type: Date, default: Date.now },
});





// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if the password is modified
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt); // Hashing the password
  next();
});


// Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await compare(enteredPassword, this.password);
};

const questionSchema = new Schema({
 /* question: String,
  options: [String],
  answer: String, // Correct answer,
   type: String, // Correct answer*/

    type: {
    type: String,
    enum: ["question", "cloze"], // ensures valid type
    required: true
  },
  question: String,     // for MCQs
  options: [String],    // for MCQs
  answer: String,       // single correct answer for MCQs

  // Cloze-specific fields
  text: String,         // the text with blanks
  blanks: [String],     // options for blanks
  correctAnswers: [String] // correct answers for cloze questions
});


const gradeSchema = new Schema({
  userID: String,
  nickname: String,
  score: String,
  date: String, //{type: Date, default: Date.now }//String 
  timestamp: Number
});




const Question = model('Question', questionSchema);
const User = model('User', userSchema);
const Gradea = model('Gradea', gradeSchema);
const File = model('File', fileSchema);
const Submission = model('Submission', submissionSchema);
const ExamProgress = model("ExamProgress", emschema);
const deadline = new Date('2024-10-28T15:39:00');
// new Date('2025-10-28T15:39:00'); // Example deadline


// 🧩 Save or update progress
app.post("/saveProgress", async (req, res) => {
  const { userId, examId, answers, currentQuestionId } = req.body;

  if (!userId || !examId) {
    return res.status(400).json({ error: "userId and examId are required" });
  }

  try {
    const progress = await ExamProgress.findOneAndUpdate(
      { userId, examId },
      { answers, currentQuestionId, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: "Progress saved", progress });
  } catch (err) {
    console.error("Error saving progress:", err);
    res.status(500).json({ error: "Failed to save progress" });
  }
});

// 🧩 Load progress
app.get("/loadProgress", async (req, res) => {
  const { userId, examId } = req.query;

  if (!userId || !examId) {
    return res.status(400).json({ error: "userId and examId are required" });
  }

  try {
   


    const progress = await ExamProgress
    .findOne({ userId, examId })
    .sort({ updatedAt: -1 });

   if (progress) {
  await ExamProgress.deleteMany({
    userId,
    examId,
    _id: { $ne: progress._id }, // only run if progress exists
  });
} else {
  console.log("No previous progress found for this user/exam.");
}

   // const progress = await ExamProgress.findOne({ userId, examId });
    res.json({ progress });
  } catch (err) {
    console.error("Error loading progress:", err);
    res.status(500).json({ error: "Failed to load progress" });
  }
});



// 🧹 Clear progress after exam submission
app.post("/clearProgress", async (req, res) => {
  const { userId, examId } = req.body;

  if (!userId || !examId) {
    return res.status(400).json({ error: "userId and examId are required" });
  }

  try {
    await ExamProgress.deleteMany({ userId, examId });
    res.json({ message: "Progress cleared successfully" });
  } catch (err) {
    console.error("Error clearing progress:", err);
    res.status(500).json({ error: "Failed to clear progress" });
  }
});


// -------------------------------------------------GET DEADLINE-------------------------------------------------------------
app.get('/deadline', (req, res) => {
  try {
    res.json({ deadline });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deadline' });
  }
});


// -------------------------------------------------READ FILE CONTENTS-------------------------------------------------------------
app.get('/readFile/:id', async (req, res) => {
  console.log("ID");
  console.log(req.params.id);

  try {
    // Find the submission by ID
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).send('Submission not found');
    }

    // Extract the base64-encoded data from the 'data' field
    const base64Data = submission.data;

    // Decode the base64 string to text using `atob` (or Buffer in Node.js)
    const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
    const decodedText = decodedData;

    // Create a canvas and set dimensions
    const canvasWidth = 800; // Width of the canvas
    const canvasHeight = 400; // Height of the canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Load the watermark image
    const watermarkPath = './watermark.png'; // Replace with your watermark image path
    const watermark = await loadImage(watermarkPath);

    // Draw the watermark image as a background
    ctx.drawImage(watermark, 0, 0, canvasWidth, canvasHeight);

    // Overlay white background with transparency
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set text properties
    ctx.fillStyle = '#1abc9c'; // Text color
    ctx.font = '31px Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Split text into lines if necessary
    const lineHeight = 24; // Space between lines
    const maxWidth = canvasWidth - 20; // Padding
    const lines = [];
    let currentLine = '';

    decodedText.split(' ').forEach((word) => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    // Draw each line of text on the canvas
    lines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, 10 + index * lineHeight);
    });

    // Save the canvas as a PNG image
    const outputPath = `./${submission.name.replace('.txt', '.png')}`;
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(outputPath, buffer);

    console.log(`Image saved successfully at ${outputPath}`);

    // Save the image to MongoDB
    const image = new Image({
      fileName: submission.name.replace('.txt', '.png'),
      data: buffer,
      contentType: 'image/png',
    });

    const saved = await image.save();
    console.log(`Image saved to MongoDB successfully at ${saved.id}`);

    res.status(200).send(`Image saved successfully as ${outputPath}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reading file');
  }
});





// -------------------------------------------------GET IMAGE BY ID-------------------------------------------------------------
app.get('/image/:id', async (req, res) => {
  try {
    // Retrieve the image from MongoDB using its ID
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).send('Image not found');
    }

    // Set the appropriate content type
    res.set('Content-Type', image.contentType);

    // Send the image data as a response
    res.send(image.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal server error');
  }
});

// -------------------------------------------------CONVERT IMAGE TO BW IMAGE BY ID-------------------------------------------------------------
app.get('/image/bw/:id', async (req, res) => {
  try {
    // Retrieve the image from MongoDB using its ID
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).send('Image not found');
    }

    // Load the image into a canvas
    const img = await loadImage(image.data);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0);

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Convert to black and white
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Compute grayscale value using the luminosity method
      const gray = Math.round(0.3 * r + 0.59 * g + 0.11 * b);

      // Set all color channels to the grayscale value
      pixels[i] = gray;     // Red
      pixels[i + 1] = gray; // Green
      pixels[i + 2] = gray; // Blue
      // Alpha remains unchanged (pixels[i + 3])
    }

    // Update the canvas with the black-and-white image data
    ctx.putImageData(imageData, 0, 0);

    let bwaName = "lplpl";
    // Save the canvas as a PNG image
    const outputPath = `./${bwaName}`;
    const buffer = canvas.toBuffer('image/png');
    //fs.writeFileSync(outputPath, buffer);

    console.log(`Image saved successfully at ${outputPath}`);

    // Save the image to MongoDB
    const imageso = new Image({
      fileName: bwaName,
      data: buffer,
      contentType: 'image/png',
    });

    const saved = await imageso.save();
    console.log(`Image on BW saved to MongoDB successfully at ${saved.id}`);

// 16:35:36 works!!!!!
// 09/05/2025

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send('Internal server error');
  }
});

// -------------------------------------------------GET ALL IMAGES-------------------------------------------------------------
app.get('/images', async (req, res) => {
  try {
    const images = await Image.find(); // Fetch IDs and file names only
    res.status(200).json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).send('Internal server error');
  }
});

// -------------------------------------------------GET LATEST SUBMISSION-------------------------------------------------------------
app.get('/latest-submission', async (req, res) => {
  try {
    // Sort by created date in descending order to get the latest record
    const latestSubmission = await Submission.findOne({}, 'id grade comment').sort({ createdAt: -1 });

    if (!latestSubmission) {
      return res.status(404).json({ message: 'No submissions found' });
    }

    res.status(200).json({
      id: latestSubmission.id,
      grade: latestSubmission.grade,
      feedback: latestSubmission.comment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch the latest submission', error });
  }
}); // IDS do not match!!!



// -------------------------------------------------UPLOAD FILE-------------------------------------------------------------
app.post('/upload', async (req, res) => {

  const currentTime = new Date();


  console.log(`Deadline is ${deadline}`);
  console.log(`Current time is ${currentTime}`);
  console.log(`PAST DEADLINE ${currentTime > deadline}`);

  const { name, data } = req.body; // Get name and data from the request body
  try {
    const newFile = new File({ name, data });
    await newFile.save();

    // We have submission with how before deadline infomration and grading by teacher
    // Make grading system by teacher from the list
    const studentID = "A09769G9Z9T7";
    const newSubmission = new Submission({ studentID, name, data });
    await newSubmission.save();

    if (currentTime > deadline) {
      return res.status(201).json({
        message: "File uploaded, but it was past the deadline. Please be mindful of deadlines in the future.",
        action: "you-are-fucked",
        file: newFile,
      });
    } else {
      return res.status(201).json({
        message: "File uploaded successfullya!",
        action: "OK",
        file: newFile,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error });
  }
});

// -------------------------------------------------GET FILES-------------------------------------------------------------
app.get('/files', async (req, res) => {
  try {
    const files = await File.find(); // Fetch all files from the database
    res.status(200).json(files); // Send the list of files as JSON
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error });
  }
});

// -------------------------------------------------GET SUBMISSIONS------------------------------------------------------------
// Teacher will see this
app.get('/submissions', async (req, res) => {
  try {
    const files = await Submission.find(); // Fetch all files from the database
    console.log(`SUB LENGTH ${files.length}`);


    res.status(200).json(files); // Send the list of files as JSON
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error });
  }
});

// -------------------------------------------------DELETE SUBMISSIONS-------------------------------------------------------------
app.delete('/submissions', async (req, res) => {
  try {
    await Submission.deleteMany({}); // Deletes all documents in the Submissions collection
    res.status(200).json({ message: 'All submissions have been deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete submissions', error });
  }
});

// http://127.0.0.1:5173/submissions
// this is called after submit grade here
app.post('/grade/:id', async (req, res) => {

  const files = await Submission.find();
  console.log(files.map(file => file.id));

  // 22:21:38 28/10/24 fields need to match !!!
  // not simple destrcutuing
  const { grade, comment } = req.body; // Get grade and feedback from request body
  const { id } = req.params; // Get file ID from request parameters

  try {
    console.log(`TRYING to update ${id}`);
    // console.log(id);
    console.log("GRADE: " + grade);
    console.log("FEEDBACK: " + comment);


    const updatedFile = await Submission.findByIdAndUpdate(
      id,
      { grade, comment }, // Update grade and feedback fields
      { new: true } // Return the updated document
    );

    console.log("TRIED");
    console.log(updatedFile);

    if (!updatedFile) {
      return res.status(404).json({ message: 'File not found' });
    }




    res.status(200).json({
      message: 'Grading information saved successfully!',
      file: updatedFile,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save gradinga information', error });
  }
});


// fetch("http://localhost:3002/grade/671fa26079dc2bcdf93eace1").then(res => res.json()).then(res => console.log(res));


// Fetch grading information for a specific file
// -------------------------------------------------GET GRADE-------------------------------------------------------------
app.get('/grade/:id', async (req, res) => {
  const { id } = req.params; // Get file ID from request parameters
  console.log(`I AM IN: ${id}`);


  console.log("I AM IN 2");
  try {
    // THIS HAS TO BE THE SAME
    const file = await Submission.findById(id, 'grade comment'); // Only fetch grade and feedback fields

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json({
      grade: file.grade,
      feedback: file.comment,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch grading information', error });
  }
});

// -------------------------------------------------GET FILE-------------------------------------------------------------
app.get('/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id); // Find the file by its ID
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set headers to force download
    res.set({
      'Content-Type': 'application/pdf', // Adjust based on your file type
      'Content-Disposition': `attachment; filename="${file.name}"`,
    });

    // Send file data
    res.send(Buffer.from(file.data, 'base64')); // Send the binary data
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file', error });
  }
});
/*
const mockNetworkingQuestions = [
  {
    type: "question",
    question: "Which OSI layer is responsible for reliable end-to-end delivery?",
    options: ["Physical", "Transport", "Network", "Session"],
    answer: "Transport",
  },
  {
    type: "question",
    question: "What is the default port number for HTTPS?",
    options: ["80", "443", "21", "25"],
    answer:"443",
  },

{
  type: "cloze",
  text: "The capital of France is [_____]. The capital of Germany is [_____].",
  blanks: ["Paris", "Berlin", "London", "Rome"],
  correctAnswers: ["Paris", "Berlin"]
}
];*/

const mockNetworkingQuestions = [
  // --- Multiple-choice networking questions ---
  {
    type: "question",
    question: "Which OSI layer is responsible for reliable end-to-end delivery?",
    options: ["Physical", "Transport", "Network", "Session"],
    answer: "Transport",
  },
  {
    type: "question",
    question: "What is the default port number for HTTPS?",
    options: ["80", "443", "21", "25"],
    answer: "443",
  },
  {
    type: "question",
    question: "Which protocol translates domain names into IP addresses?",
    options: ["FTP", "DNS", "SMTP", "ARP"],
    answer: "DNS",
  },
  {
    type: "question",
    question: "What device operates primarily at the Data Link layer?",
    options: ["Router", "Switch", "Hub", "Gateway"],
    answer: "Switch",
  },
  {
    type: "question",
    question: "Which of the following is a connectionless protocol?",
    options: ["TCP", "UDP", "FTP", "SSH"],
    answer: "UDP",
  },
  {
    type: "question",
    question: "What is the purpose of the ARP protocol?",
    options: [
      "Resolve IP to MAC addresses",
      "Encrypt data packets",
      "Route data between subnets",
      "Manage DNS zones",
    ],
    answer: "Resolve IP to MAC addresses",
  },

  // --- Cloze (conceptual fill-in-the-blank) ---
  {
    type: "cloze",
    text: "HTTP typically uses port [_____] while HTTPS uses port [_____].",
    blanks: ["80", "443", "21", "25"],
    correctAnswers: ["80", "443"],
  },
  {
    type: "cloze",
    text: "TCP establishes a connection using a [_____]-way handshake.",
    blanks: ["Two", "Three", "Four", "Five"],
    correctAnswers: ["Three"],
  },
  {
    type: "cloze",
    text: "The [_____] protocol is used to automatically assign IP addresses to devices on a network.",
    blanks: ["DHCP", "DNS", "HTTP", "SMTP"],
    correctAnswers: ["DHCP"],
  },
  {
    type: "cloze",
    text: "An IP address is divided into a [_____] part and a [_____] part.",
    blanks: ["network", "host", "protocol", "gateway"],
    correctAnswers: ["network", "host"],
  },
  {
    type: "cloze",
    text: "The [_____] protocol provides secure remote login over an encrypted channel.",
    blanks: ["SSH", "FTP", "Telnet", "SNMP"],
    correctAnswers: ["SSH"],
  },

  // --- Code completion (networking snippets) ---
  {
    type: "cloze",
    text: `In Node.js, you can make an HTTP GET request using the fetch API:
const response = await [_____]("https://api.example.com/data");
const json = await response.[_____]();`,
    blanks: ["fetch", "json", "get", "read"],
    correctAnswers: ["fetch", "json"],
  },
  {
    type: "cloze",
    text: `In Python, you can send a GET request using the requests library:
import requests
response = requests.[_____]("https://example.com")
print(response.[_____])`,
    blanks: ["get", "status_code", "read", "open"],
    correctAnswers: ["get", "status_code"],
  },
  {
    type: "cloze",
    text: `In JavaScript, to open a WebSocket connection:
const socket = new [_____](\"wss://echo.websocket.org\");
socket.[_____] = (event) => console.log(event.data);`,
    blanks: ["WebSocket", "onmessage", "connect", "receive"],
    correctAnswers: ["WebSocket", "onmessage"],
  },
  {
    type: "cloze",
    text: `In Python, to create a TCP socket:
import socket
s = socket.[_____](socket.AF_INET, socket.SOCK_STREAM)
s.[_____](("example.com", 80))`,
    blanks: ["socket", "connect", "bind", "listen"],
    correctAnswers: ["socket", "connect"],
  },
  {
    type: "cloze",
    text: `In Node.js, to start a simple HTTP server:
import http from "http";
http.[_____]((req, res) => {
  res.[_____](\"Hello, world!\");
}).listen(3000);`,
    blanks: ["createServer", "end", "write", "serve"],
    correctAnswers: ["createServer", "end"],
  },
  {
    type: "cloze",
    text: `In curl, to send a POST request with JSON data:
curl -X [_____] -H "Content-Type: application/json" -d '{"name":"test"}' [URL]`,
    blanks: ["POST", "GET", "PUT", "DELETE"],
    correctAnswers: ["POST"],
  },
];



// -------------------------------------------------ADD QUESTION-------------------------------------------------------------
app.post('/addQuestion', async (req, res) => {
  /*const { question, options, answer } = req.body;
  console.log(question);
  console.log(options);

  const questionInst = new Question({ question, options, answer });
  await questionInst.save();

  res.status(200).json({ message: "Question added." })*/

    const { question, options, answer, bulk } = req.body;

  try {
    if (bulk) {
      // Add all mock questions
      await Question.insertMany(mockNetworkingQuestions);
      return res.status(200).json({ message: "All mock networking questions added." });
    }

    // Single question
    const questionInst = new Question({ question, options, answer, type });
    await questionInst.save();

    res.status(200).json({ message: "Question added." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add question." });
  }


  
});

app.delete('/deleteAllQuestions', async (req, res) => {
  try {
    const result = await Question.deleteMany({}); // Delete all documents in the collection
    console.log("RESA");
    console.log(result);

    res.status(200).json({ message: 'All questions deleted successfully.', deletedCount: result.deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting all questions.' });
  }
});



// -------------------------------------------------REGISTER-------------------------------------------------------------
app.post('/register', async (req, res) => {

  const { name, age, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists");
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ name, age, email, password });
    await newUser.save();

    const token = sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, age: newUser.age, email: newUser.email } });
  } catch (err) {
    console.log("Error during registration.");
    console.log(err.message);
    res.status(500).json({ message: "Error during registration", error: err });
  }
});

// -------------------------------------------------START EXAM-------------------------------------------------------------
app.post('/startExam', (req, res) => {
  isRunning = true;
  isOver = false;
  shouldAllowExamStart = false;

  if (!startTime) {
    startTime = Math.floor(Date.now() / 1000); // Set the start time on the server when exam is started
  }
  return res.status(200).json({ message: 'Exam started', startTime });
});

// -------------------------------------------------IS RUNNING-------------------------------------------------------------
app.get('/isRunning', (req, res) => {
  return res.status(200).json({ isRunning: isRunning, isOver: isOver, shouldAllowExamStart: shouldAllowExamStart })
});

// -------------------------------------------------FETCH RESULT-------------------------------------------------------------
app.get('/fetchResults', async (req, res) => {

  try {
    const results = await Gradea.find({
      timestamp: {
        $exists: true, // Ensure the `timestamp` field exists
        $gte: 100000  // Filter for integers with at least 6 digits (100000 is the smallest 6-digit number)
      }
    })
      .sort({ timestamp: -1 }) // Sort by `timestamp` field in ascending order
      .limit(10); // Limit to 10 results

    //  const rev = results;              // Limit the number of results to 10
    return res.status(200).json({ results: results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching results' });
  }
});



// -------------------------------------------------GET QUESTIONS FROM API-------------------------------------------------------------
app.get('/questionsAPI', async (req, res) => {
  try { // 18:12:50 Redux !!!!

    const questions = await Question.find();
const questionsWithoutAnswers = questions.map(q => ({
  /*_id: q._id.toString(), // convert ObjectId to string
  question: q.question,
  options: q.options,
  type: q.type || "question", // preserve type if exists
  correctAnswers: q.correctAnswers || [],*/

   _id: q._id.toString(),
      type: q.type,
      question: q.question,
      options: q.options || [],
      text: q.text || "",
      blanks: q.blanks || [],
      correctAnswers: q.correctAnswers || []
}));
    const currentTime = Math.floor(Date.now() / 1000);

    const rem = currentTime - startTime;
    let remainingExamTime = EXAM_DURATION - rem;

    if (remainingExamTime < 0) {
      remainingExamTime = 0;
    }

    console.log("POINT 1");
    console.log(questions.length);
    console.log(questions);


    return res.status(200).json({
      questions: questionsWithoutAnswers,
      timer: remainingExamTime // time increases when I refresh it
    }); // Return the modified array

  } catch (err) {
    console.log("Error");
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch questions herea' });
  }
});

app.post('navigation-event', (req, res) => {
  const { from, to } = req.body;

  if (from === '/questions' && to === '/') {
    console.log('User navigated from /exam to /');
    // Perform any server-side logic you want here
  }

  res.status(200).send('Navigation event received');
});

// -------------------------------------------------RESET EXAM-------------------------------------------------------------
app.post('/resetExam', (req, res) => {
  startTime = null; // Server-side variable to store exam start time
  isRunning = false;
  isOver = true;
  shouldAllowExamStart = true;
  res.status(200).json({ isReset: true });
});

// -------------------------------------------------GET CLOZE-------------------------------------------------------------
app.get('/api/cloze', (req, res) => {

  const clozeData = {
    text: "function [_____]([_____]) {\n  return [_____] * [_____];\n}",
    blanks: ["multiply", "a, b", "a", "b"],
    correctAnswers: ["multiply", "a, b", "a", "b"],
  };

  return res.status(200).json(clozeData);
});

// -------------------------------------------------GRADE EXAM-------------------------------------------------------------
app.post('/gradeExam', async (req, res) => {

  isOver = true;

  const questions = await Question.find();
  console.log("REQUOo");
  console.log(req.body);

  let userAnswers = req.body.answers; // The user's answers
  // Assignment to constant variable, check the console
  console.log(userAnswers);
  console.log(req.body.code);

  // const add = (a, b) => a + b; add(3, 6); both okay
  // const add = (a,            b) => a +            b;         add(3, 6);
  let gresult = "";

  try {
    // Use eval to execute the code
    const result = eval(`${req.body.code}`);
    gresult = result; // 155740 Nice!!!!! 07/05/25
    // res.json({ success: true, result });
  } catch (error) {
    gresult = error;
    // res.json({ success: false, error: error.message });
  }

  console.log(`Code result is ${gresult}`);


  let test_cases = [
    {
      args: { a: 3, b: 8 },
      expected: 11
    },

    {
      args: { a: 9, b: 20 },
      expected: 29
    },

    {
      args: { a: 1, b: 25 },
      expected: 26
    }
  ];


  let test_results = [];

  test_cases.forEach(testCase => {
    let inputString = req.body.code;
    const { a, b } = testCase.args;
    let replacedString = inputString.replace(/\d+, \d+/, `${a}, ${b}`);
    console.log(replacedString);


    let gresult = "";

    try {
      // Use eval to execute the code
      const result = eval(`${replacedString}`);
      gresult = result; // 155740 Nice!!!!! 07/05/25
      // res.json({ success: true, result });
    } catch (error) {
      gresult = error;
      // res.json({ success: false, error: error.message });
    }


    let reso = "";

    if (gresult === testCase.expected) {
      console.log("TEST PASS");
      reso = "TEST PASS";
    } else {
      console.log("TESTS FAIL");
      reso = "TEST FAIL";
    }

    test_results.push({
      equation: replacedString,
      result: reso
    });
  });

/*
  if (typeof userAnswers === 'object' && !Array.isArray(userAnswers)) {
    // Convert to the requested array format
    userAnswers = Object.entries(userAnswers).map(([key, value]) => ({
      questionIndex: parseInt(key),  // Convert the key to an integer
      selectedAnswer: value           // Use the value directly
    }));
  }*/

   let formattedAnswers = [];

if (Array.isArray(userAnswers)) {
  // Already in the expected array shape (Cloze)
  formattedAnswers = userAnswers;
} else if (userAnswers && typeof userAnswers === 'object') {
  // Keys are question IDs
  formattedAnswers = Object.entries(userAnswers)
    .map(([qKey, value]) => {
      const idx = questions.findIndex(q => String(q._id) === String(qKey));
      return { questionIndex: idx, selectedAnswer: value };
    })
    .filter(item => item.questionIndex !== -1);
} else {
  formattedAnswers = [];
}

userAnswers = formattedAnswers;

let scored = 0;
const totalQuestions = questions.length;

// Grade the exam
userAnswers.forEach(answer => {
  const question = questions[answer.questionIndex];

  if (!question) return;

  if (question.type === "cloze") { // 201002 25/10/25 WORKS!!!

    // Cloze: selectedAnswer and correctAnswers are arrays
    const correctCount = question.correctAnswers.reduce(
      (acc, correct, i) => acc + (answer.selectedAnswer[i] === correct ? 1 : 0),
      0
    );
    scored += correctCount / question.correctAnswers.length; // partial score per question

        console.log(`COUNTING-CLOZE ${correctCount / question.correctAnswers.length}`);
  } else {
    // Multiple-choice
    if (question.answer === answer.selectedAnswer) scored++;
  }
});

console.log("SCORED-IS");
console.log(scored);


  let passed = test_results[0].result === "TEST PASS";

  let userID = "a";
  let nickname = "Filip";
  let percent = ((scored / totalQuestions) * 100).toFixed(2);
  let score = `${scored} / ${totalQuestions} (${(percent)})% \n testresult: ${passed}`;
  let timestamp = Date.now();//.toString();//;.substr(16);
  console.log(timestamp);

  const newGrade = new Gradea({ userID, nickname, score, timestamp });
  await newGrade.save();


  console.log("TROLL");
  console.log(test_results);


  // Return the score and total questions
  return res.status(200).json({
    score,
    totalQuestions,
    feedback: `B Code res ${passed}`,
    message: `B Youhr final grade is ${passed} ${scored} / ${totalQuestions} (${percent}%). Your score was saved to database.`,
    testResults: test_results
  });
});

// -------------------------------------------------LOGIN-------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if u r exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate token
    const token = sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Error during login", error: err });
  }
});
// API Routes
// sh build.sh

// -------------------------------------------------GET USERS-------------------------------------------------------------
app.post('/api/users', async (req, res) => {
  const { name, age, email } = req.body;
  const user = new User({ name, age, email });

  try {
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err });
  }
});

// -------------------------------------------------ADD USER-------------------------------------------------------------
app.post('/addUser', async (req, res) => {
  try {
    const { name, age, email } = req.body;
    const newUser = new User({ name, age, email }); // Create a new user
    await newUser.save(); // Save user to database
    res.status(201).json(newUser); // Send the newly created user as a response
  } catch (err) {
    res.status(500).json({ message: "Error adding user", error: err });
  }
});

// -------------------------------------------------GET ALL USERS-------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});


app.get('/', async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});

import path, { join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Vite frontend
app.use(express.static(join(__dirname, 'vite-project', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'vite-project', 'dist', 'index.html'));
});

// Start the Express server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});


/*
curl -X POST http://localhost:3002/api/users \
-H 'Content-Type: application/json' \
-d '{"name": "Filip Vabrousek", "age": 25, "email": "filip.abrousek1@gmail.com"}'

*/


// TECH 
/* 
React
ReactRouter
Redux
Node
Mongo
Express
JsonWebToken
Canvas
CSS
*/

/*
Mobile app developer (iOS/Android/Flutter/Ionic)
Full-stack developer
Kernel developer
Game developer
AI scientist
Data Engineer
AI/VR developer
*/














// MSL microsoft grrantuje
// https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview

// nedostat se k hashům 115055




















// blacklisted ne :D ni
// lada
// Krypto, reverzni analyza kodu