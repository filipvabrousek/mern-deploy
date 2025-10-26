import { useEffect, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExamTimeThunk, decrementTimer } from './timerslicer';
import { Provider } from 'react-redux';
// import axios from './axios'
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import './index.css';

function Cloze(){
  const [clozeData, setClozeData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/cloze')
      .then(res => res.json())
      .then(data => {
        setClozeData(data);
        setAnswers(new Array(data.blanks.length).fill(null));
      });
  }, []);

  const onDragStart = (e, item) => {
    e.dataTransfer.setData('text/plain', item);
  };

  const onDrop = (e, index) => {
    const item = e.dataTransfer.getData('text/plain');
    const updatedAnswers = [...answers];
    updatedAnswers[index] = item;
    setAnswers(updatedAnswers);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const gradeActivity = () => {
    const correctAnswers = clozeData.correctAnswers;
    const score = answers.reduce((acc, answer, idx) => {
      return acc + (answer === correctAnswers[idx] ? 1 : 0);
    }, 0);
    setGrade(`You scored ${score} out of ${correctAnswers.length}`);
  };

  if (!clozeData) return <div>Loading...</div>;

  return (
    <div className="app">
      <h1>Fill in the Blanks</h1>
      <p>
        {clozeData.text.split('[_____]').map((chunk, index) => (
          <span key={index}>
            {chunk}
            {index < answers.length && (
              <span
                className="drop-zone"
                onDrop={(e) => onDrop(e, index)}
                onDragOver={onDragOver}
              >
                {answers[index] || '[_____]'}
              </span>
            )}
          </span>
        ))}
      </p>
      <div className="options">
        {clozeData.blanks.map((blank, index) => (
          <div
            key={index}
            className="draggable"
            draggable
            onDragStart={(e) => onDragStart(e, blank)}
          >
            {blank}
          </div>
        ))}
      </div>
      <button onClick={gradeActivity}>Grade</button>
      {grade && <p className="grade">{grade}</p>}
    </div>
  );
}

export default Cloze;