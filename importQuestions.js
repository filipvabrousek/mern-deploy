const mongoose = require('mongoose');
const fs = require('fs');

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String, // Correct answer
});

const Question = mongoose.model('Question', questionSchema);

// mongoTest node importquestions.js

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/exam-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Load questions from JSON file
const questions = JSON.parse(fs.readFileSync('questions.json', 'utf-8'));

// Function to save the questions to MongoDB
const importQuestions = async () => {
  try {
    await Question.insertMany(questions);
    console.log('Questions imported successfully!');
    process.exit();
  } catch (error) {
    console.error('Error importing questions:', error);
    process.exit(1);
  }
};

importQuestions();
