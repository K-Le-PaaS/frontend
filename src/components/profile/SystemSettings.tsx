import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select } from '@/components'
import { Settings, Save, X } from 'lucide-react'
import { UserService, SystemSettings } from '@/services/userService'

interface SystemSettingsProps {
  className?: string
  onUpdate?: (settings: SystemSettings) => void
}

export const SystemSettingsComponent: React.FC<SystemSettingsProps> = ({ 
  className, 
  onUpdate 
}) => {
  const [settings, setSettings] = useState<SystemSettings>({
    defaultCluster: 'gcp',
    autoDeploy: true,
    rollbackPolicy: 'auto',
    monitoringInterval: 5000,
    logRetentionDays: 30,
    theme: 'light',
    language: 'ko',
    timezone: 'Asia/Seoul'
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
      const systemSettings = await UserService.getSystemSettings()
      setSettings(systemSettings)
    } catch (err) {
      console.error('Failed to load system settings:', err)
      setError('시스템 설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      await UserService.updateSystemSettings(settings)
      
      setSuccess('시스템 설정이 성공적으로 저장되었습니다.')
      onUpdate?.(settings)
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save system settings:', err)
      setError('시스템 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <Card className={className || ''}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
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
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">시스템 설정</h3>
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
          {/* 기본 클러스터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기본 클러스터
            </label>
            <Select
              value={settings.defaultCluster}
              onChange={(value) => handleChange('defaultCluster', value)}
              disabled={saving}
            >
              <option value="gcp">GCP Production</option>
              <option value="ncp">NCP Staging</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              새로운 배포 시 기본으로 사용할 클러스터
            </p>
          </div>

          {/* 자동 배포 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자동 배포
            </label>
            <Select
              value={settings.autoDeploy ? 'enabled' : 'disabled'}
              onChange={(e) => handleChange('autoDeploy', e.target.value === 'enabled')}
              disabled={saving}
            >
              <option value="enabled">활성화</option>
              <option value="disabled">비활성화</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Git Push 시 자동으로 배포를 시작할지 여부
            </p>
          </div>

          {/* 롤백 정책 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              롤백 정책
            </label>
            <Select
              value={settings.rollbackPolicy}
              onChange={(value) => handleChange('rollbackPolicy', value)}
              disabled={saving}
            >
              <option value="auto">자동 롤백</option>
              <option value="manual">수동 롤백</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              배포 실패 시 자동으로 이전 버전으로 롤백할지 여부
            </p>
          </div>

          {/* 모니터링 간격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모니터링 간격 (초)
            </label>
            <Input
              type="number"
              value={settings.monitoringInterval / 1000}
              onChange={(e) => handleChange('monitoringInterval', parseInt(e.target.value) * 1000)}
              className="w-full"
              min="1"
              max="60"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              대시보드 데이터 새로고침 간격 (1-60초)
            </p>
          </div>

          {/* 로그 보관 기간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              로그 보관 기간 (일)
            </label>
            <Input
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => handleChange('logRetentionDays', parseInt(e.target.value))}
              className="w-full"
              min="1"
              max="365"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              시스템 로그를 보관할 기간 (1-365일)
            </p>
          </div>

          {/* 테마 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              테마
            </label>
            <Select
              value={settings.theme}
              onChange={(value) => handleChange('theme', value)}
              disabled={saving}
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="auto">자동</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              인터페이스 테마 설정
            </p>
          </div>

          {/* 언어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              언어
            </label>
            <Select
              value={settings.language}
              onChange={(value) => handleChange('language', value)}
              disabled={saving}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              인터페이스 언어 설정
            </p>
          </div>

          {/* 시간대 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간대
            </label>
            <Select
              value={settings.timezone}
              onChange={(value) => handleChange('timezone', value)}
              disabled={saving}
            >
              <option value="Asia/Seoul">한국 표준시 (KST)</option>
              <option value="UTC">협정 세계시 (UTC)</option>
              <option value="America/New_York">미국 동부 시간 (EST)</option>
              <option value="Europe/London">영국 시간 (GMT)</option>
              <option value="Asia/Tokyo">일본 표준시 (JST)</option>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              시간 표시에 사용할 시간대
            </p>
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

export default SystemSettingsComponent
