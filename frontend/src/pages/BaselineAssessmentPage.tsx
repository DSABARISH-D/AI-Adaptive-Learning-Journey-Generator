import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { BaselineQuizResponse } from '../types'
import { useAuth } from '../hooks/useAuth'
import '../styles/App.css'

export function BaselineAssessmentPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [quiz, setQuiz] = useState<BaselineQuizResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState<{ score: number; total: number; quiz_id: number } | null>(null)

  useEffect(() => {
    async function fetchQuiz() {
      if (!token) return
      try {
        const data = await apiFetch<BaselineQuizResponse>(`/courses/${code}/baseline`)
        setQuiz(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load assessment')
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [code, token])

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (!quiz) return
    const answerArray = quiz.questions.map((_, i) => answers[i] ?? -1)
    if (answerArray.includes(-1)) {
      alert("Please answer all questions before submitting.")
      return
    }

    setSubmitting(true)
    try {
      const result = await apiFetch<{ score: number; total: number }>(`/courses/${code}/baseline`, {
        method: 'POST',
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: answerArray
        })
      })
      setScore({ ...result, quiz_id: quiz.quiz_id })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="assessment-page p-8">Generating your personalized assessment...</div>
  }

  if (error) {
    return (
      <div className="assessment-page p-8">
        <h2 className="text-2xl text-red-400 mb-4">Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/courses/${code}`)} className="mt-4 px-4 py-2 bg-indigo-600 rounded">
          Back to Course
        </button>
      </div>
    )
  }

  if (score) {
    return (
      <div className="assessment-page p-8">
        <h2 className="text-3xl font-bold mb-6">Assessment Complete!</h2>
        <div className="assessment-card text-center">
          <p className="text-xl mb-2">Your Baseline Score:</p>
          <p className="text-5xl font-bold text-indigo-400 mb-6">{score.score} / {score.total}</p>
          <p className="text-gray-300 mb-8">
            We will use these results to adapt the learning journey to your current skill level.
          </p>
          <button 
            onClick={() => navigate(`/courses/${code}/baseline/${score.quiz_id}/result`)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          >
            Generate My Learning Journey
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="assessment-page p-8 pb-24">
      <h2 className="text-3xl font-bold mb-2">Baseline Assessment</h2>
      <p className="text-gray-400 mb-8">Answer these questions to help us personalize your learning path.</p>

      <div className="space-y-8">
        {quiz?.questions.map((q, qIndex) => (
          <div key={qIndex} className="assessment-card">
            <h3 className="text-lg font-medium mb-4">{qIndex + 1}. {q.text}</h3>
            <div className="space-y-3">
              {q.options.map((opt, oIndex) => (
                <label 
                  key={oIndex} 
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors border ${
                    answers[qIndex] === oIndex 
                      ? 'bg-indigo-900/50 border-indigo-500' 
                      : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${qIndex}`}
                    className="mr-4 text-indigo-500 focus:ring-indigo-500 bg-gray-800 border-gray-600"
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleSelect(qIndex, oIndex)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  )
}

