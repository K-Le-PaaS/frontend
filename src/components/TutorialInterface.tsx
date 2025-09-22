import React, { useState, useEffect } from 'react'
import TutorialStep from './TutorialStep'
import TutorialProgress from './TutorialProgress'
import NaturalLanguageInput from './NaturalLanguageInput'
import { TutorialAPI } from '../services/api'

interface TutorialState {
  session_id: string
  step: string
  step_index: number
  total_steps: number
  title: string
  content: string
  action_text?: string
  natural_language_examples: string[]
  state: string
  completed_steps: string[]
  user_inputs?: Array<{
    input: string
    timestamp: string | null
    step: string
  }>
  errors?: Array<{
    error: string
    timestamp: string | null
    step: string
  }>
}

const TutorialInterface: React.FC = () => {
  const [tutorialState, setTutorialState] = useState<TutorialState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')

  const api = new TutorialAPI()

  // 컴포넌트 마운트 시 튜토리얼 시작
  useEffect(() => {
    startTutorial()
  }, [])

  const startTutorial = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const sessionId = `tutorial_${Date.now()}`
      const response = await api.startTutorial(sessionId)
      
      if (response.data) {
        setTutorialState(response.data)
      }
    } catch (err) {
      setError('튜토리얼을 시작할 수 없습니다. 다시 시도해주세요.')
      console.error('Failed to start tutorial:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextStep = async () => {
    if (!tutorialState) return

    try {
      setIsLoading(true)
      const response = await api.nextStep(tutorialState.session_id)
      
      if (response.data) {
        setTutorialState(response.data)
      }
    } catch (err) {
      setError('다음 단계로 진행할 수 없습니다.')
      console.error('Failed to go to next step:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!tutorialState) return

    try {
      setIsLoading(true)
      const response = await api.completeTutorial(tutorialState.session_id)
      
      if (response.data) {
        setTutorialState(response.data)
      }
    } catch (err) {
      setError('튜토리얼을 완료할 수 없습니다.')
      console.error('Failed to complete tutorial:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserInput = async (input: string) => {
    if (!tutorialState || !input.trim()) return

    try {
      setIsLoading(true)
      setUserInput('')
      
      const response = await api.addUserInput(tutorialState.session_id, input)
      
      if (response.data) {
        setTutorialState(response.data)
      }
    } catch (err) {
      setError('입력을 처리할 수 없습니다.')
      console.error('Failed to process user input:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setUserInput('')
      
      if (tutorialState) {
        await api.resetTutorial(tutorialState.session_id)
      }
      
      await startTutorial()
    } catch (err) {
      setError('튜토리얼을 리셋할 수 없습니다.')
      console.error('Failed to reset tutorial:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !tutorialState) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">튜토리얼을 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border border-red-200 bg-red-50 rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">오류가 발생했습니다</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              다시 시작하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!tutorialState) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            튜토리얼을 시작할 수 없습니다
          </h2>
          <button
            onClick={handleReset}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  const isLastStep = tutorialState.step === 'complete'
  const isWaitingForInput = tutorialState.state === 'waiting_user'

  return (
    <div className="max-w-4xl mx-auto">
      {/* 진행률 표시 */}
      <TutorialProgress
        currentStep={tutorialState.step_index}
        totalSteps={tutorialState.total_steps}
        completedSteps={tutorialState.completed_steps}
      />

      {/* 튜토리얼 단계 */}
      <div className="mb-8">
        <TutorialStep
          title={tutorialState.title}
          content={tutorialState.content}
          actionText={tutorialState.action_text || ''}
          naturalLanguageExamples={tutorialState.natural_language_examples}
          isLoading={isLoading}
          isLastStep={isLastStep}
          onNext={handleNextStep}
          onComplete={handleComplete}
        />
      </div>

      {/* 자연어 입력 */}
      {isWaitingForInput && !isLastStep && (
        <div className="mb-8">
          <NaturalLanguageInput
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleUserInput}
            examples={tutorialState.natural_language_examples}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* 사용자 입력 히스토리 */}
      {tutorialState.user_inputs && tutorialState.user_inputs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">입력 히스토리</h3>
          <div className="space-y-2">
            {tutorialState.user_inputs.map((input, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">단계: {input.step}</p>
                <p className="text-gray-800">{input.input}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 히스토리 */}
      {tutorialState.errors && tutorialState.errors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-red-800 mb-4">에러 로그</h3>
          <div className="space-y-2">
            {tutorialState.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 mb-1">단계: {error.step}</p>
                <p className="text-red-800">{error.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleReset}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-4"
        >
          처음부터 다시 시작
        </button>
        
        {!isLastStep && (
          <button
            onClick={() => window.alert('도움말: 자연어 명령을 입력하여 튜토리얼을 진행하세요!')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            도움말 보기
          </button>
        )}
      </div>
    </div>
  )
}

export default TutorialInterface
