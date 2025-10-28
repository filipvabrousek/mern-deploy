// hooks/useExamAPI.js
export const useExamAPI = () => {
 // const API = ""; // for deploy
 // const isDeployed = false;
 // const API = isDeployed ? "" : "http://localhost:3002"; // for locala
  const API = import.meta.env.VITE_API_URL || "http://localhost:3002"; // 213117 cool 28/10/25
//  echo VITE_API_URL=http://localhost:3002> .env.development in ROOT

  const fetchJSON = async (endpoint, options = {}) => {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fetch error ${res.status}: ${text}`);
    }

    return res.json();
  };

  return {
    // 🌟 Exam lifecycle
    startExam: () => fetchJSON("/startExam", { method: "POST" }),
    resetExama: () => fetchJSON("/resetExam", { method: "POST" }),
    isRunning: () => fetchJSON("/isRunning"),

    // 🌟 Questions
    getQuestions: () => fetchJSON("/questionsAPI"),
    addQuestion: (q) =>
      fetchJSON("/addQuestion", {
        method: "POST",
        body: JSON.stringify({ bulk: true }),
      }),
    deleteAll: () => fetchJSON("/deleteAllQuestions", { method: "DELETE" }),

    // 🌟 Exam grading
    gradeExam: (answers, code) =>
      fetchJSON("/gradeExam", {
        method: "POST",
        body: JSON.stringify({ answers, code }),
      }),

    // 🌟 Results
    fetchResults: () => fetchJSON("/fetchResults"),

    // 🌟 Progress management
    saveProgress: (userId, examId, answers, currentQuestionId) =>
      fetchJSON("/saveProgress", {
        method: "POST",
        body: JSON.stringify({ userId, examId, answers, currentQuestionId }),
      }),

    clearProgress: (userId, examId) =>
      fetchJSON("/clearProgress", {
        method: "POST",
        body: JSON.stringify({ userId, examId }),
      }),

    loadProgress: (userId, examId) =>
      fetchJSON(`/loadProgress?userId=${userId}&examId=${examId}`),
  };
};
