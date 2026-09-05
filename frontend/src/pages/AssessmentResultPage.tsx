import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import type { AssessmentResult } from '../types'
import '../styles/App.css'

export function AssessmentResultPage() {
  const { code, quizId } = useParams<{ code: string; quizId: string }>()
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code || !quizId) return
    apiFetch<AssessmentResult>(`/courses/${code}/baseline/${quizId}/result`).then(setResult).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load assessment result'))
  }, [code, quizId])

  if (error) return <div className="assessment-page p-8"><div className="assessment-card text-red-700">{error}</div></div>
  if (!result) return <div className="assessment-page p-8 text-gray-500">Loading your assessment analysis...</div>
  return <div className="assessment-page p-8"><p className="eyebrow">Baseline assessment result</p><h1>Personalized performance analysis</h1><section className="assessment-card mt-6 text-center"><div className="result-score">{result.percentage}%</div><p className="text-gray-600">{result.score} correct answers out of {result.total}</p></section><div className="mt-6 grid gap-5 md:grid-cols-3"><ResultGroup title="Strong topics" items={result.strong_topics} /><ResultGroup title="Developing topics" items={result.medium_topics} /><ResultGroup title="Needs practice" items={result.weak_topics} /></div><Link to={`/courses/${code}/journey`} className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">View adaptive learning path</Link></div>
}

function ResultGroup({ title, items }: { title: string; items: AssessmentResult['strong_topics'] }) {
  return <section className="assessment-card result-group"><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item.topic}><span>{item.topic}</span><b>{item.score ?? 0}%</b></li>)}</ul> : <p className="text-gray-500">No topics in this group yet.</p>}</section>
}