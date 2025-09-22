import React from 'react'
import { Play, CheckCircle, Clock } from 'lucide-react'

interface TutorialStepProps {
  title: string
  content: string
  actionText?: string
  naturalLanguageExamples: string[]
  isLoading: boolean
  isLastStep: boolean
  onNext: () => void
  onComplete: () => void
}

const TutorialStep: React.FC<TutorialStepProps> = ({
  title,
  content,
  actionText,
  naturalLanguageExamples,
  isLoading,
  isLastStep,
  onNext,
  onComplete
}) => {
  const handleAction = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }

  const getStepIcon = () => {
    if (isLastStep) {
      return <CheckCircle className="w-8 h-8 text-green-600" />
    }
    if (isLoading) {
      return <Clock className="w-8 h-8 text-yellow-600 animate-spin" />
    }
    return <Play className="w-8 h-8 text-blue-600" />
  }

  const getStepColor = () => {
    if (isLastStep) {
      return 'border-green-200 bg-green-50'
    }
    if (isLoading) {
      return 'border-yellow-200 bg-yellow-50'
    }
    return 'border-blue-200 bg-blue-50'
  }

  return (
    <div className={`bg-white rounded-lg p-6 border-2 ${getStepColor()} shadow-sm`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getStepIcon()}
        </div>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          
          <div className="prose prose-lg max-w-none mb-6">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {content}
            </div>
          </div>

          {/* 자연어 예시 */}
          {naturalLanguageExamples.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                💡 자연어 명령 예시:
              </h3>
              <div className="grid gap-2">
                {naturalLanguageExamples.map((example, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                  >
                    <code className="text-sm text-blue-700 font-mono">
                      "{example}"
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          {actionText && (
            <div className="flex justify-center">
              <button
                onClick={handleAction}
                disabled={isLoading}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200
                  ${isLastStep 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'}
                  ${!isLoading && !isLastStep ? 'pulse-animation' : ''}
                `}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </div>
                ) : (
                  actionText
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TutorialStep
