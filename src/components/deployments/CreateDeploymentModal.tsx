import React, { useState } from 'react'
import { Button, Input } from '@/components'
import { X, GitBranch, AlertCircle } from 'lucide-react'
import { DeploymentService } from '@/services/deploymentService'
import { Environment } from '@/types'

interface CreateDeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  name: string
  repository: string
  branch: string
  environment: Environment
  image: string
  replicas: number
  port: number
}

const CreateDeploymentModal: React.FC<CreateDeploymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    repository: '',
    branch: 'main',
    environment: 'staging',
    image: '',
    replicas: 2,
    port: 8080
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.repository || !formData.image) {
      setError('필수 필드를 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 배포 생성 API 호출
      await DeploymentService.createDeployment({
        name: formData.name,
        repository: formData.repository,
        branch: formData.branch,
        environment: formData.environment,
        status: 'pending',
        image: formData.image,
        replicas: formData.replicas,
        ports: [{ name: 'http', port: formData.port, targetPort: formData.port, protocol: 'TCP' }],
        envVars: {},
        secrets: {}
      })

      onSuccess()
    } catch (err) {
      console.error('Failed to create deployment:', err)
      setError('배포 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">새 배포 파이프라인 생성</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                애플리케이션 이름 *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="my-app"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                환경 *
              </label>
              <select
                value={formData.environment}
                onChange={(e) => handleInputChange('environment', e.target.value as Environment)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Git 저장소 URL *
            </label>
            <Input
              type="url"
              value={formData.repository}
              onChange={(e) => handleInputChange('repository', e.target.value)}
              placeholder="https://github.com/username/repository"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜치
              </label>
              <Input
                type="text"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="main"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Docker 이미지 *
              </label>
              <Input
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="nginx:latest"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replicas
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.replicas}
                onChange={(e) => handleInputChange('replicas', parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                포트
              </label>
              <Input
                type="number"
                min="1"
                max="65535"
                value={formData.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 8080)}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <GitBranch className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Git 연동 정보</h4>
                <p className="text-sm text-blue-700 mt-1">
                  이 배포는 <code className="bg-blue-100 px-1 rounded">{formData.branch}</code> 브랜치의 
                  변경사항을 자동으로 감지하여 배포합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '생성 중...' : '배포 생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { CreateDeploymentModal }
