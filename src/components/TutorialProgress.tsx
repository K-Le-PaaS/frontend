import React from 'react'
import { CheckCircle, Circle } from 'lucide-react'

interface TutorialProgressProps {
  currentStep: number
  totalSteps: number
  completedSteps?: string[]
}

const TutorialProgress: React.FC<TutorialProgressProps> = ({
  currentStep,
  totalSteps,
  completedSteps
}) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      return 'completed'
    } else if (stepIndex === currentStep) {
      return 'current'
    } else {
      return 'upcoming'
    }
  }

  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex)
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'current':
        return <Circle className="w-5 h-5 text-blue-600 fill-current" />
      default:
        return <Circle className="w-5 h-5 text-gray-300" />
    }
  }

  const getStepColor = (stepIndex: number) => {
    const status = getStepStatus(stepIndex)
    
    switch (status) {
      case 'completed':
        return 'bg-green-600'
      case 'current':
        return 'bg-blue-600'
      default:
        return 'bg-gray-300'
    }
  }

  const stepNames = [
    '환영',
    '배포',
    '상태 확인',
    '롤백',
    '완료'
  ]

  return (
    <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            튜토리얼 진행률
          </h3>
          <span className="text-sm text-gray-600">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        
        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 단계별 아이콘 */}
      <div className="flex justify-between items-center">
        {stepNames.map((name, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-2"
          >
            <div className="relative">
              {getStepIcon(index)}
              {/* 연결선 */}
              {index < stepNames.length - 1 && (
                <div
                  className={`absolute top-1/2 left-6 w-full h-0.5 -translate-y-1/2 ${getStepColor(index)}`}
                  style={{ width: 'calc(100vw / 5 - 2rem)' }}
                />
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                index <= currentStep ? 'text-gray-800' : 'text-gray-400'
              }`}
            >
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* 완료된 단계 표시 */}
      {completedSteps && completedSteps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            완료된 단계:
          </h4>
          <div className="flex flex-wrap gap-2">
            {completedSteps.map((step, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {step}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TutorialProgress
