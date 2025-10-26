import {ClozeWrapper} from './Cloze';

export function QuestionList({ questions, currentIndex, selectedAnswers, onChange }) {
  return (
    <>
      {questions.map((q, idx) => {
       // if (idx !== currentIndex) return null;

          // return <h1 key={q._id}>type (cloze not shown) ::{q.type}</h1>


        if (q.type === 'cloze') {
         // return <h1 key={q._id}>Cloze {q.type}</h1>
          // Pass the user's existing answers and a callback to update them
          return (
            <ClozeWrapper
              key={q._id}
              question={q}
              selectedAnswers={selectedAnswers[q._id] || []}
              onChange={(answers) => onChange(q._id, answers)}
            />
          );
        }

        // Standard multiple-choice question
        return (
            <div key={q._id}>
            <p>{q.question}</p>
            {q.options.map((opt) => (
              <div key={opt}>
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  checked={selectedAnswers[q._id] === opt}
                  onChange={() => onChange(q._id, opt)}
                />
                {opt}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
/*
    <div key={q._id}>
            <p>{q.question}</p>
            {q.options.map((opt) => (
              <div key={opt}>
                <input
                  type="radio"
                  name={q._id}
                  value={opt}
                  checked={selectedAnswers[q._id] === opt}
                  onChange={() => onChange(q._id, opt)}
                />
                {opt}
              </div>
            ))}
          </div>
*/