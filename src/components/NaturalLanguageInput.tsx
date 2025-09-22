import React, { useState } from 'react'
import { Send, Lightbulb, Copy } from 'lucide-react'

interface NaturalLanguageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (input: string) => void
  examples: string[]
  isLoading: boolean
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  value,
  onChange,
  onSubmit,
  examples,
  isLoading
}) => {
  const [showExamples, setShowExamples] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isLoading) {
      onSubmit(value.trim())
    }
  }

  const handleExampleClick = (example: string) => {
    onChange(example)
    setShowExamples(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          💬 자연어로 명령해보세요
        </h3>
        <p className="text-gray-600 text-sm">
          아래 입력창에 자연어로 명령을 입력하거나, 예시를 클릭해서 사용해보세요.
        </p>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="예: hello-world 앱을 스테이징에 배포해줘"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* 예시 토글 버튼 */}
      <div className="mb-4">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <Lightbulb className="w-4 h-4" />
          <span>예시 보기 ({examples.length}개)</span>
        </button>
      </div>

      {/* 예시 목록 */}
      {showExamples && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            💡 사용 가능한 명령어 예시:
          </h4>
          {examples.map((example, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <code className="text-sm text-gray-700 flex-1 mr-2">
                "{example}"
              </code>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleExampleClick(example)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="이 예시 사용하기"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyToClipboard(example)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="클립보드에 복사"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 자연어 명령 팁:</p>
            <ul className="space-y-1 text-xs">
              <li>• 구체적인 앱 이름과 환경을 명시하세요 (예: "hello-world", "스테이징")</li>
              <li>• 원하는 동작을 명확히 표현하세요 (예: "배포해줘", "상태 확인해줘")</li>
              <li>• 질문 형태로도 가능합니다 (예: "앱이 정상적으로 실행되고 있나?")</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NaturalLanguageInput
