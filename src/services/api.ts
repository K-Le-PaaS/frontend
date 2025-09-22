import axios, { AxiosResponse } from 'axios'

// API 기본 설정
const API_BASE_URL = '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    return Promise.reject(error)
  }
)

// 튜토리얼 API 타입 정의
export interface TutorialStartRequest {
  session_id: string
}

export interface TutorialUserInputRequest {
  session_id: string
  user_input: string
}

export interface TutorialState {
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
  user_inputs: Array<{
    input: string
    timestamp: string | null
    step: string
  }>
  errors: Array<{
    error: string
    timestamp: string | null
    step: string
  }>
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

// 튜토리얼 API 클래스
export class TutorialAPI {
  /**
   * 튜토리얼 시작
   */
  async startTutorial(sessionId: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.post('/tutorial/start', {
      session_id: sessionId
    })
  }

  /**
   * 현재 튜토리얼 상태 조회
   */
  async getCurrentState(sessionId: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.get(`/tutorial/current?session_id=${sessionId}`)
  }

  /**
   * 다음 단계로 진행
   */
  async nextStep(sessionId: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.post(`/tutorial/next?session_id=${sessionId}`)
  }

  /**
   * 튜토리얼 완료
   */
  async completeTutorial(sessionId: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.post(`/tutorial/complete?session_id=${sessionId}`)
  }

  /**
   * 사용자 입력 추가
   */
  async addUserInput(sessionId: string, userInput: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.post('/tutorial/input', {
      session_id: sessionId,
      user_input: userInput
    })
  }

  /**
   * 에러 추가
   */
  async addError(sessionId: string, errorMessage: string): Promise<AxiosResponse<TutorialState>> {
    return apiClient.post(`/tutorial/error?session_id=${sessionId}&error_message=${encodeURIComponent(errorMessage)}`)
  }

  /**
   * 튜토리얼 리셋
   */
  async resetTutorial(sessionId: string): Promise<AxiosResponse<{ message: string }>> {
    return apiClient.delete(`/tutorial/reset?session_id=${sessionId}`)
  }
}

// 배포 관련 API 타입 정의
export interface DeployRequest {
  app_name: string
  environment: string
  image: string
  replicas?: number
  namespace?: string
}

export interface DeployResponse {
  deployment_id: string
  status: string
  message: string
  created_at: string
}

export interface StatusResponse {
  deployment_id: string
  status: string
  pods: Array<{
    name: string
    status: string
    ready: boolean
    restarts: number
  }>
  services: Array<{
    name: string
    type: string
    cluster_ip: string
    external_ip?: string
  }>
}

export interface RollbackRequest {
  deployment_id: string
  target_revision?: number
}

export interface RollbackResponse {
  rollback_id: string
  status: string
  message: string
  previous_revision: number
  current_revision: number
}

// 배포 API 클래스
export class DeployAPI {
  /**
   * 애플리케이션 배포
   */
  async deployApp(request: DeployRequest): Promise<AxiosResponse<DeployResponse>> {
    return apiClient.post('/deploy', request)
  }

  /**
   * 배포 상태 확인
   */
  async getDeploymentStatus(deploymentId: string): Promise<AxiosResponse<StatusResponse>> {
    return apiClient.get(`/deployments/${deploymentId}/status`)
  }

  /**
   * 롤백 실행
   */
  async rollbackDeployment(request: RollbackRequest): Promise<AxiosResponse<RollbackResponse>> {
    return apiClient.post('/rollback', request)
  }

  /**
   * 배포 목록 조회
   */
  async getDeployments(): Promise<AxiosResponse<DeployResponse[]>> {
    return apiClient.get('/deployments')
  }
}

// 자연어 처리 API 타입 정의
export interface NaturalLanguageRequest {
  text: string
  context?: string
}

export interface NaturalLanguageResponse {
  intent: string
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  confidence: number
  suggested_action: string
}

// 자연어 처리 API 클래스
export class NaturalLanguageAPI {
  /**
   * 자연어 명령 해석
   */
  async processCommand(request: NaturalLanguageRequest): Promise<AxiosResponse<NaturalLanguageResponse>> {
    return apiClient.post('/nlp/process', request)
  }

  /**
   * 명령어 제안
   */
  async getSuggestions(partialText: string): Promise<AxiosResponse<string[]>> {
    return apiClient.get(`/nlp/suggestions?text=${encodeURIComponent(partialText)}`)
  }
}

// API 인스턴스 내보내기
export const tutorialAPI = new TutorialAPI()
export const deployAPI = new DeployAPI()
export const nlpAPI = new NaturalLanguageAPI()

// 기본 API 클라이언트 내보내기
export default apiClient
