import axios from 'axios';

export interface NaturalLanguageCommand {
  id: string;
  command: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string | undefined;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class NaturalLanguageService {
  private baseUrl = '';

  /**
   * 자연어 명령을 백엔드로 전송하여 처리
   */
  async processCommand(command: string): Promise<CommandResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/nlp/process`, {
        command: command.trim(),
        timestamp: new Date().toISOString(),
        context: {
          page: window.location.pathname,
          userAgent: navigator.userAgent
        }
      });

      return {
        success: true,
        message: response.data.message || '명령이 성공적으로 처리되었습니다.',
        data: response.data.data
      };
    } catch (error: any) {
      console.error('자연어 명령 처리 실패:', error);
      
      return {
        success: false,
        message: '명령 처리 중 오류가 발생했습니다.',
        error: error.response?.data?.message || error.message || '알 수 없는 오류'
      };
    }
  }

  /**
   * 명령 히스토리 조회
   */
  async getCommandHistory(limit: number = 10): Promise<NaturalLanguageCommand[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/nlp/history?limit=${limit}`);
      return response.data.commands || [];
    } catch (error) {
      console.error('명령 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 명령 제안 목록 조회
   */
  async getCommandSuggestions(context?: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/nlp/suggestions`, {
        params: { context }
      });
      return response.data.suggestions || [];
    } catch (error) {
      console.error('명령 제안 조회 실패:', error);
      return this.getDefaultSuggestions();
    }
  }

  /**
   * 기본 명령 제안 목록
   */
  private getDefaultSuggestions(): string[] {
    return [
      "nginx deployment 생성해줘",
      "모든 pod 상태 확인해줘",
      "frontend-app replicas 3개로 늘려줘",
      "test-deployment 삭제해줘",
      "configmap 목록 보여줘",
      "service 생성해줘",
      "secret 업데이트해줘",
      "namespace 생성해줘",
      "리소스 사용량 확인해줘",
      "로그 확인해줘"
    ];
  }

  /**
   * 명령 유효성 검사
   */
  validateCommand(command: string): { isValid: boolean; message?: string } {
    if (!command || command.trim().length === 0) {
      return { isValid: false, message: '명령을 입력해주세요.' };
    }

    if (command.trim().length < 3) {
      return { isValid: false, message: '명령이 너무 짧습니다. (최소 3자 이상)' };
    }

    if (command.trim().length > 500) {
      return { isValid: false, message: '명령이 너무 깁니다. (최대 500자)' };
    }

    // 금지된 명령어 체크
    const forbiddenWords = ['rm -rf', 'sudo', 'kill', 'format', 'delete all'];
    const lowerCommand = command.toLowerCase();
    
    for (const word of forbiddenWords) {
      if (lowerCommand.includes(word)) {
        return { 
          isValid: false, 
          message: `위험한 명령어가 포함되어 있습니다: "${word}"` 
        };
      }
    }

    return { isValid: true };
  }

  /**
   * 명령을 Kubernetes 작업으로 파싱
   */
  parseCommand(command: string): {
    action: 'create' | 'get' | 'update' | 'delete' | 'list' | 'unknown';
    resource: string;
    details: any;
  } {
    const lowerCommand = command.toLowerCase();
    
    // 액션 감지
    let action: 'create' | 'get' | 'update' | 'delete' | 'list' | 'unknown' = 'unknown';
    
    if (lowerCommand.includes('생성') || lowerCommand.includes('만들') || lowerCommand.includes('추가')) {
      action = 'create';
    } else if (lowerCommand.includes('확인') || lowerCommand.includes('보여') || lowerCommand.includes('조회')) {
      action = 'get';
    } else if (lowerCommand.includes('수정') || lowerCommand.includes('변경') || lowerCommand.includes('업데이트')) {
      action = 'update';
    } else if (lowerCommand.includes('삭제') || lowerCommand.includes('제거')) {
      action = 'delete';
    } else if (lowerCommand.includes('목록') || lowerCommand.includes('리스트')) {
      action = 'list';
    }

    // 리소스 타입 감지
    let resource = 'unknown';
    const resourceKeywords = {
      'deployment': ['deployment', '배포'],
      'service': ['service', '서비스'],
      'pod': ['pod', '파드'],
      'configmap': ['configmap', '설정'],
      'secret': ['secret', '시크릿'],
      'namespace': ['namespace', '네임스페이스']
    };

    for (const [resourceType, keywords] of Object.entries(resourceKeywords)) {
      if (keywords.some(keyword => lowerCommand.includes(keyword))) {
        resource = resourceType;
        break;
      }
    }

    return {
      action,
      resource,
      details: {
        originalCommand: command,
        parsedAt: new Date().toISOString()
      }
    };
  }
}

export const naturalLanguageService = new NaturalLanguageService();
export default naturalLanguageService;
