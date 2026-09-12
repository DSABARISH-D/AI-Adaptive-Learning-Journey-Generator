import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import '../styles/App.css'

interface TestCase {
  id: number
  name: string
  input: string
  expectedOutput: string
  isHidden: boolean
}

interface Question {
  id: number
  title: string
  level: number
  course: string
  topic: string
  description: string
  inputFormat: string
  outputFormat: string
  sampleInput: string
  sampleOutput: string
  explanation: string
  sampleTestCase: TestCase
  hiddenTestCases: TestCase[]
  starterCode: string
}

interface TestCaseResult {
  id: number
  name: string
  passed: boolean
  input?: string
  expected?: string
  actual?: string
  isHidden?: boolean
  note?: string
}

interface EvalResponse {
  allPassed: boolean
  score: number
  testCaseResults: TestCaseResult[]
  feedback: string
  compilationError?: string | null
  updatedProgress?: number
  currentTopic?: string
}

export function PracticeCodingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [courseCode, setCourseCode] = useState<string>('c')
  const [courseTitle, setCourseTitle] = useState<string>('C Programming')
  const [currentLevel, setCurrentLevel] = useState<number>(3)
  const [activeTopic, setActiveTopic] = useState<string>('Arrays & Circular Structures')

  const [questions, setQuestions] = useState<Question[]>([])
  const [activeQIndex, setActiveQIndex] = useState<number>(0)
  const [questionStatus, setQuestionStatus] = useState<Record<number, 'selected' | 'answered' | 'unanswered'>>({})

  // Code editor state per question
  const [userCodes, setUserCodes] = useState<Record<number, string>>({})

  // Custom test case drawer
  const [customInputOpen, setCustomInputOpen] = useState<boolean>(true)
  const [customInput, setCustomInput] = useState<string>('5\n4 1 3 5 2')
  const [customOutput, setCustomOutput] = useState<string>('')
  const [runningCustom, setRunningCustom] = useState<boolean>(false)

  // Evaluation & submission state
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [generatingNext, setGeneratingNext] = useState<boolean>(false)
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null)
  const [successCelebration, setSuccessCelebration] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(true)

  // Load questions on mount or course / level switch
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true)
      try {
        let code = searchParams.get('course') || 'c'
        const levelParam = parseInt(searchParams.get('level') || '3', 10)
        setCurrentLevel(levelParam || 3)

        try {
          const profile = await apiFetch<{ currentCourse?: string }>('/profile')
          if (!searchParams.get('course') && profile.currentCourse) {
            code = profile.currentCourse
          }
        } catch {
          // ignore profile fetch error
        }

        setCourseCode(code)

        const data = await apiFetch<{
          questions?: Question[]
          courseTitle?: string
          topic?: string
        }>(
          `/courses/${code}/practice?level=${levelParam || 3}&topic=${encodeURIComponent(searchParams.get('topic') || '')}`
        )

        if (data && data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
          setCourseTitle(data.courseTitle || `${code.toUpperCase()} Programming`)
          setActiveTopic(data.topic || 'Coding Challenges')

          // Initialize starter codes
          const codesMap: Record<number, string> = {}
          const statusMap: Record<number, 'selected' | 'answered' | 'unanswered'> = {}
          data.questions.forEach((q: Question, idx: number) => {
            codesMap[q.id] = q.starterCode || ''
            statusMap[q.id] = idx === 0 ? 'selected' : 'unanswered'
          })
          setUserCodes(codesMap)
          setQuestionStatus(statusMap)
          setActiveQIndex(0)
          setCustomInput(data.questions[0].sampleInput || '')
        }
      } catch (err) {
        console.error('Failed to load practice questions:', err)
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [searchParams, currentLevel])

  const currentQuestion: Question | undefined = questions[activeQIndex]
  const currentCode: string = currentQuestion ? userCodes[currentQuestion.id] ?? currentQuestion.starterCode : ''

  // Switch active question
  const selectQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return
    setActiveQIndex(idx)
    const q = questions[idx]
    setQuestionStatus((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        const id = Number(k)
        if (next[id] === 'selected') {
          next[id] = 'unanswered'
        }
      })
      if (next[q.id] !== 'answered') {
        next[q.id] = 'selected'
      }
      return next
    })
    setEvalResult(null)
    setSuccessCelebration(false)
    if (q.sampleInput) {
      setCustomInput(q.sampleInput)
    }
    setCustomOutput('')
  }

  // Handle level change
  const handleLevelChange = (lvl: number) => {
    setCurrentLevel(lvl)
    setActiveQIndex(0)
    setEvalResult(null)
    setSuccessCelebration(false)
  }

  // Code editor text change
  const handleCodeChange = (newCode: string) => {
    if (!currentQuestion) return
    setUserCodes((prev) => ({ ...prev, [currentQuestion.id]: newCode }))
  }

  // Handle Tab key in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const val = target.value
      const updated = val.substring(0, start) + '    ' + val.substring(end)
      handleCodeChange(updated)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4
      }, 0)
    }
  }

  // Run custom testcase
  const handleRunCustom = async () => {
    if (!currentQuestion) return
    setRunningCustom(true)
    setCustomOutput('Running...')
    try {
      const res = await apiFetch<{ output?: string }>('/practice/run', {
        method: 'POST',
        body: JSON.stringify({
          code: currentCode,
          language: courseCode,
          input: customInput,
        }),
      })
      setCustomOutput(res.output || '(no output produced)')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setCustomOutput(`Error running code: ${msg}`)
    } finally {
      setRunningCustom(false)
    }
  }

  // Submit code to Gemini AI
  const handleSubmit = async () => {
    if (!currentQuestion) return
    setSubmitting(true)
    setEvalResult(null)
    setSuccessCelebration(false)

    try {
      const res = await apiFetch<EvalResponse>('/practice/submit', {
        method: 'POST',
        body: JSON.stringify({
          course: courseCode,
          level: currentLevel,
          language: courseCode,
          code: currentCode,
          question: currentQuestion,
        }),
      })

      setEvalResult(res)

      // If all test cases passed:
      if (res.allPassed) {
        setSuccessCelebration(true)
        setQuestionStatus((prev) => ({
          ...prev,
          [currentQuestion.id]: 'answered',
        }))

        // Call Gemini AI to generate the NEXT QUESTION!
        setGeneratingNext(true)
        try {
          const nextRes = await apiFetch<{ ok: boolean; question: Question }>('/practice/next-question', {
            method: 'POST',
            body: JSON.stringify({
              course: courseCode,
              level: currentLevel,
              topic: activeTopic,
              completedQuestions: questions,
            }),
          })

          if (nextRes.ok && nextRes.question) {
            const nextQ: Question = nextRes.question
            setQuestions((prev) => {
              // avoid duplicate IDs
              if (prev.some((q) => q.id === nextQ.id)) return prev
              return [...prev, nextQ]
            })

            setUserCodes((prev) => ({
              ...prev,
              [nextQ.id]: nextQ.starterCode || '',
            }))

            setQuestionStatus((prev) => ({
              ...prev,
              [nextQ.id]: 'unanswered',
            }))
          }
        } catch (genErr) {
          console.error('Failed to generate next question:', genErr)
        } finally {
          setGeneratingNext(false)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert('Failed to evaluate code with Gemini AI: ' + msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate line numbers for the editor
  const lineCount = Math.max(19, currentCode.split('\n').length)
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  if (loading) {
    return (
      <div className="practice-loading-wrap">
        <div className="dash-loader">
          <div className="dash-spinner" />
          <p>Loading {courseTitle} Level {currentLevel} Coding Arena...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="coding-arena-page">
      {/* Top Header Bar */}
      <header className="arena-header">
        <div className="arena-header-left">
          <div className="arena-title-wrap">
            <h1 className="arena-title">
              {courseTitle} Level {currentLevel} - Learning
            </h1>
            <span className="arena-topic-tag">{activeTopic}</span>
          </div>

          {/* Level Switcher */}
          <div className="arena-level-pills">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`level-pill-btn ${currentLevel === lvl ? 'active' : ''}`}
                onClick={() => handleLevelChange(lvl)}
              >
                Level {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="arena-header-right">
          <button
            type="button"
            className="complete-practice-btn"
            onClick={() => navigate(`/courses/${courseCode}/journey`)}
          >
            Complete Practice
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="arena-main-layout">
        {/* Left Sidebar: Questions & Legend */}
        <aside className="arena-sidebar">
          <div className="sidebar-section-title">Questions</div>
          <div className="question-pills-grid">
            {questions.map((q, idx) => {
              const isSelected = activeQIndex === idx
              const isAnswered = questionStatus[q.id] === 'answered'
              let pillClass = 'q-pill-unanswered'
              if (isSelected) pillClass = 'q-pill-selected'
              else if (isAnswered) pillClass = 'q-pill-answered'

              return (
                <button
                  key={q.id}
                  type="button"
                  className={`arena-q-pill ${pillClass}`}
                  onClick={() => selectQuestion(idx)}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* Sidebar Legend */}
          <div className="arena-legend">
            <div className="legend-item">
              <span className="legend-box box-selected" />
              <span>- Selected</span>
            </div>
            <div className="legend-item">
              <span className="legend-box box-answered" />
              <span>- Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-box box-unanswered" />
              <span>- Not Answered</span>
            </div>
          </div>
        </aside>

        {/* Middle Column: Question Details & Test Cases */}
        <main className="arena-question-pane">
          {currentQuestion ? (
            <>
              {/* Question Pagination Header */}
              <div className="q-nav-bar">
                <span className="q-nav-label">Question</span>
                <div className="q-nav-pagination">
                  <button
                    type="button"
                    className="q-nav-arrow"
                    onClick={() => selectQuestion(activeQIndex - 1)}
                    disabled={activeQIndex === 0}
                  >
                    &lt;
                  </button>
                  <span className="q-nav-current">
                    {activeQIndex + 1} / {questions.length}
                  </span>
                  <button
                    type="button"
                    className="q-nav-arrow"
                    onClick={() => selectQuestion(activeQIndex + 1)}
                    disabled={activeQIndex >= questions.length - 1}
                  >
                    &gt;
                  </button>
                </div>
              </div>

              {/* Problem Title & Body */}
              <div className="q-body-content">
                <h2 className="q-problem-heading">{activeQIndex + 1}. {currentQuestion.title}</h2>
                <div className="q-description-text">
                  {currentQuestion.description.split('\n\n').map((para, pIdx) => (
                    <p key={pIdx} dangerouslySetInnerHTML={{
                      __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  ))}
                </div>

                {/* Input Format */}
                <div className="q-spec-block">
                  <h3 className="spec-heading">Input Format:</h3>
                  <p className="spec-text" dangerouslySetInnerHTML={{
                    __html: currentQuestion.inputFormat.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>

                {/* Output Format */}
                <div className="q-spec-block">
                  <h3 className="spec-heading">Output Format:</h3>
                  <p className="spec-text" dangerouslySetInnerHTML={{
                    __html: currentQuestion.outputFormat.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>

                {/* Sample Input / Output */}
                <div className="q-sample-grid">
                  <div className="q-sample-box">
                    <h4 className="sample-label">Sample Input:</h4>
                    <pre className="sample-pre">{currentQuestion.sampleInput}</pre>
                  </div>
                  <div className="q-sample-box">
                    <h4 className="sample-label">Sample Output:</h4>
                    <pre className="sample-pre">{currentQuestion.sampleOutput}</pre>
                  </div>
                </div>

                {/* Explanation */}
                {currentQuestion.explanation && (
                  <div className="q-spec-block">
                    <h3 className="spec-heading">Explanation:</h3>
                    <div className="explanation-text">
                      {currentQuestion.explanation.split('\n').map((line, lIdx) => (
                        <div key={lIdx} className="explanation-line">
                          {line.replace(/\[PASS\]|\[check\]/gi, '✅').replace(/\[FAIL\]|\[x\]/gi, '❌')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Testcase Table */}
                <div className="testcase-table-card">
                  <div className="tc-card-header">
                    <span>Sample Testcase #1</span>
                    {evalResult && evalResult.testCaseResults?.[0] && (
                      <span className={`tc-status-pill ${evalResult.testCaseResults[0].passed ? 'passed' : 'failed'}`}>
                        {evalResult.testCaseResults[0].passed ? 'Passed ✅' : 'Failed ❌'}
                      </span>
                    )}
                  </div>
                  <div className="tc-table-grid">
                    <div className="tc-col">
                      <span className="tc-subhead">Input</span>
                      <pre className="tc-pre">{currentQuestion.sampleTestCase?.input || currentQuestion.sampleInput}</pre>
                    </div>
                    <div className="tc-col">
                      <span className="tc-subhead">Output</span>
                      <pre className="tc-pre">{currentQuestion.sampleTestCase?.expectedOutput || currentQuestion.sampleOutput}</pre>
                    </div>
                  </div>
                </div>

                {/* Hidden Testcases */}
                <div className="hidden-testcases-card">
                  <div className="tc-card-header">
                    <span>Hidden Testcase</span>
                  </div>
                  <div className="hidden-tc-list">
                    {currentQuestion.hiddenTestCases?.map((tc, hIdx) => {
                      const tcResult = evalResult?.testCaseResults?.find((r) => r.id === tc.id)
                      return (
                        <div key={tc.id} className="hidden-tc-item">
                          <span className="hidden-tc-name">{tc.name || `Testcase #${hIdx + 2}`}</span>
                          {tcResult ? (
                            <span className={`tc-status-pill ${tcResult.passed ? 'passed' : 'failed'}`}>
                              {tcResult.passed ? 'Passed ✅' : 'Failed ❌'}
                            </span>
                          ) : (
                            <span className="tc-status-pill hidden">Hidden</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>No questions available for this level.</p>
          )}
        </main>

        {/* Right Column: Dark Code Editor & Custom Test Runner */}
        <section className="arena-editor-pane">
          {/* Editor Container */}
          <div className="monaco-like-editor-wrap">
            <div className="editor-gutter">
              {lineNumbers.map((num) => (
                <div key={num} className="gutter-line-num">
                  {num}
                </div>
              ))}
            </div>
            <textarea
              className="editor-code-input"
              value={currentCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder="// Write your code here..."
            />
          </div>

          {/* Collapsible Custom Test Case Box */}
          <div className="custom-testcase-drawer">
            <button
              type="button"
              className="custom-drawer-header"
              onClick={() => setCustomInputOpen(!customInputOpen)}
            >
              <span>{customInputOpen ? '⌃ Custom Test Case' : '⌄ Custom Test Case'}</span>
            </button>

            {customInputOpen && (
              <div className="custom-drawer-body">
                <textarea
                  className="custom-input-area"
                  rows={4}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter custom standard input..."
                />
                <div className="custom-output-box">
                  <div className="output-label">Execution Output:</div>
                  <pre className="output-text">
                    {runningCustom ? 'Running code...' : customOutput || 'Output will appear here after clicking Run.'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Banner / Gemini Feedback */}
          {evalResult && (
            <div className={`eval-banner ${evalResult.allPassed ? 'banner-passed' : 'banner-failed'}`}>
              <div className="eval-banner-top">
                <span className="banner-icon">{evalResult.allPassed ? '🎉' : '⚠️'}</span>
                <div>
                  <h4 className="banner-title">
                    {evalResult.allPassed
                      ? (successCelebration ? '🎉 Congratulations! All Test Cases Passed!' : 'All Test Cases Passed!')
                      : `Passed ${evalResult.testCaseResults.filter((r) => r.passed).length} of ${evalResult.testCaseResults.length} Test Cases (${evalResult.score}%)`}
                  </h4>
                  <p className="banner-feedback">{evalResult.feedback}</p>
                </div>
              </div>

              {/* Next Question Notification if all passed */}
              {evalResult.allPassed && (
                <div className="next-q-unlocked-row">
                  {generatingNext ? (
                    <div className="generating-next-pill">
                      <span className="mini-spin" /> Gemini AI is generating your next adaptive challenge...
                    </div>
                  ) : (
                    <div className="next-ready-pill">
                      <span>✨ Next question generated by AI! Check Question {questions.length} in the sidebar.</span>
                      <button
                        type="button"
                        className="go-next-q-btn"
                        onClick={() => selectQuestion(questions.length - 1)}
                      >
                        Solve Next Question →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Run & Submit */}
          <div className="arena-actions-bar">
            <button
              type="button"
              className="arena-run-btn"
              onClick={handleRunCustom}
              disabled={runningCustom || submitting}
            >
              <span className="btn-icon">▶</span>
              {runningCustom ? 'Running...' : 'Run'}
            </button>

            <button
              type="button"
              className="arena-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <span className="btn-icon">💾</span>
              {submitting ? 'Evaluating with Gemini AI...' : 'Submit'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
