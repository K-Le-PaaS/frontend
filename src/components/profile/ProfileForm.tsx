import React, { useState, useEffect } from 'react'
import { Card, Button, Input } from '@/components'
import { User, Camera, Save, X } from 'lucide-react'
import { UserService, UserProfile } from '@/services/userService'
import { UserUpdateRequest } from '@/types'
import { cn } from '@/utils'

interface ProfileFormProps {
  className?: string
  onUpdate?: (profile: UserProfile) => void
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ className, onUpdate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<UserUpdateRequest>({
    name: '',
    email: '',
    avatar: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const userProfile = await UserService.getProfile()
      setProfile(userProfile)
      setFormData({
        name: userProfile.name,
        email: userProfile.email,
        avatar: userProfile.avatar || ''
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('프로필 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const updatedUser = await UserService.updateProfile(formData)
      
      // 프로필 업데이트
      const updatedProfile = { ...profile, ...updatedUser }
      setProfile(updatedProfile)
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다.')
      onUpdate?.(updatedProfile)
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError('프로필 업데이트에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 파일 크기는 5MB를 초과할 수 없습니다.')
      return
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const result = await UserService.uploadAvatar(file)
      
      setFormData(prev => ({ ...prev, avatar: result.url }))
      setSuccess('프로필 이미지가 업로드되었습니다.')
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setError('이미지 업로드에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return '관리자'
      case 'developer': return '개발자'
      case 'viewer': return '뷰어'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800'
      case 'developer': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card className={className || ''}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className={className || ''}>
        <div className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">프로필 정보를 불러올 수 없습니다.</p>
          <Button onClick={loadProfile} className="mt-4">
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className || ''}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">계정 정보</h3>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="h-3 w-3" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={saving}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">프로필 이미지</p>
              <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 5MB)</p>
            </div>
          </div>

          {/* 사용자명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사용자명
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full"
              required
              disabled={saving}
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full"
              required
              disabled={saving}
            />
          </div>

          {/* 역할 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <div className="flex items-center space-x-2">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getRoleColor(profile.role)
              )}>
                {getRoleText(profile.role)}
              </span>
              <span className="text-xs text-gray-500">
                (역할은 관리자에 의해 변경됩니다)
              </span>
            </div>
          </div>

          {/* 계정 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                마지막 로그인
              </label>
              <p className="text-sm text-gray-600">
                {new Date(profile.lastLoginAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                로그인 횟수
              </label>
              <p className="text-sm text-gray-600">
                {profile.loginCount.toLocaleString()}회
              </p>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button
              type="submit"
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
                  저장
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

export default ProfileForm
