import React from 'react'
import { Card, Button, Badge, ErrorMessage, SkeletonLoader } from '@/components'
import { Eye, Edit, Trash2, Copy } from 'lucide-react'
import {
  KubernetesResource,
  ResourceStatus,
  ResourceKind
} from '@/types/kubernetes'

interface ResourceTableProps {
  title: string
  resourceType: ResourceKind
  resources: KubernetesResource[]
  loading?: boolean
  error?: string | null | undefined
  onView?: (resource: KubernetesResource) => void
  onEdit?: (resource: KubernetesResource) => void
  onDelete?: (resource: KubernetesResource) => void
  onRefresh?: () => void
}

const ResourceTable: React.FC<ResourceTableProps> = ({
  title,
  resourceType,
  resources,
  loading = false,
  error,
  onView,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const getStatusColor = (status: ResourceStatus): string => {
    switch (status) {
      case 'Running':
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      case 'Inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getResourceStatus = (resource: KubernetesResource): ResourceStatus => {
    if (resourceType === 'Deployment') {
      const status = resource.status as any
      if (status?.readyReplicas === status?.replicas && status?.replicas > 0) {
        return 'Running'
      } else if (status?.replicas === 0) {
        return 'Inactive'
      } else {
        return 'Pending'
      }
    } else if (resourceType === 'Service') {
      return 'Active'
    } else if (resourceType === 'ConfigMap' || resourceType === 'Secret') {
      return 'Active'
    }
    return 'Unknown'
  }

  const getResourceAge = (resource: KubernetesResource): string => {
    if (!resource.metadata.creationTimestamp) {
      return 'Unknown'
    }

    const created = new Date(resource.metadata.creationTimestamp)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffDays > 0) {
      return `${diffDays}d`
    } else if (diffHours > 0) {
      return `${diffHours}h`
    } else {
      return `${diffMinutes}m`
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <SkeletonLoader variant="text" width="40%" height="24px" />
          <SkeletonLoader variant="text" width="60%" height="16px" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex space-x-4">
                <SkeletonLoader variant="text" width="20%" height="20px" />
                <SkeletonLoader variant="text" width="30%" height="20px" />
                <SkeletonLoader variant="text" width="25%" height="20px" />
                <SkeletonLoader variant="text" width="15%" height="20px" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <ErrorMessage
          error={error}
          type="error"
          title={`${resourceType} 로드 실패`}
          onRetry={onRefresh}
          retryText="다시 시도"
        />
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{resources.length}개</span>
            {onRefresh && (
              <Button onClick={onRefresh} variant="ghost" size="sm">
                새로고침
              </Button>
            )}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">리소스가 없습니다</p>
            <Button variant="outline">
              리소스 생성
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => {
              const status = getResourceStatus(resource)
              const age = getResourceAge(resource)
              
              return (
                <div
                  key={`${resource.metadata.name}-${resource.metadata.namespace}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {resource.metadata.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resource.metadata.namespace} namespace
                        </p>
                      </div>
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                      <span className="text-xs text-gray-400">{age}</span>
                    </div>
                    
                    {resourceType === 'Deployment' && resource.status && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>
                          {resource.status?.['readyReplicas'] || 0}/{resource.status?.['replicas'] || 0} ready
                        </span>
                      </div>
                    )}
                    
                    {resourceType === 'Service' && resource.spec && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>
                          {resource.spec?.['type']} • {resource.spec?.['ports']?.length || 0} ports
                        </span>
                      </div>
                    )}
                    
                    {resourceType === 'ConfigMap' && resource.data && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>
                          {Object.keys(resource.data).length} keys
                        </span>
                      </div>
                    )}
                    
                    {resourceType === 'Secret' && resource.data && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>
                          {Object.keys(resource.data).length} keys
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(resource.metadata.name)}
                      title="이름 복사"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(resource)}
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(resource)}
                        title="편집"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(resource)}
                        title="삭제"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default ResourceTable
