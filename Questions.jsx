import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import timerReducer, { fetchExamTimeThunk } from "./timerSlicer";
import { useExamAPI } from "./examAPI2025";
import { useExamTimer } from "./usetimer";
import { QuestionList } from "./QuestionList";
import { formatTime, formatTimestamp, randomTimeString } from "./timeFormatter";

//import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./index.css";

// 212239 postcss was needed

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
      {/* Header */}
      <h3 className="text-orange-500 text-2xl font-semibold mb-2">QExam</h3>
      <a href="/" className="text-blue-500 hover:underline mb-2 block">Back</a>
      <h3 className="text-lg mb-4">{localStorage.getItem("user") || "A"}</h3>

      {/* Controls before exam */}
      {!openExam && (
        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <button
            onClick={addQuestions}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            + 1 question
          </button>
          <button
            onClick={handleDeleteAllQ}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            Delete questions
          </button>
          <button
            onClick={resetExam}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            Reset exam
          </button>
        </div>
      )}

      {/* Start Exam Button */}
      {!hideStartExamBtn && !openExam && (
        <button
          onClick={beginExam}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-4"
        >
          Start exam
        </button>
      )}

      <div className="flex flex-col items-center w-full max-w-[600px] mx-auto">
        {/* Past Results */}
        {!openExam && fetchedResult.length > 0 && (
          <div className="w-full mb-6">
            <h4 className="text-lg font-semibold mb-2">Past Results</h4>
            {fetchedResult.map((r) => (
              <div
                key={randomTimeString()}
                className="border-4 border-green-500 rounded-xl mb-4 p-4"
              >
                <p>{randomTimeString()}</p>
                <p>{formatTimestamp(r.timestamp)}</p>
                <h3 className="font-bold">{r.nickname}</h3>
                <p>{r.score}</p>
              </div>
            ))}
          </div>
        )}

        {/* Exam Form */}
        {openExam && questions && questions.length > 0 && (
          <form className="w-full" onSubmit={handleSubmit}>
            {/* Timer */}
            <h3 className="text-lg font-medium mb-2">{formatTime(timeLefta)}</h3>

            {/* Question Index */}
            <h2 className="text-xl font-semibold mb-4">
              {currentQuestionIndex + 1}/{questions.length}
            </h2>

            {/* Question Number Buttons */}
            <div className="mb-4 flex flex-wrap gap-2 w-full max-w-[300px]">
              {questions.map((q, idx) => {
                const answered = !!selectedAnswers[q._id];
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`
                      w-10 h-10 flex items-center justify-center rounded-md
                      text-sm font-medium transition-colors
                      ${answered ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"}
                      ${isCurrent ? "ring-2 ring-blue-500" : ""}
                      hover:bg-green-400
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Question List */}
            <QuestionList
              questions={[questions[currentQuestionIndex]]}
              currentIndex={currentQuestionIndex}
              selectedAnswers={selectedAnswers}
              onChange={handleOptionChange}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-4 w-full gap-3">
              {/* Previous */}
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                }
                className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
              >
                Previous
              </button>

              {/* Next or End */}
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  }
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  End Exam
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </form>
        )}

        {/* Exam Results */}
        {result && <h3 className="mt-4 text-lg font-semibold">{result}</h3>}

        {testResults &&
          testResults.map((r, idx) => (
            <div key={idx} className="mt-2">
              <h4 className="font-medium">{r.equation || r.question}</h4>
              <h4 className="font-medium">{r.result}</h4>
            </div>
          ))}
      </div>
    </Provider>
  );
}

export default Questions;