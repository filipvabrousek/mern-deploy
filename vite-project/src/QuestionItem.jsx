export const QuestionItem = ({ question, questionIndex, selectedAnswer, onChange }) => (
  <li className="list-group-item">
    <strong>{question.question}</strong>
    <ul className="list-unstyled">
      {question.options.map((option, idx) => (
        <li key={idx}>
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              name={`question-${questionIndex}`}
              value={option}
              checked={selectedAnswer === option}
              onChange={() => onChange(questionIndex, option)}
            />
            <label className="form-check-label">{option}</label>
          </div>
        </li>
      ))}
    </ul>
  </li>
);
