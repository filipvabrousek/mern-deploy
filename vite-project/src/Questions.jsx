import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import timerReducer, { fetchExamTimeThunk } from "./timerSlicer";
import { useExamAPI } from "./examAPI2025";
import { useExamTimer } from "./usetimer";
import { QuestionList } from "./QuestionList";
import { formatTime, formatTimestamp, randomTimeString } from "./timeFormatter";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./index.css";

// Redux store
const store = configureStore({
  reducer: { timer: timerReducer },
});

function Questions() {
  // State
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [examRunning, setExamRunning] = useState(false); // server state
  const [openExam, setOpenExam] = useState(false); // UI
  const [hideStartExamBtn, setHideStartExamBtn] = useState(true);
  const [fetchedResult, setFetchedResult] = useState([]);
  const [result, setResult] = useState("");
  const [testResults, setTestResults] = useState([]);

  const selectedAnswersRef = useRef(selectedAnswers);
  const dispatch = useDispatch();

  const {
    // order does not matter
    startExam, // start
    getQuestions,
    resetExama,
    deleteAll,
    isRunning,
    addQuestion,
    fetchResults,
    saveProgress,
    clearProgress,
    loadProgress,
    gradeExam,
  } = useExamAPI();

  // Keep ref updated for async callbacks
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // 1️⃣ Check server exam state on mount
  useEffect(() => {
    const initializeExam = async () => {
      try {
        // 2️⃣ Fetch questions from API
        const questionsJson = await getQuestions();

        // Convert ObjectId to string (if not already done server-side)
        const questionsWithIds = questionsJson.questions.map((q) => ({
          ...q,
          _id: q._id.toString(),
        }));

        setQuestions(questionsWithIds);

        // 1️⃣ Check if exam is running
        const dataStatus = await isRunning();

        if (dataStatus.isRunning) {
          setOpenExam(true); // toggle exam UI
          dispatch(fetchExamTimeThunk());
        } else {
          setOpenExam(false);
        }

        // 3️⃣ Load saved progress

        const dataProgress = await loadProgress("AHA", "AHAE");

        if (dataProgress.progress?.answers) {
          setSelectedAnswers(dataProgress.progress.answers);
          setProgress(dataProgress.progress);
        }

       /* if (questions.length === 0){
            setOpenExam(false);
        }*/

        // 4️⃣ Set current question index based on progress
        if (
          questionsWithIds.length > 0 &&
          dataProgress.progress?.currentQuestionId
        ) {
          const ids = questionsWithIds.map((q) => q._id);
          const idx = ids.indexOf(
            String(dataProgress.progress.currentQuestionId)
          );
          if (idx >= 0) setCurrentQuestionIndex(idx);
        }

        // 5️⃣ Fetch past results

        const resultsData = await fetchResults();
        setFetchedResult(resultsData.results || []);
      } catch (err) {
        console.error("❌ Failed to initialize exam:", err);
      }
    };

    initializeExam();
  }, [dispatch]);

  // 3️⃣ Start exam
  const beginExam = async () => {
    try {
        if (questions.length === 0){
   console.warn("Cannot start exam: no questions available");
   alert("No questions available");
      return;
    }

      await startExam();
      setExamRunning(true);
      setOpenExam(true);
     // const response = await getQuestions();

       // Check if questions exist
   //if (!response.questions || response.questions.length === 0) {
  

      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      dispatch(fetchExamTimeThunk());
    } catch (err) {
      console.error("Failed to start exam:", err);
    }
  };

  // 8️⃣ Submit exam
  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      const data = await gradeExam(selectedAnswersRef.current, "");

      setResult(data.message);
      setTestResults(data.testResults);
      setOpenExam(false);
      setHideStartExamBtn(false);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setExamRunning(false);

      await clearProgress("AHA", "AHAE");
      const resultsData = await fetchResults();
      setFetchedResult(resultsData.results);
      resetExama();
    } catch (err) {
      console.error("Failed to submit exam:", err);
    }
  }, []);

  const { timeLefta } = useExamTimer(openExam, handleSubmit);

  // 4️⃣ Reset exam
  const resetExam = async () => {
    await resetExama();
    setOpenExam(false);
    setSelectedAnswers({});
    setHideStartExamBtn(false);
    setCurrentQuestionIndex(0);
    setExamRunning(false);
  };

  // 5️⃣ Add question
  const addQuestions = async () => {
    try {
      const newQuestion = {
        question: `When is homeOS released? ${Date.now()}`,
        options: ["March", "WWDC25", "fall"],
        answer: "WWDC25",
      };
      await addQuestion(newQuestion);

        const questionsJson = await getQuestions();

        // Convert ObjectId to string (if not already done server-side)
        const questionsWithIds = questionsJson.questions.map((q) => ({
          ...q,
          _id: q._id.toString(),
        }));

        setQuestions(questionsWithIds);


    } catch (err) {
      console.error("Failed to add question:", err);
    }
  };

  // 6️⃣ Delete all questions
  const handleDeleteAllQ = async () => {
    try {
      await deleteAll();
      setQuestions([]); // 225204 25/10/25
    } catch (err) {}
  };

  // 7️⃣ Handle answer change
  const handleOptionChange = async (questionId, answer) => {
    const updated = { ...selectedAnswersRef.current, [questionId]: answer };
    setSelectedAnswers(updated);
    selectedAnswersRef.current = updated;

    try {
      await saveProgress("AHA", "AHAE", updated, questionId);
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  return (
    <Provider store={store}>
      <h3 style={{color: "orange"}}>QExam</h3>
      <a href="/">Back</a>
      <h3>{localStorage.getItem("user") || "A"}</h3>

      {!openExam && (
        <div>
          <button onClick={addQuestions} className="btn btn-secondary m-3">
            + 1 question
          </button>
          <button onClick={handleDeleteAllQ} className="btn btn-secondary m-3">
            Delete questions
          </button>
          <button onClick={resetExam} className="btn btn-secondary m-3">
            Reset exam
          </button>
        </div>
      )}

      {!hideStartExamBtn && !openExam && (
        <button onClick={beginExam} className="btn btn-primary m-3">
          Start exam
        </button>
      )}

      <div
        className="exam-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {!openExam && fetchedResult.length > 0 && (
          <div className="w-100 mb-4">
            <h4>Past Results</h4>
            {fetchedResult.map((r) => (
              <div
                key={randomTimeString()}
                className="container border-green"
                style={{
                  border: "3px solid green",
                  marginBottom: "1rem",
                  borderRadius: "1rem",
                }}
              >
                <p>{randomTimeString()}</p>
                <p>{formatTimestamp(r.timestamp)}</p>
                <h3>{r.nickname}</h3>
                <p>{r.score}</p>
              </div>
            ))}
          </div>
        )}
        {/* 212545 cool 25/10/25 */}

        {openExam && questions && questions.length > 0 && (
          <form onSubmit={handleSubmit} style={{ width: "600px" }}>
            <h3>{formatTime(timeLefta)}</h3>

            <div className="mb-3 d-flex flex-wrap" style={{ width: "300px" }}>
              {questions.map((q, idx) => {
                const answered = !!selectedAnswers[q._id]; // false
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`btn btn-sm m-1 ${
                      answered ? "btn-success" : "btn-outline-secondary"
                    } ${currentQuestionIndex === idx ? "border-primary" : ""}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <QuestionList
              questions={[questions[currentQuestionIndex]]}
              currentIndex={currentQuestionIndex}
              selectedAnswers={selectedAnswers}
              onChange={handleOptionChange}
            />
            <div className="d-flex justify-content-between mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentQuestionIndex === 0}
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                }
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleSubmit} // End exam
                >
                  End Exam
                </button>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3">
              Submit
            </button>
          </form>
        )}

        {result && <h3 className="mt-4">{result}</h3>}
        {testResults &&
          testResults.map((r, idx) => (
            <div key={idx}>
              <h4>{r.equation || r.question}</h4>
              <h4>{r.result}</h4>
            </div>
          ))}
      </div>
    </Provider>
  );
}

export default Questions;