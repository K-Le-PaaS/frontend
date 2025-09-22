import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, Trash2, Copy, RefreshCw } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { NaturalLanguageCommand } from '../../services/naturalLanguageService';

interface CommandHistoryProps {
  commands: NaturalLanguageCommand[];
  onRefresh: () => void;
  onClear: () => void;
  onCopyCommand: (command: string) => void;
  className?: string;
}

export const CommandHistory: React.FC<CommandHistoryProps> = ({
  commands,
  onRefresh,
  onClear,
  onCopyCommand,
  className = ""
}) => {
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  const getStatusIcon = (status: NaturalLanguageCommand['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: NaturalLanguageCommand['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'processing':
        return '처리 중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      default:
        return '알 수 없음';
    }
  };

  const getStatusColor = (status: NaturalLanguageCommand['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const toggleExpanded = (commandId: string) => {
    setExpandedCommand(expandedCommand === commandId ? null : commandId);
  };

  if (commands.length === 0) {
    return (
      <Card className={`p-6 ${className}`} variant="glass">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">명령 히스토리가 없습니다</p>
          <p className="text-sm">자연어 명령을 입력하면 여기에 기록됩니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`} variant="glass">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              명령 히스토리
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {commands.length}개
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-gray-500 hover:text-blue-500"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 명령 목록 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {commands.map((command) => (
            <div
              key={command.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* 명령 기본 정보 */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(command.status)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(command.status)}`}>
                      {getStatusText(command.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(command.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                    {command.command}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopyCommand(command.command)}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(command.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedCommand === command.id ? '접기' : '자세히'}
                  </Button>
                </div>
              </div>

              {/* 확장된 정보 */}
              {expandedCommand === command.id && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="space-y-2">
                    {/* 결과 또는 에러 */}
                    {command.result && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          결과:
                        </p>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                          {JSON.stringify(command.result, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {command.error && (
                      <div>
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                          오류:
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {command.error}
                        </p>
                      </div>
                    )}

                    {/* 메타데이터 */}
                    <div className="text-xs text-gray-500">
                      <p>ID: {command.id}</p>
                      <p>시간: {new Date(command.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default CommandHistory;
