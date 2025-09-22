import React, { useState, useEffect } from 'react'
import { Button, Card } from '@/components'
import { X, Play, RotateCcw, GitBranch, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { DeploymentService } from '@/services/deploymentService'

interface DeploymentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  deployment: any
  onUpdate: () => void
}

const DeploymentDetailsModal: React.FC<DeploymentDetailsModalProps> = ({
  isOpen,
  onClose,
  deployment,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deploymentDetails, setDeploymentDetails] = useState<any>(null)

  useEffect(() => {
    if (isOpen && deployment) {
      loadDeploymentDetails()
    }
  }, [isOpen, deployment])

  const loadDeploymentDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statusData, versionsData] = await Promise.all([
        DeploymentService.getDeploymentStatus(deployment.name, deployment.environment),
        DeploymentService.getDeploymentVersions(deployment.name, deployment.environment)
      ])

      setDeploymentDetails({
        ...deployment,
        currentStatus: statusData,
        versions: versionsData.versions || []
      })
    } catch (err) {
      console.error('Failed to load deployment details:', err)
      setError('배포 상세 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    try {
      setLoading(true)
      await DeploymentService.deployApplication(deployment.id)
      await loadDeploymentDetails()
      onUpdate()
    } catch (err) {
      console.error('Deployment failed:', err)
      setError('배포 실행에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRollback = async () => {
    try {
      setLoading(true)
      await DeploymentService.rollbackDeployment(deployment.name, deployment.environment)
      await loadDeploymentDetails()
      onUpdate()
    } catch (err) {
      console.error('Rollback failed:', err)
      setError('롤백 실행에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
      case 'building':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
      case 'building':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen || !deployment) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{deployment.name}</h2>
              <p className="text-sm text-gray-500">
                {deployment.repository} • {deployment.branch} • {deployment.environment}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* 현재 상태 */}
          {deploymentDetails?.currentStatus && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">현재 상태</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(deploymentDetails.currentStatus.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">상태</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(deploymentDetails.currentStatus.status)}`}>
                        {deploymentDetails.currentStatus.status === 'success' ? 'Running' : 
                         deploymentDetails.currentStatus.status === 'in_progress' ? 'Building' :
                         deploymentDetails.currentStatus.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pod 상태</p>
                    <p className="text-sm text-gray-600">
                      {deploymentDetails.currentStatus.ready}/{deploymentDetails.currentStatus.total} ready
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">진행률</p>
                    <p className="text-sm text-gray-600">
                      {deploymentDetails.currentStatus.progress}%
                    </p>
                  </div>
                </div>

                {deploymentDetails.currentStatus.reasons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">문제 사유</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <ul className="text-sm text-red-700 space-y-1">
                        {deploymentDetails.currentStatus.reasons.map((reason: string, index: number) => (
                          <li key={index}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 배포 정보 */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">배포 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">이미지</p>
                  <p className="text-sm text-gray-600 font-mono">{deployment.image}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Replicas</p>
                  <p className="text-sm text-gray-600">{deployment.replicas}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">포트</p>
                  <p className="text-sm text-gray-600">
                    {deployment.ports?.map((port: any) => `${port.containerPort}:${port.servicePort}`).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">생성일</p>
                  <p className="text-sm text-gray-600">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 버전 히스토리 */}
          {deploymentDetails?.versions && deploymentDetails.versions.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">배포 히스토리</h3>
                <div className="space-y-3">
                  {deploymentDetails.versions.map((version: any, index: number) => (
                    <div key={version.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(version.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{version.image_tag}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(version.deployed_at).toLocaleString()}
                            {version.is_rollback && ' • 롤백됨'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(version.status)}`}>
                          {version.status === 'success' ? 'Running' : 
                           version.status === 'in_progress' ? 'Building' :
                           version.status}
                        </span>
                        {index > 0 && version.status === 'success' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRollback()}
                            disabled={loading}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            롤백
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button
              variant="secondary"
              onClick={handleRollback}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {loading ? '롤백 중...' : '이전 버전으로 롤백'}
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              {loading ? '배포 중...' : '배포 실행'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DeploymentDetailsModal }
