import { apiClient } from './apiClient'
import { NaturalLanguageCommand } from '@/types'

export class NLPService {
  static async processCommand(command: string) {
    return apiClient.post<NaturalLanguageCommand>('/nlp/process', { command })
  }

  static async getCommandHistory() {
    return apiClient.get<NaturalLanguageCommand[]>('/nlp/history')
  }
}
