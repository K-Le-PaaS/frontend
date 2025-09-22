import { apiClient } from './apiClient'
import { User, UserUpdateRequest, PasswordChangeRequest, AuthProvider } from '@/types'

export interface NotificationSettings {
  emailNotifications: boolean
  slackNotifications: boolean
  smsNotifications: boolean
  deploymentAlerts: boolean
  systemAlerts: boolean
  securityAlerts: boolean
}

export interface SystemSettings {
  defaultCluster: string
  autoDeploy: boolean
  rollbackPolicy: 'auto' | 'manual'
  monitoringInterval: number
  logRetentionDays: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
}

export interface UserProfile extends User {
  notificationSettings: NotificationSettings
  systemSettings: SystemSettings
  lastLoginAt: string
  loginCount: number
}

export class UserService {
  private static readonly baseUrl = '/api/v1/users'

  /**
   * 현재 사용자 프로필 정보 가져오기
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(`${this.baseUrl}/profile`)
      return response
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // 기본값 반환
      return UserService.getDefaultProfile()
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  static async updateProfile(data: UserUpdateRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>(`${this.baseUrl}/profile`, data)
      return response
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  /**
   * 비밀번호 변경
   */
  static async changePassword(data: PasswordChangeRequest): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/change-password`, data)
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    }
  }

  /**
   * 프로필 이미지 업로드
   */
  static async uploadAvatar(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await apiClient.post<{ url: string }>(
        `${this.baseUrl}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return response
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      throw error
    }
  }

  /**
   * 알림 설정 저장
   */
  static async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/notification-settings`, settings)
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      throw error
    }
  }

  /**
   * 알림 설정 조회
   */
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get<NotificationSettings>(`${this.baseUrl}/notification-settings`)
      return response
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
      return UserService.getDefaultNotificationSettings()
    }
  }

  /**
   * 시스템 설정 저장
   */
  static async updateSystemSettings(settings: SystemSettings): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/system-settings`, settings)
    } catch (error) {
      console.error('Failed to update system settings:', error)
      throw error
    }
  }

  /**
   * 시스템 설정 조회
   */
  static async getSystemSettings(): Promise<SystemSettings> {
    try {
      const response = await apiClient.get<SystemSettings>(`${this.baseUrl}/system-settings`)
      return response
    } catch (error) {
      console.error('Failed to fetch system settings:', error)
      return UserService.getDefaultSystemSettings()
    }
  }

  /**
   * 계정 삭제
   */
  static async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/account`)
    } catch (error) {
      console.error('Failed to delete account:', error)
      throw error
    }
  }

  /**
   * 기본 프로필 반환
   */
  private static getDefaultProfile(): UserProfile {
    return {
      id: '1',
      email: 'admin@example.com',
      name: '관리자',
      role: 'owner',
      avatar: '',
      isActive: true,
      provider: 'email' as AuthProvider,
      providerId: '1',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notificationSettings: UserService.getDefaultNotificationSettings(),
      systemSettings: UserService.getDefaultSystemSettings(),
      lastLoginAt: new Date().toISOString(),
      loginCount: 0
    }
  }

  /**
   * 기본 알림 설정 반환
   */
  private static getDefaultNotificationSettings(): NotificationSettings {
    return {
      emailNotifications: true,
      slackNotifications: true,
      smsNotifications: false,
      deploymentAlerts: true,
      systemAlerts: true,
      securityAlerts: true
    }
  }

  /**
   * 기본 시스템 설정 반환
   */
  private static getDefaultSystemSettings(): SystemSettings {
    return {
      defaultCluster: 'gcp',
      autoDeploy: true,
      rollbackPolicy: 'auto',
      monitoringInterval: 5000,
      logRetentionDays: 30,
      theme: 'light',
      language: 'ko',
      timezone: 'Asia/Seoul'
    }
  }
}
