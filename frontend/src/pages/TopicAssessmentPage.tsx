import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { BaselineQuizResponse } from '../types'
import '../styles/App.css'

export function TopicAssessmentPage() {
  const { code, topicId } = useParams<{ code: string; topicId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<BaselineQuizResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<{ score: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!code || !topicId) return
    apiFetch<BaselineQuizResponse>(`/courses/${code}/topics/${topicId}/assessment`)
      .then(setQuiz)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load assessment'))
  }, [code, topicId])

  async function submit() {
    if (!quiz || !code || !topicId) return
    const selected = quiz.questions.map((_, index) => answers[index] ?? -1)
    if (selected.includes(-1)) {
      setError('Answer every question before submitting.')
      return
    }
    setSubmitting(true)
    try {
      setResult(await apiFetch<{ score: number; total: number }>(`/courses/${code}/topics/${topicId}/assessment`, { method: 'POST', body: JSON.stringify({ quiz_id: quiz.quiz_id, answers: selected }) }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <div className="assessment-page p-8"><div className="assessment-card text-red-700">{error}</div></div>
  if (result) {
    const percentage = Math.round(result.score / result.total * 100)
    return <div className="assessment-page p-8"><div className="assessment-card text-center"><p className="eyebrow">Topic assessment complete</p><h1>{percentage >= 70 ? 'Topic unlocked' : 'Keep practicing'}</h1><p className="mt-4 text-gray-600">You scored {result.score} / {result.total} ({percentage}%). {percentage >= 70 ? 'The next topic is now available.' : 'Review this topic and try again when you are ready.'}</p><button onClick={() => navigate(`/courses/${code}/journey`)} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">View learning journey</button></div></div>
  }
  if (!quiz) return <div className="assessment-page p-8 text-gray-500">Loading topic assessment...</div>

  return <div className="assessment-page p-8 pb-24"><p className="eyebrow">Topic assessment</p><h1>Check your understanding</h1><p className="mb-6 text-gray-600">Answer these questions to update your adaptive learning path.</p><div className="space-y-5">{quiz.questions.map((question, questionIndex) => <section key={questionIndex} className="assessment-card"><h2>{questionIndex + 1}. {question.text}</h2><div className="mt-4 space-y-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className={`flex cursor-pointer items-center rounded-lg border p-3 ${answers[questionIndex] === optionIndex ? 'border-indigo-400 bg-indigo-50' : ''}`}><input type="radio" name={`question-${questionIndex}`} checked={answers[questionIndex] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} className="mr-3" />{option}</label>)}</div></section>)}</div><button onClick={submit} disabled={submitting} className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit assessment'}</button></div>
}