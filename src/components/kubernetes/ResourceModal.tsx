import React, { useState, useEffect } from 'react'
import { Button, Input, Select } from '@/components'
import { X } from 'lucide-react'
import {
  KubernetesResource,
  ResourceKind,
  CreateResourceRequest,
  UpdateResourceRequest
} from '@/types/kubernetes'

interface ResourceModalProps {
  open: boolean
  mode: 'create' | 'edit' | 'view'
  resourceType: ResourceKind
  resource?: KubernetesResource | undefined
  onClose: () => void
  onSave: (data: CreateResourceRequest | UpdateResourceRequest) => Promise<void>
  onDelete?: (resource: KubernetesResource) => Promise<void>
}

const ResourceModal: React.FC<ResourceModalProps> = ({
  open,
  mode,
  resourceType,
  resource,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<CreateResourceRequest>({
    apiVersion: '',
    kind: resourceType,
    metadata: {
      name: '',
      namespace: 'default',
      labels: {},
      annotations: {}
    },
    spec: {},
    data: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && resource) {
        setFormData({
          apiVersion: resource.apiVersion,
          kind: resource.kind as ResourceKind,
          metadata: {
            name: resource.metadata.name,
            namespace: resource.metadata.namespace,
            labels: resource.metadata.labels || {},
            annotations: resource.metadata.annotations || {}
          },
          spec: resource.spec || {},
          data: resource.data || {}
        })
      } else if (mode === 'create') {
        setFormData({
          apiVersion: getDefaultApiVersion(resourceType),
          kind: resourceType,
          metadata: {
            name: '',
            namespace: 'default',
            labels: {},
            annotations: {}
          },
          spec: {},
          data: {}
        })
      }
      setError(null)
    }
  }, [open, mode, resource, resourceType])

  const getDefaultApiVersion = (kind: ResourceKind): string => {
    switch (kind) {
      case 'Deployment':
        return 'apps/v1'
      case 'Service':
      case 'ConfigMap':
      case 'Secret':
        return 'v1'
      default:
        return 'v1'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!resource || !onDelete) return

    if (window.confirm(`정말로 ${resource.metadata.name}을(를) 삭제하시겠습니까?`)) {
      setLoading(true)
      try {
        await onDelete(resource)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
  }

  const updateMetadata = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }))
  }

  const updateLabels = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        labels: {
          ...prev.metadata.labels,
          [key]: value
        }
      }
    }))
  }

  // const updateAnnotations = (key: string, value: string) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     metadata: {
  //       ...prev.metadata,
  //       annotations: {
  //         ...prev.metadata.annotations,
  //         [key]: value
  //       }
  //     }
  //   }))
  // }

  const updateData = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? '리소스 생성' : mode === 'edit' ? '리소스 편집' : '리소스 보기'} - {resourceType}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 *
                </label>
                <Input
                  value={formData.metadata.name}
                  onChange={(e) => updateMetadata('name', e.target.value)}
                  disabled={mode === 'view'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  네임스페이스 *
                </label>
                <Input
                  value={formData.metadata.namespace}
                  onChange={(e) => updateMetadata('namespace', e.target.value)}
                  disabled={mode === 'view'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API 버전
              </label>
              <Input
                value={formData.apiVersion}
                onChange={(e) => setFormData(prev => ({ ...prev, apiVersion: e.target.value }))}
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {/* 리소스별 특화 필드 */}
          {resourceType === 'Deployment' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Deployment 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    복제본 수
                  </label>
                  <Input
                    type="number"
                    value={formData.spec?.['replicas'] || 1}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      spec: { ...prev.spec, replicas: parseInt(e.target.value) || 1 }
                    }))}
                    disabled={mode === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이미지
                  </label>
                  <Input
                    value={formData.spec?.['template']?.['spec']?.['containers']?.[0]?.['image'] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      spec: {
                        ...prev.spec,
                        template: {
                          ...prev.spec?.['template'],
                          spec: {
                            ...prev.spec?.['template']?.['spec'],
                            containers: [{
                              ...prev.spec?.['template']?.['spec']?.['containers']?.[0],
                              name: 'main',
                              image: e.target.value
                            }]
                          }
                        }
                      }
                    }))}
                    disabled={mode === 'view'}
                    placeholder="nginx:latest"
                  />
                </div>
              </div>
            </div>
          )}

          {resourceType === 'Service' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service 설정</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입
                  </label>
                  <Select
                    value={formData.spec?.['type'] || 'ClusterIP'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      spec: { ...prev.spec, type: e.target.value }
                    }))}
                    disabled={mode === 'view'}
                  >
                    <option value="ClusterIP">ClusterIP</option>
                    <option value="NodePort">NodePort</option>
                    <option value="LoadBalancer">LoadBalancer</option>
                    <option value="ExternalName">ExternalName</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    포트
                  </label>
                  <Input
                    type="number"
                    value={formData.spec?.['ports']?.[0]?.['port'] || 80}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      spec: {
                        ...prev.spec,
                        ports: [{
                          port: parseInt(e.target.value) || 80,
                          targetPort: parseInt(e.target.value) || 80,
                          protocol: 'TCP'
                        }]
                      }
                    }))}
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
            </div>
          )}

          {(resourceType === 'ConfigMap' || resourceType === 'Secret') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{resourceType} 데이터</h3>
              <div className="space-y-2">
                {Object.entries(formData.data || {}).map(([key, value]) => (
                  <div key={key} className="flex space-x-2">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newData = { ...formData.data }
                        delete newData[key]
                        newData[e.target.value] = value
                        setFormData(prev => ({ ...prev, data: newData }))
                      }}
                      disabled={mode === 'view'}
                      placeholder="키"
                    />
                    <Input
                      value={value}
                      onChange={(e) => updateData(key, e.target.value)}
                      disabled={mode === 'view'}
                      placeholder="값"
                    />
                    {mode !== 'view' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newData = { ...formData.data }
                          delete newData[key]
                          setFormData(prev => ({ ...prev, data: newData }))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {mode !== 'view' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateData('', '')}
                  >
                    키-값 추가
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 라벨 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">라벨</h3>
            <div className="space-y-2">
              {Object.entries(formData.metadata.labels || {}).map(([key, value]) => (
                <div key={key} className="flex space-x-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newLabels = { ...formData.metadata.labels }
                      delete newLabels[key]
                      newLabels[e.target.value] = value
                      updateMetadata('labels', newLabels)
                    }}
                    disabled={mode === 'view'}
                    placeholder="키"
                  />
                  <Input
                    value={value}
                    onChange={(e) => updateLabels(key, e.target.value)}
                    disabled={mode === 'view'}
                    placeholder="값"
                  />
                  {mode !== 'view' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newLabels = { ...formData.metadata.labels }
                        delete newLabels[key]
                        updateMetadata('labels', newLabels)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {mode !== 'view' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateLabels('', '')}
                >
                  라벨 추가
                </Button>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            
            {mode === 'view' && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                삭제
              </Button>
            )}
            
            {mode !== 'view' && (
              <Button type="submit" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResourceModal
