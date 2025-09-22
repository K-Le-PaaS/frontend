import React, { useState, useEffect, useCallback } from 'react'
import { Input, SkeletonLoader, Tooltip } from '@/components'
import Button from '@/components/ui/Button'
import { Plus, Search, RefreshCw, Wifi, WifiOff, Info } from 'lucide-react'
import ResourceTable from '@/components/kubernetes/ResourceTable'
import ResourceModal from '@/components/kubernetes/ResourceModal'
import NaturalLanguageInput from '@/components/ui/NaturalLanguageInput'
import CommandHistory from '@/components/ui/CommandHistory'
import { kubernetesService } from '@/services/kubernetesService'
import { websocketService, KubernetesResourceUpdate } from '@/services/websocketService'
import { naturalLanguageService, NaturalLanguageCommand, CommandResponse } from '@/services/naturalLanguageService'
import { IntegrationTest } from '@/test-integration'
import {
  KubernetesResource,
  KubernetesContext,
  KubernetesNamespace,
  ResourceKind,
  CreateResourceRequest,
  UpdateResourceRequest
} from '@/types/kubernetes'

const Kubernetes: React.FC = () => {
  const [deployments, setDeployments] = useState<KubernetesResource[]>([])
  const [services, setServices] = useState<KubernetesResource[]>([])
  const [configMaps, setConfigMaps] = useState<KubernetesResource[]>([])
  const [secrets, setSecrets] = useState<KubernetesResource[]>([])
  const [contexts, setContexts] = useState<KubernetesContext[]>([])
  const [namespaces, setNamespaces] = useState<KubernetesNamespace[]>([])
  const [currentContext, setCurrentContext] = useState<string>('')
  const [currentNamespace, setCurrentNamespace] = useState<string>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [modalResourceType, setModalResourceType] = useState<ResourceKind>('Deployment')
  const [selectedResource, setSelectedResource] = useState<KubernetesResource | undefined>()

  // 자연어 명령 상태
  const [commandHistory, setCommandHistory] = useState<NaturalLanguageCommand[]>([])
  const [isProcessingCommand, setIsProcessingCommand] = useState(false)
  const [showCommandHistory, setShowCommandHistory] = useState(false)

  // 실시간 리소스 업데이트 처리
  const updateResourceList = useCallback((update: KubernetesResourceUpdate) => {
    const { resourceType, action, resource } = update
    
    switch (resourceType) {
      case 'Deployment':
        setDeployments(prev => {
          if (action === 'deleted') {
            return prev.filter(dep => dep.metadata.name !== resource.metadata.name)
          } else if (action === 'created') {
            return [...prev, resource]
          } else if (action === 'updated') {
            return prev.map(dep => 
              dep.metadata.name === resource.metadata.name ? resource : dep
            )
          }
          return prev
        })
        break
        
      case 'Service':
        setServices(prev => {
          if (action === 'deleted') {
            return prev.filter(svc => svc.metadata.name !== resource.metadata.name)
          } else if (action === 'created') {
            return [...prev, resource]
          } else if (action === 'updated') {
            return prev.map(svc => 
              svc.metadata.name === resource.metadata.name ? resource : svc
            )
          }
          return prev
        })
        break
        
      case 'ConfigMap':
        setConfigMaps(prev => {
          if (action === 'deleted') {
            return prev.filter(cm => cm.metadata.name !== resource.metadata.name)
          } else if (action === 'created') {
            return [...prev, resource]
          } else if (action === 'updated') {
            return prev.map(cm => 
              cm.metadata.name === resource.metadata.name ? resource : cm
            )
          }
          return prev
        })
        break
        
      case 'Secret':
        setSecrets(prev => {
          if (action === 'deleted') {
            return prev.filter(secret => secret.metadata.name !== resource.metadata.name)
          } else if (action === 'created') {
            return [...prev, resource]
          } else if (action === 'updated') {
            return prev.map(secret => 
              secret.metadata.name === resource.metadata.name ? resource : secret
            )
          }
          return prev
        })
        break
    }
  }, [])

  // WebSocket 연결 및 실시간 업데이트 설정
  useEffect(() => {
    let cleanup: (() => void) | undefined

    const connectWebSocket = async () => {
      try {
        await websocketService.connect()
        setWsConnected(true)
        
        // Kubernetes 리소스 업데이트 구독
        websocketService.subscribeToKubernetesUpdates(currentNamespace)
        
        // 리소스 업데이트 리스너 등록
        const handleResourceUpdate = (update: KubernetesResourceUpdate) => {
          console.log('Resource update received:', update)
          setLastUpdate(new Date())
          
          // 현재 네임스페이스와 컨텍스트의 리소스만 업데이트
          if (update.namespace === currentNamespace) {
            updateResourceList(update)
          }
        }
        
        websocketService.onResourceUpdate(handleResourceUpdate)
        
        cleanup = () => {
          websocketService.offResourceUpdate(handleResourceUpdate)
          websocketService.unsubscribeFromKubernetesUpdates(currentNamespace)
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        setWsConnected(false)
      }
    }

    connectWebSocket()

    // 명령 히스토리 로드
    loadCommandHistory()

    return () => {
      if (cleanup) cleanup()
      websocketService.disconnect()
    }
  }, [currentNamespace, updateResourceList])

  // WebSocket 연결 상태 모니터링
  useEffect(() => {
    const handleConnected = () => setWsConnected(true)
    const handleDisconnected = () => setWsConnected(false)
    
    websocketService.on('connected', handleConnected)
    websocketService.on('disconnected', handleDisconnected)
    
    return () => {
      websocketService.off('connected', handleConnected)
      websocketService.off('disconnected', handleDisconnected)
    }
  }, [])

  // 초기 로드
  useEffect(() => {
    loadInitialData()
  }, [])

  // 컨텍스트나 네임스페이스 변경 시 리소스 다시 로드
  useEffect(() => {
    if (currentContext || currentNamespace) {
      loadResources()
    }
  }, [currentContext, currentNamespace])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [contextsData, namespacesData] = await Promise.all([
        kubernetesService.getContexts(),
        kubernetesService.getNamespaces()
      ])
      
      // 데이터 유효성 검사
      if (Array.isArray(contextsData)) {
        setContexts(contextsData)
        
        // 현재 컨텍스트 설정
        const currentCtx = contextsData.find(ctx => ctx.current)
        if (currentCtx) {
          setCurrentContext(currentCtx.name)
        }
      } else {
        console.warn('Invalid contexts data:', contextsData)
        setContexts([])
      }
      
      if (Array.isArray(namespacesData)) {
        setNamespaces(namespacesData)
      } else {
        console.warn('Invalid namespaces data:', namespacesData)
        setNamespaces([])
      }
      
      await loadResources()
    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      setLoading(true)
      const [deploymentsData, servicesData, configMapsData, secretsData] = await Promise.all([
        kubernetesService.getDeployments(currentNamespace, currentContext),
        kubernetesService.getServices(currentNamespace, currentContext),
        kubernetesService.getConfigMaps(currentNamespace, currentContext),
        kubernetesService.getSecrets(currentNamespace, currentContext)
      ])
      
      setDeployments(deploymentsData.resources)
      setServices(servicesData.resources)
      setConfigMaps(configMapsData.resources)
      setSecrets(secretsData.resources)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResource = (resourceType: ResourceKind) => {
    setModalResourceType(resourceType)
    setModalMode('create')
    setSelectedResource(undefined)
    setModalOpen(true)
  }

  const handleViewResource = (resource: KubernetesResource) => {
    setModalResourceType(resource.kind as ResourceKind)
    setModalMode('view')
    setSelectedResource(resource)
    setModalOpen(true)
  }

  const handleEditResource = (resource: KubernetesResource) => {
    setModalResourceType(resource.kind as ResourceKind)
    setModalMode('edit')
    setSelectedResource(resource)
    setModalOpen(true)
  }

  // 자연어 명령 처리 함수들
  const handleCommandSubmit = async (command: string) => {
    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 명령 유효성 검사
    const validation = naturalLanguageService.validateCommand(command)
    if (!validation.isValid) {
      alert(validation.message)
      return
    }

    // 명령 히스토리에 추가
    const newCommand: NaturalLanguageCommand = {
      id: commandId,
      command,
      timestamp: new Date(),
      status: 'pending'
    }
    
    setCommandHistory(prev => [newCommand, ...prev])
    setIsProcessingCommand(true)

    try {
      // 명령 파싱
      const parsed = naturalLanguageService.parseCommand(command)
      console.log('파싱된 명령:', parsed)

      // 백엔드로 명령 전송
      const response: CommandResponse = await naturalLanguageService.processCommand(command)
      
      // 명령 상태 업데이트
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { 
                ...cmd, 
                status: response.success ? 'completed' : 'failed',
                result: response.data,
                error: response.error
              } as NaturalLanguageCommand
            : cmd
        )
      )

      if (response.success) {
        // 성공 시 리소스 새로고침
        await loadResources()
        alert(`✅ ${response.message}`)
      } else {
        alert(`❌ ${response.message}`)
      }
    } catch (error) {
      console.error('명령 처리 실패:', error)
      
      // 명령 상태를 실패로 업데이트
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { 
                ...cmd, 
                status: 'failed',
                error: error instanceof Error ? error.message : '알 수 없는 오류'
              }
            : cmd
        )
      )
      
      alert('❌ 명령 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessingCommand(false)
    }
  }

  const handleCommandClear = () => {
    setCommandHistory([])
  }

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    alert('명령이 클립보드에 복사되었습니다.')
  }

  const loadCommandHistory = async () => {
    try {
      const history = await naturalLanguageService.getCommandHistory(20)
      setCommandHistory(history)
    } catch (error) {
      console.error('명령 히스토리 로드 실패:', error)
    }
  }

  const handleDeleteResource = async (resource: KubernetesResource) => {
    try {
      await kubernetesService.deleteResource(
        resource.kind as ResourceKind,
        resource.metadata.name,
        resource.metadata.namespace,
        currentContext
      )
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource')
    }
  }

  const handleSaveResource = async (data: CreateResourceRequest | UpdateResourceRequest) => {
    try {
      if (modalMode === 'create') {
        await kubernetesService.createResource(modalResourceType, data as CreateResourceRequest, currentNamespace)
      } else if (modalMode === 'edit' && selectedResource) {
        await kubernetesService.updateResource(
          modalResourceType,
          selectedResource.metadata.name,
          data as UpdateResourceRequest,
          currentNamespace
        )
      }
      await loadResources()
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save resource')
    }
  }

  const handleContextChange = (contextName: string) => {
    setCurrentContext(contextName)
  }

  const handleNamespaceChange = (namespace: string) => {
    setCurrentNamespace(namespace)
  }

  const handleRunIntegrationTest = async () => {
    try {
      console.log('통합 테스트 시작...')
      const test = IntegrationTest.getInstance()
      await test.runAllTests()
    } catch (error) {
      console.error('통합 테스트 실행 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kubernetes 리소스</h1>
            <p className="text-gray-600">클러스터 리소스 관리</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
              <SkeletonLoader variant="text" width="60%" height="20px" className="mb-4" />
              <SkeletonLoader variant="text" width="40%" height="16px" />
            </div>
          ))}
        </div>
        
        <div className="space-y-4">
          <SkeletonLoader variant="card" height="200px" />
          <SkeletonLoader variant="card" height="200px" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text">Kubernetes 리소스</h1>
              <p className="text-gray-600 text-lg mt-2">클러스터 리소스 관리 및 모니터링</p>
            </div>
            
            {/* 상태 표시 */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${wsConnected ? 'bg-success-100' : 'bg-error-100'}`}>
                  {wsConnected ? (
                    <Wifi className="h-5 w-5 text-success-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-error-600" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${wsConnected ? 'text-success-700' : 'text-error-700'}`}>
                    {wsConnected ? '실시간 연결됨' : '연결 끊김'}
                  </p>
                  <p className="text-sm text-gray-500">WebSocket 상태</p>
                </div>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    마지막 업데이트: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleCreateResource('Deployment')}
              variant="primary"
              size="lg"
              className="hover-glow"
            >
              <Plus className="h-5 w-5" />
              Deployment
            </Button>
            <Button 
              onClick={() => handleCreateResource('Service')}
              variant="success"
              size="lg"
              className="hover-glow"
            >
              <Plus className="h-5 w-5" />
              Service
            </Button>
            <Button 
              onClick={() => handleCreateResource('ConfigMap')}
              variant="warning"
              size="lg"
              className="hover-glow"
            >
              <Plus className="h-5 w-5" />
              ConfigMap
            </Button>
            <Button 
              onClick={() => handleCreateResource('Secret')}
              variant="outline"
              size="lg"
              className="hover-glow"
            >
              <Plus className="h-5 w-5" />
              Secret
            </Button>
          </div>
        </div>

        {/* 자연어 명령 인터페이스 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NaturalLanguageInput
              onCommandSubmit={handleCommandSubmit}
              onCommandClear={handleCommandClear}
              isLoading={isProcessingCommand}
              placeholder="자연어로 명령을 입력하세요... (예: 'nginx deployment 생성해줘', '모든 pod 상태 확인해줘')"
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => setShowCommandHistory(!showCommandHistory)}
              variant={showCommandHistory ? "primary" : "outline"}
              className="w-full"
            >
              {showCommandHistory ? '히스토리 숨기기' : '명령 히스토리'}
            </Button>
            
            <Button
              onClick={loadCommandHistory}
              variant="ghost"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              히스토리 새로고침
            </Button>
          </div>
        </div>

        {/* 명령 히스토리 */}
        {showCommandHistory && (
          <CommandHistory
            commands={commandHistory}
            onRefresh={loadCommandHistory}
            onClear={handleCommandClear}
            onCopyCommand={handleCopyCommand}
          />
        )}

        {/* 컨트롤 패널 */}
        <div className="card-elevated">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-primary-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="리소스 검색..."
                  className="pl-12 h-12 w-full"
                />
              </div>
            </div>
            
            {/* 컨텍스트 선택 */}
            <div className="min-w-[200px]">
              <select
                value={currentContext}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleContextChange(e.target.value)}
                className="input-field h-12 w-full"
              >
                <option value="">컨텍스트 선택</option>
                {contexts.map(ctx => (
                  <option key={ctx.name} value={ctx.name}>
                    {ctx.name} {ctx.current ? '(현재)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 네임스페이스 선택 */}
            <div className="min-w-[200px]">
              <select
                value={currentNamespace}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleNamespaceChange(e.target.value)}
                className="input-field h-12 w-full"
              >
                {namespaces.map(ns => (
                  <option key={ns.metadata.name} value={ns.metadata.name}>
                    {ns.metadata.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <Tooltip content="리소스 목록을 새로고침합니다">
                <Button 
                  variant="outline" 
                  onClick={loadResources} 
                  icon={<RefreshCw className="h-5 w-5" />}
                  size="lg"
                  className="h-12 px-6"
                >
                  새로고침
                </Button>
              </Tooltip>
              
              <Tooltip content="백엔드와 프론트엔드 연동을 테스트합니다">
                <Button 
                  variant="primary" 
                  onClick={handleRunIntegrationTest} 
                  icon={<Info className="h-5 w-5" />}
                  size="lg"
                  className="h-12 px-6"
                >
                  통합 테스트
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 리소스 테이블들 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ResourceTable
              title="Deployments"
              resourceType="Deployment"
              resources={deployments}
              loading={loading}
              error={error}
              onView={handleViewResource}
              onEdit={handleEditResource}
              onDelete={handleDeleteResource}
              onRefresh={loadResources}
            />

            <ResourceTable
              title="Services"
              resourceType="Service"
              resources={services}
              loading={loading}
              error={error}
              onView={handleViewResource}
              onEdit={handleEditResource}
              onDelete={handleDeleteResource}
              onRefresh={loadResources}
            />
          </div>
          
          <div className="space-y-6">
            <ResourceTable
              title="ConfigMaps"
              resourceType="ConfigMap"
              resources={configMaps}
              loading={loading}
              error={error}
              onView={handleViewResource}
              onEdit={handleEditResource}
              onDelete={handleDeleteResource}
              onRefresh={loadResources}
            />

            <ResourceTable
              title="Secrets"
              resourceType="Secret"
              resources={secrets}
              loading={loading}
              error={error}
              onView={handleViewResource}
              onEdit={handleEditResource}
              onDelete={handleDeleteResource}
              onRefresh={loadResources}
            />
          </div>
        </div>

        {/* 리소스 모달 */}
        <ResourceModal
          open={modalOpen}
          mode={modalMode}
          resourceType={modalResourceType}
          resource={selectedResource || undefined}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveResource}
          onDelete={handleDeleteResource}
        />
      </div>
    </div>
  )
}

export default Kubernetes
