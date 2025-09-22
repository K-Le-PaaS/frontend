import React, { useState } from 'react'
import { Card, Button, Input } from '@/components'
import { Shield, Eye, EyeOff, Save, X } from 'lucide-react'
import { UserService } from '@/services/userService'
import { PasswordChangeRequest } from '@/types'
import { cn } from '@/utils'

interface PasswordChangeFormProps {
  className?: string
  onSuccess?: () => void
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ 
  className, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.currentPassword) {
      errors['currentPassword'] = '현재 비밀번호를 입력해주세요.'
    }

    if (!formData.newPassword) {
      errors['newPassword'] = '새 비밀번호를 입력해주세요.'
    } else if (formData.newPassword.length < 8) {
      errors['newPassword'] = '비밀번호는 최소 8자 이상이어야 합니다.'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      errors['newPassword'] = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'
    }

    if (!formData.confirmPassword) {
      errors['confirmPassword'] = '비밀번호 확인을 입력해주세요.'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors['confirmPassword'] = '비밀번호가 일치하지 않습니다.'
    }

    if (formData.currentPassword === formData.newPassword) {
      errors['newPassword'] = '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const passwordData: PasswordChangeRequest = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }

      await UserService.changePassword(passwordData)
      
      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      onSuccess?.()
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Failed to change password:', err)
      setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++

    if (score < 2) return { score, text: '약함', color: 'bg-red-500' }
    if (score < 4) return { score, text: '보통', color: 'bg-yellow-500' }
    return { score, text: '강함', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <Card className={className || ''}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Shield className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">보안 설정</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 비밀번호
            </label>
            <div className="relative">
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={cn(
                  'w-full pr-10',
                  validationErrors['currentPassword'] && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="현재 비밀번호를 입력하세요"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors['currentPassword'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['currentPassword']}</p>
            )}
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={cn(
                  'w-full pr-10',
                  validationErrors['newPassword'] && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="새 비밀번호를 입력하세요"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors['newPassword'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['newPassword']}</p>
            )}
            
            {/* 비밀번호 강도 표시 */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full transition-all duration-300', passwordStrength.color)}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{passwordStrength.text}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  대문자, 소문자, 숫자, 특수문자를 포함하여 8자 이상 입력하세요
                </p>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={cn(
                  'w-full pr-10',
                  validationErrors['confirmPassword'] && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                )}
                placeholder="비밀번호를 다시 입력하세요"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors['confirmPassword'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['confirmPassword']}</p>
            )}
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  변경 중...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

export default PasswordChangeForm
