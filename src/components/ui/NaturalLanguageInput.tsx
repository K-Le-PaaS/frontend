import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2, Sparkles, X } from 'lucide-react';
import Button from './Button';
import Card from './Card';

// SpeechRecognition 타입 정의
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

interface NaturalLanguageInputProps {
  onCommandSubmit: (command: string) => void;
  onCommandClear?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onCommandSubmit,
  onCommandClear,
  isLoading = false,
  placeholder = "자연어로 명령을 입력하세요... (예: 'nginx deployment 생성해줘', '모든 pod 상태 확인해줘')",
  className = ""
}) => {
  const [command, setCommand] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // 음성 인식 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'ko-KR';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCommand(transcript);
          setIsRecording(false);
        };

        recognitionRef.current.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  // 음성 인식 시작/중지
  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // 명령 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onCommandSubmit(command.trim());
      setCommand('');
    }
  };

  // 명령 초기화
  const handleClear = () => {
    setCommand('');
    onCommandClear?.();
  };

  // Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 제출)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 텍스트 영역 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [command]);

  return (
    <Card className={`p-6 ${className}`} variant="glass">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 자연어 명령
            </h3>
          </div>
          {command && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 명령 입력 영역 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isLoading}
              className={`
                w-full px-4 py-3 pr-20 border rounded-lg resize-none
                bg-white/80 dark:bg-gray-800/80
                border-gray-200 dark:border-gray-600
                focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                placeholder-gray-500 dark:placeholder-gray-400
                text-gray-900 dark:text-white
                transition-all duration-200
                ${isFocused ? 'shadow-lg' : 'shadow-sm'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              rows={3}
              maxLength={500}
            />
            
            {/* 음성 인식 버튼 */}
            <div className="absolute right-2 top-2 flex space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                disabled={isLoading || !recognitionRef.current}
                className={`
                  w-8 h-8 p-0
                  ${isRecording 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-500 hover:text-blue-500'
                  }
                `}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                type="submit"
                disabled={!command.trim() || isLoading}
                size="sm"
                className="w-8 h-8 p-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 명령 예시 */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2 font-medium">💡 명령 예시:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
                <span className="font-medium">배포:</span> "nginx deployment 생성해줘"
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded">
                <span className="font-medium">확인:</span> "모든 pod 상태 확인해줘"
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded">
                <span className="font-medium">수정:</span> "frontend-app replicas 3개로 늘려줘"
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                <span className="font-medium">삭제:</span> "test-deployment 삭제해줘"
              </div>
            </div>
          </div>

          {/* 문자 수 표시 */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{command.length}/500</span>
            <span className="text-blue-500">
              {isRecording && '🎤 음성 인식 중...'}
            </span>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default NaturalLanguageInput;
