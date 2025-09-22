import { apiClient } from './apiClient'

export class TutorialService {
  static async startTutorial(sessionId: string) {
    return apiClient.post<any>('/tutorial/start', { sessionId })
  }

  static async nextStep(sessionId: string) {
    return apiClient.post<any>(`/tutorial/${sessionId}/next`)
  }

  static async addUserInput(sessionId: string, input: string) {
    return apiClient.post<any>(`/tutorial/${sessionId}/input`, { input })
  }

  static async completeTutorial(sessionId: string) {
    return apiClient.post<any>(`/tutorial/${sessionId}/complete`)
  }

  static async resetTutorial(sessionId: string) {
    return apiClient.post<any>(`/tutorial/${sessionId}/reset`)
  }
}

// Legacy TutorialAPI class for backward compatibility
export class TutorialAPI {
  async startTutorial(sessionId: string) {
    return TutorialService.startTutorial(sessionId)
  }

  async nextStep(sessionId: string) {
    return TutorialService.nextStep(sessionId)
  }

  async addUserInput(sessionId: string, input: string) {
    return TutorialService.addUserInput(sessionId, input)
  }

  async completeTutorial(sessionId: string) {
    return TutorialService.completeTutorial(sessionId)
  }

  async resetTutorial(sessionId: string) {
    return TutorialService.resetTutorial(sessionId)
  }
}
