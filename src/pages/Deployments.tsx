import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, SkeletonLoader } from '@/components'
import { Plus, Search, GitBranch, Play, RotateCcw, RefreshCw, Settings, AlertCircle } from 'lucide-react'
import { DeploymentService } from '@/services/deploymentService'
import { Deployment } from '@/types'
import { CreateDeploymentModal } from '@/components/deployments/CreateDeploymentModal'
import { DeploymentDetailsModal } from '@/components/deployments/DeploymentDetailsModal'

interface DeploymentWithStatus extends Deployment {
  currentStatus?: {
    status: string
    progress: number
    ready: number
    total: number
    reasons: string[]
  }
  versions?: Array<{
    id: string
    image: string
    image_tag: string
    status: string
    progress: number
    deployed_at: string
    is_rollback: boolean
  }>
}

const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentWithStatus | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // 배포 목록 로드
  const loadDeployments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 실제 배포 목록을 가져오는 API 호출
      const response = await DeploymentService.getDeployments()
      const deploymentsData = (response as any).deployments || []
      
      // 각 배포의 상태와 버전 정보를 병렬로 로드
      const deploymentsWithStatus = await Promise.all(
        deploymentsData.map(async (deployment: any) => {
          try {
            const [statusData, versionsData] = await Promise.all([
              DeploymentService.getDeploymentStatus(deployment.name, deployment.environment),
              DeploymentService.getDeploymentVersions(deployment.name, deployment.environment)
            ])
            
            return {
              ...deployment,
              currentStatus: statusData,
              versions: versionsData.versions || []
            }
          } catch (err) {
            console.warn(`Failed to load status for ${deployment.name}:`, err)
            return deployment
          }
        })
      )
      
      setDeployments(deploymentsWithStatus)
    } catch (err) {
      console.error('Failed to load deployments:', err)
      setError('배포 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDeployments()
  }, [loadDeployments])

  // 배포 실행
  const handleDeploy = async (deployment: DeploymentWithStatus) => {
    try {
      await DeploymentService.deployApplication(deployment.id)
      await loadDeployments() // 목록 새로고침
    } catch (err) {
      console.error('Deployment failed:', err)
      setError('배포 실행에 실패했습니다.')
    }
  }

  // 롤백 실행
  const handleRollback = async (deployment: DeploymentWithStatus) => {
    try {
      await DeploymentService.rollbackDeployment(deployment.name, deployment.environment)
      await loadDeployments() // 목록 새로고침
    } catch (err) {
      console.error('Rollback failed:', err)
      setError('롤백 실행에 실패했습니다.')
    }
  }

  // 필터링된 배포 목록
  const filteredDeployments = deployments.filter(deployment => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.repository.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEnvironment = environmentFilter === 'all' || deployment.environment === environmentFilter
    return matchesSearch && matchesEnvironment
  })

  // 상태별 스타일
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
      case 'stopped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">배포 파이프라인</h1>
            <p className="text-gray-600">Git 기반 자동 배포 관리</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-6">
                <SkeletonLoader className="h-6 w-48 mb-2" />
                <SkeletonLoader className="h-4 w-32 mb-4" />
                <div className="space-y-3">
                  <SkeletonLoader className="h-16 w-full" />
                  <SkeletonLoader className="h-16 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배포 파이프라인</h1>
          <p className="text-gray-600">Git 기반 자동 배포 관리</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={loadDeployments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 배포
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="배포 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select 
          value={environmentFilter}
          onChange={(e) => setEnvironmentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">모든 환경</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredDeployments.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">배포 파이프라인이 없습니다</h3>
              <p className="text-gray-500 mb-4">새로운 배포 파이프라인을 생성해보세요.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 배포 생성
              </Button>
            </div>
          </Card>
        ) : (
          filteredDeployments.map((deployment) => (
            <Card key={deployment.id}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{deployment.name}</h3>
                      <p className="text-sm text-gray-500">
                        {deployment.repository} • {deployment.branch} • {deployment.environment}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleDeploy(deployment)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      배포
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleRollback(deployment)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      롤백
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setSelectedDeployment(deployment)
                        setShowDetailsModal(true)
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      상세
                    </Button>
                  </div>
                </div>

                {/* 현재 상태 */}
                {deployment.currentStatus && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {deployment.currentStatus.status === 'success' ? 'Running' : 
                           deployment.currentStatus.status === 'in_progress' ? 'Building' :
                           deployment.currentStatus.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deployment.currentStatus.ready}/{deployment.currentStatus.total} pods ready
                          {deployment.currentStatus.progress > 0 && ` • ${deployment.currentStatus.progress}%`}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(deployment.currentStatus.status)}`}>
                        {deployment.currentStatus.status === 'success' ? 'Running' : 
                         deployment.currentStatus.status === 'in_progress' ? 'Building' :
                         deployment.currentStatus.status}
                      </span>
                    </div>
                    {deployment.currentStatus.reasons.length > 0 && (
                      <div className="mt-2 text-xs text-red-600">
                        {deployment.currentStatus.reasons.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* 버전 히스토리 */}
                {deployment.versions && deployment.versions.length > 0 && (
                  <div className="space-y-3">
                    {deployment.versions.slice(0, 3).map((version) => (
                      <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{version.image_tag}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(version.deployed_at).toLocaleString()} • {deployment.replicas} replicas
                            {version.is_rollback && ' • 롤백됨'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(version.status)}`}>
                          {version.status === 'success' ? 'Running' : 
                           version.status === 'in_progress' ? 'Building' :
                           version.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 모달들 */}
      {showCreateModal && (
        <CreateDeploymentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadDeployments()
          }}
        />
      )}

      {showDetailsModal && selectedDeployment && (
        <DeploymentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          deployment={selectedDeployment}
          onUpdate={loadDeployments}
        />
      )}
    </div>
  )
}

export default Deployments
