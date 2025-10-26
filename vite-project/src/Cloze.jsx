import { useEffect, useState } from "react";

function ClozeWrapper({ question, selectedAnswers, onChange }) {
  const blankCount = question.correctAnswers?.length || 0;
  const [answers, setAnswers] = useState(
    selectedAnswers.length ? selectedAnswers : new Array(blankCount).fill(null)
  );
  const [feedback, setFeedback] = useState(new Array(blankCount).fill(null));
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    setAnswers(
      selectedAnswers.length ? selectedAnswers : new Array(blankCount).fill(null)
    );
  }, [selectedAnswers, blankCount]);

  const handleDrop = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
    onChange(updated);
  };

  const gradeActivity = () => {
    const correctAnswers = question.correctAnswers || [];
    const newFeedback = answers.map((a, i) =>
      a === correctAnswers[i] ? "correct" : a ? "incorrect" : null
    );
    setFeedback(newFeedback);
    setGrade(
      `Score: ${newFeedback.filter((f) => f === "correct").length}/${correctAnswers.length}`
    );
  };

  const resetActivity = () => {
    const empty = new Array(blankCount).fill(null);
    setAnswers(empty);
    setFeedback(empty);
    setGrade(null);
    onChange(empty);
  };

  return (
    <div className="cloze-question">
      <p>
        {question.text.split("[_____]").map((chunk, idx, arr) => (
          <span key={idx}>
            {chunk}
            {idx < blankCount && (
              <span
                className={`drop-zone ${feedback[idx]}`}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(idx, e.dataTransfer.getData("text/plain"));
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {answers[idx] || "[_____]"}
              </span>
            )}
          </span>
        ))}
      </p>

      <div className="options">
        {question.blanks?.map((blank, idx) => (
          <div
            key={idx}
            className="draggable"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", blank)}
          >
            {blank}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ClozeWrapper };
