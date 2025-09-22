import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { DashboardData } from '@/types'

// 상태 타입 정의
interface DashboardState {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
}

// 액션 타입 정의
type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: DashboardData | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }

// 리듀서
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_DATA':
      return { ...state, data: action.payload, isLoading: false, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

// 컨텍스트 타입 정의
interface DashboardContextType extends DashboardState {
  dashboardData: DashboardData | null
  refreshDashboardData: () => Promise<void>
  clearError: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

// Provider 컴포넌트
interface DashboardProviderProps {
  children: ReactNode
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = React.useReducer(dashboardReducer, {
    data: null,
    isLoading: true,
    error: null,
  })


  // 대시보드 데이터 가져오기
  const fetchDashboardData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // 실제 API 호출 대신 임시 데이터 생성 (나중에 실제 API로 교체)
      const mockData: DashboardData = {
        summary: {
          activeDeployments: 12,
          kubernetesResources: 45,
          mcpServers: 3,
          unresolvedAlerts: 2
        },
        clusterStatus: {
          clusterName: 'k-le-paas-cluster',
          status: 'healthy',
          nodeCount: 3,
          podCount: 12,
          cpuUsage: 45,
          memoryUsage: 67,
          networkIn: 125.5,
          networkOut: 89.2,
          lastUpdated: new Date().toISOString()
        },
        recentDeployments: {
          deployments: [
            {
              id: '1',
              name: 'frontend-app',
              status: 'running',
              branch: 'main',
              commit: 'abc123',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              author: 'developer@example.com'
            },
            {
              id: '2',
              name: 'backend-api',
              status: 'running',
              branch: 'main',
              commit: 'def456',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              author: 'developer@example.com'
            },
            {
              id: '3',
              name: 'database-migration',
              status: 'failed',
              branch: 'feature/db-update',
              commit: 'ghi789',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
              author: 'developer@example.com'
            }
          ]
        },
        resourceUsage: {
          cpu: {
            used: 2.5,
            total: 4.0,
            percentage: 62.5
          },
          memory: {
            used: 6.2,
            total: 8.0,
            percentage: 77.5
          },
          storage: {
            used: 45.8,
            total: 100.0,
            percentage: 45.8
          },
          network: {
            in: 125.5,
            out: 89.2
          },
          timestamp: new Date().toISOString()
        },
        alerts: {
          alerts: [
            {
              id: '1',
              title: '높은 CPU 사용률',
              message: 'CPU 사용률이 80%를 초과했습니다.',
              severity: 'warning',
              status: 'firing',
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              source: 'prometheus'
            },
            {
              id: '2',
              title: '메모리 부족',
              message: '메모리 사용률이 90%를 초과했습니다.',
              severity: 'critical',
              status: 'firing',
              timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              source: 'prometheus'
            },
            {
              id: '3',
              title: '배포 실패',
              message: 'frontend-app 배포가 실패했습니다.',
              severity: 'error',
              status: 'resolved',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              source: 'kubernetes'
            }
          ]
        },
        quickActions: {
          actions: [
            {
              id: 'deploy',
              title: '새 배포',
              description: '애플리케이션 배포',
              icon: 'plus',
              path: '/deployments/new',
              permissions: ['deployment_pipeline:create'],
              enabled: true
            },
            {
              id: 'rollback',
              title: '롤백',
              description: '이전 버전으로 복구',
              icon: 'refresh',
              path: '/deployments/rollback',
              permissions: ['deployment_pipeline:rollback'],
              enabled: true
            },
            {
              id: 'monitor',
              title: '모니터링',
              description: '시스템 상태 확인',
              icon: 'chart',
              path: '/monitoring',
              permissions: ['monitoring:view_dashboard'],
              enabled: true
            },
            {
              id: 'settings',
              title: '설정',
              description: '시스템 설정',
              icon: 'settings',
              path: '/settings',
              permissions: ['settings:read'],
              enabled: true
            }
          ]
        },
        mcpServers: {
          servers: [
            {
              id: '1',
              name: 'GitHub MCP',
              status: 'connected',
              url: 'https://github-mcp.example.com',
              lastConnected: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
              capabilities: ['git', 'repository', 'webhook']
            },
            {
              id: '2',
              name: 'Claude MCP',
              status: 'connected',
              url: 'https://claude-mcp.example.com',
              lastConnected: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
              capabilities: ['nlp', 'code-analysis', 'generation']
            },
            {
              id: '3',
              name: 'OpenAI MCP',
              status: 'disconnected',
              url: 'https://openai-mcp.example.com',
              lastConnected: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              capabilities: ['gpt', 'embeddings', 'moderation']
            }
          ],
          totalServers: 3,
          connectedServers: 2
        },
        settings: {
          refreshInterval: 60000,
          autoRefresh: true,
          theme: 'light',
          compactMode: false,
          showGrid: true
        }
      }
      
      dispatch({ type: 'SET_DATA', payload: mockData })
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.response?.data?.message || '대시보드 데이터를 불러오는데 실패했습니다.' 
      })
    }
  }

  // 에러 클리어
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // 대시보드 데이터 새로고침
  const refreshDashboardData = async () => {
    await fetchDashboardData()
  }

  // 초기 데이터 로드
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 주기적 새로고침 (1분마다)
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const value: DashboardContextType = {
    ...state,
    dashboardData: state.data,
    refreshDashboardData,
    clearError,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

// Hook
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}