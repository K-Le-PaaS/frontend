import React, { useState, useEffect } from 'react'
import { Card, Button, Switch } from '@/components'
import { Bell, Save, X } from 'lucide-react'
import { UserService, NotificationSettings } from '@/services/userService'

interface NotificationSettingsProps {
  className?: string
  onUpdate?: (settings: NotificationSettings) => void
}

export const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({ 
  className, 
  onUpdate 
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    slackNotifications: true,
    smsNotifications: false,
    deploymentAlerts: true,
    systemAlerts: true,
    securityAlerts: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const notificationSettings = await UserService.getNotificationSettings()
      setSettings(notificationSettings)
    } catch (err) {
      console.error('Failed to load notification settings:', err)
      setError('알림 설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      await UserService.updateNotificationSettings(settings)
      
      setSuccess('알림 설정이 성공적으로 저장되었습니다.')
      onUpdate?.(settings)
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save notification settings:', err)
      setError('알림 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (loading) {
    return (
      <Card className={className || ''}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 w-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className || ''}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Bell className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">알림 설정</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <X className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <Save className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* 이메일 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">이메일 알림</p>
              <p className="text-xs text-gray-500">배포 상태 변경 및 시스템 이벤트를 이메일로 알림</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
              disabled={saving}
            />
          </div>

          {/* Slack 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Slack 알림</p>
              <p className="text-xs text-gray-500">Slack 채널로 실시간 알림 전송</p>
            </div>
            <Switch
              checked={settings.slackNotifications}
              onChange={() => handleToggle('slackNotifications')}
              disabled={saving}
            />
          </div>

          {/* SMS 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">SMS 알림</p>
              <p className="text-xs text-gray-500">긴급 상황 시 SMS로 알림 (추가 비용 발생)</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
              disabled={saving}
            />
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200"></div>

          {/* 배포 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">배포 알림</p>
              <p className="text-xs text-gray-500">배포 시작, 완료, 실패 시 알림</p>
            </div>
            <Switch
              checked={settings.deploymentAlerts}
              onChange={() => handleToggle('deploymentAlerts')}
              disabled={saving}
            />
          </div>

          {/* 시스템 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">시스템 알림</p>
              <p className="text-xs text-gray-500">시스템 상태 변경 및 성능 이슈 알림</p>
            </div>
            <Switch
              checked={settings.systemAlerts}
              onChange={() => handleToggle('systemAlerts')}
              disabled={saving}
            />
          </div>

          {/* 보안 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">보안 알림</p>
              <p className="text-xs text-gray-500">보안 관련 이벤트 및 접근 시도 알림</p>
            </div>
            <Switch
              checked={settings.securityAlerts}
              onChange={() => handleToggle('securityAlerts')}
              disabled={saving}
            />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                저장 중...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </div>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default NotificationSettingsComponent
