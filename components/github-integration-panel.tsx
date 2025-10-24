"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useGlobalWebSocket } from "@/hooks/use-global-websocket"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { RealtimeDeploymentMonitor } from "./realtime-deployment-monitor"
import {
  Github,
  GitBranch,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Settings,
  ExternalLink,
  Play,
  AlertTriangle,
  Zap,
  RefreshCw,
} from "lucide-react"

const UI_TEXT = {
  pullRequests: {
    title: "Pull Requests",
    description: "Review and manage pull requests",
    viewPR: "View PR",
    deployPreview: "Deploy Preview",
    loading: "Loading pull requests...",
    noPRs: "No pull requests found",
    status: {
      open: "Open",
      merged: "Merged", 
      closed: "Closed"
    }
  },
  repositories: {
    title: "Connected Repositories",
    description: "Manage your GitHub repository integrations",
    autoDeploy: "Auto Deploy",
    webhooks: "Webhooks",
    connection: "Connection",
    configured: "Configured",
    notSet: "Not Set",
    connected: "Connected",
    disconnected: "Disconnected",
    viewOnGitHub: "View on GitHub",
    configure: "Configure",
    triggerDeploy: "Trigger Deploy",
    active: "활성",
    inactive: "비활성"
  }
}

interface Repository {
  id: string
  name: string
  fullName: string
  connected: boolean
  lastSync: Date
  branch: string
  status: "active" | "inactive" | "error"
  autoDeployEnabled: boolean
  webhookConfigured: boolean
  htmlUrl?: string
}

interface PullRequest {
  id: string
  number: number
  title: string
  author: string
  status: "open" | "merged" | "closed"
  branch: string
  targetBranch: string
  createdAt: Date
  ciStatus: "pending" | "success" | "failure"
  deploymentStatus: "pending" | "deployed" | "failed" | null
  htmlUrl?: string
  deploymentUrl?: string
}

interface DeploymentHistory {
  id: number
  user_id: string
  repository: string
  commit: {
    sha: string
    short_sha: string
    message: string
    author: string
    url?: string
  }
  status: "running" | "success" | "failed"
  stages: {
    sourcecommit: {
      status: "success" | "failed" | null
      duration: number | null
    }
    sourcebuild: {
      status: "success" | "failed" | null
      duration: number | null
    }
    sourcedeploy: {
      status: "success" | "failed" | null
      duration: number | null
    }
  }
  image: {
    name: string | null
    tag: string | null
    url: string | null
  }
  cluster: {
    id: string | null
    name: string | null
    namespace: string | null
  }
  timing: {
    started_at: string
    completed_at: string | null
    total_duration: number | null
  }
  error: {
    message: string | null
    stage: string | null
  } | null
  auto_deploy_enabled: boolean
  created_at: string
  updated_at: string
}

interface Pipeline {
  id: string
  repository: string
  branch: string
  commit?: string
  status: "running" | "success" | "failed" | "cancelled" | "completed" | "pending" | "unknown"
  startedAt: Date
  duration?: number
  stages?: {
    sourcecommit: {
      status: "success" | "failed" | null
      duration: number | null
    }
    sourcebuild: {
      status: "success" | "failed" | null
      duration: number | null
    }
    sourcedeploy: {
      status: "success" | "failed" | null
      duration: number | null
    }
  }
  timing?: {
    started_at: string
    completed_at: string | null
    total_duration: number | null
  }
  error?: {
    message: string
    stage: string
  }
  auto_deploy_enabled?: boolean
  workflowName?: string
  actor?: string
  runNumber?: number
  event?: string
  conclusion?: string
  htmlUrl?: string
  logsUrl?: string
  updatedAt?: Date
  headCommit?: {
    id: string
    message: string
    author: string
  }
}

interface GitHubIntegrationPanelProps {
  onNavigateToPipelines?: () => void
  initialTab?: string
}

export function GitHubIntegrationPanel({ onNavigateToPipelines, initialTab = "repositories" }: GitHubIntegrationPanelProps = {}) {
  // slackConnected는 DB 조회로 최종 결정
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [repos, setRepos] = useState<Repository[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(initialTab)
  
  // 사용자 인증 정보 가져오기
  const { user } = useAuth()
  const { toast } = useToast()
  console.log("GitHubIntegrationPanel: user object:", user)
  console.log("GitHubIntegrationPanel: user.id:", user?.id)
  console.log("GitHubIntegrationPanel: user.provider:", user?.provider)
  
  // 사용자 ID 매핑: 우선 provider_id(실제 고유 ID) → id → provider(최후수단)
  const userId = (user as any)?.provider_id || user?.id || user?.provider
  console.log("GitHubIntegrationPanel: Final userId for WebSocket:", userId)
  
  // 사용자 인증 상태 확인
  if (!user) {
    console.warn("User not authenticated, WebSocket connection will not be established")
  }
  
  // WebSocket for real-time updates (진행 상황만, 자동 목록 새로고침 제외)
  // 사용자 인증이 완료된 경우에만 WebSocket 연결
  
  const { isConnected, sendMessage } = useGlobalWebSocket({
    userId: user ? userId : undefined, // 사용자 인증된 경우에만 WebSocket 연결
    onMessage: (message) => {
      console.log("GitHubIntegrationPanel received WebSocket message:", message)
      console.log("Message type:", message.type)
      
      // 실시간 진행 상황 업데이트는 유지 (자동 목록 새로고침 제외)
      // WebSocket 메시지는 개별 디플로이 모니터에서 자동으로 처리됨
      // 별도의 전달 로직이 필요하지 않음 (GlobalWebSocketManager가 자동으로 모든 구독자에게 전달)
      
      // 자동 목록 새로고침 제거 - 수동 리프레시 버튼만 사용
      // deployment_started, stage_progress 등의 메시지로 자동 새로고침하지 않음
    }
  })
  
  // 강제 새로고침 함수 (모든 리포지토리 확인)
  const handleForceRefreshAll = useCallback(async () => {
    if (!repos || repos.length === 0) return

    console.log('Force refreshing all deployment histories')
    
    for (const repo of repos) {
      try {
        console.log('Refreshing for repo:', repo.fullName)
        const data = await apiClient.getDeploymentHistories(
          repo.fullName,
          undefined, // 모든 상태의 배포 가져오기
          20,
          0
        ) as any
        
        console.log(`Deployment data for ${repo.fullName}:`, data)
        
        if (data.deployments && data.deployments.length > 0) {
          console.log(`Found ${data.deployments.length} deployments for ${repo.fullName}`)
          // 첫 번째 리포지토리에서 배포를 찾았으면 해당 리포지토리로 설정
          setSelectedDeploymentRepository(repo.fullName)
          break
        }
      } catch (error) {
        console.error(`Error refreshing ${repo.fullName}:`, error)
      }
    }
  }, [repos])

  // 폴링 기능 제거됨 - 수동 리프레시 버튼 사용

  // Fetch deployment histories function
  const handleRefreshDeploymentHistories = useCallback(async () => {
    if (!repos || repos.length === 0) return

    try {
      setDeploymentLoading(true)
      setDeploymentError(null)
      
      // selectedDeploymentRepository가 없으면 첫 번째 리포지토리 사용
      const targetRepository = selectedDeploymentRepository || repos[0]?.fullName
      console.log('Refreshing deployment histories for repository:', targetRepository)
      console.log('selectedDeploymentRepository:', selectedDeploymentRepository)
      console.log('repos:', repos)
      
      if (!targetRepository) {
        console.log('No target repository available')
        return
      }
      
      const data = await apiClient.getDeploymentHistories(
        targetRepository,
        deploymentStatusFilter === "all" ? undefined : deploymentStatusFilter,
        20,
        0
      ) as any
      console.log('Deployment histories API response:', data)
      
      const mapped: DeploymentHistory[] = (data.deployments || []).map((deployment: any) => ({
        id: deployment.id,
        repository: deployment.repository,
        status: deployment.status,
        stages: deployment.stages || {
          sourcecommit: { status: null, duration: null },
          sourcebuild: { status: null, duration: null },
          sourcedeploy: { status: null, duration: null }
        },
        timing: deployment.timing || {
          started_at: deployment.timing?.started_at || new Date().toISOString(),
          completed_at: deployment.timing?.completed_at || null,
          total_duration: deployment.timing?.total_duration || null
        },
        error: deployment.error,
        auto_deploy_enabled: deployment.auto_deploy_enabled || false,
        commit: deployment.commit || {
          sha: "",
          short_sha: "",
          message: "",
          author: "",
          url: ""
        },
        image: deployment.image || {
          name: "",
          tag: "",
          url: ""
        },
        cluster: deployment.cluster || {
          id: "",
          name: "",
          namespace: ""
        }
      }))
      
      console.log('Mapped deployment histories:', mapped)
      setDeploymentHistories(mapped)
    } catch (error: any) {
      console.error('Failed to refresh deployment histories:', error)
      setDeploymentError(error?.message || "Failed to load deployment histories")
    } finally {
      setDeploymentLoading(false)
    }
  }, [repos])
  
  // Pull Requests state
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [prLoading, setPrLoading] = useState(false)
  const [prError, setPrError] = useState<string | null>(null)
  const [selectedRepository, setSelectedRepository] = useState<string | undefined>(undefined)
  const [prStatusFilter, setPrStatusFilter] = useState<"all" | "open" | "closed" | "merged">("all")
  
  // Deployment Histories state
  const [deploymentHistories, setDeploymentHistories] = useState<DeploymentHistory[]>([])
  const [deploymentLoading, setDeploymentLoading] = useState(false)
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const [selectedDeploymentRepository, setSelectedDeploymentRepository] = useState<string | undefined>(undefined)

  const [deploymentStatusFilter, setDeploymentStatusFilter] = useState<"all" | "running" | "success" | "failed">("all")
  const [refreshing, setRefreshing] = useState(false)
  const [connectingSlack, setConnectingSlack] = useState(false)
  const [slackConnected, setSlackConnected] = useState(false)
  
  // Legacy Pipelines state (for backward compatibility)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const [selectedPipelineRepository, setSelectedPipelineRepository] = useState<string | undefined>(undefined)

  const handleConnectSlack = useCallback(async () => {
    try {
      setConnectingSlack(true)
      // redirectUri를 전달하지 않으면 서버 설정(KLEPAAS_SLACK_REDIRECT_URI)을 사용
      const data: any = await apiClient.getSlackAuthUrl()
      const authUrl = (data && (data.auth_url || data.url || data.authUrl)) as string | undefined
      if (authUrl) {
        window.location.href = authUrl
      } else {
        alert('Slack 인증 URL 생성에 실패했습니다.')
      }
    } catch (e) {
      console.error('Failed to get Slack auth url', e)
      alert('Slack 연동 중 오류가 발생했습니다.')
    } finally {
      setConnectingSlack(false)
    }
  }, [])

  // Filtered PRs based on status filter
  const filteredPullRequests = pullRequests.filter(pr => {
    if (prStatusFilter === "all") return true
    return pr.status === prStatusFilter
  })

  // Filtered deployment histories based on status filter
  const filteredDeploymentHistories = deploymentHistories.filter(deployment => {
    if (deploymentStatusFilter === "all") return true
    return deployment.status === deploymentStatusFilter
  })

  useEffect(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined
    const justConnected = searchParams?.get('slack') === 'connected'
    if (justConnected) {
      try {
        // 간단한 토스트 표시: 브라우저 기본 alert로 대체 (원하면 shadcn Toast로 변경 가능)
        // eslint-disable-next-line no-alert
        alert('Slack 연동이 완료되었습니다.')
        // 쿼리스트링 제거
        const url = new URL(window.location.href)
        url.searchParams.delete('slack')
        window.history.replaceState({}, '', url.toString())
      } catch {}
    }
    // DB 상태 조회
    ;(async () => {
      try {
        const status: any = await apiClient.getSlackStatus()
        setSlackConnected(Boolean(status?.connected))
      } catch {
        setSlackConnected(false)
      }
    })()
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        // Backend should return list of integrations
        const data = await apiClient.getProjectIntegrations()
        if (!mounted) return
        // Map backend rows to Repository view model
        const mapped: Repository[] = (Array.isArray(data) ? data : []).map((r: any, idx: number) => ({
          id: String(r.id ?? idx),
          name: r.repo ?? r.name ?? "",
          fullName: r.github_full_name ?? `${r.owner ?? r.github_owner}/${r.repo ?? r.github_repo}`,
          connected: true,
          lastSync: r.updated_at ? new Date(r.updated_at) : new Date(),
          branch: r.branch ?? "main",
          status: (r.auto_deploy_enabled ? "active" : "inactive") as Repository["status"],
          autoDeployEnabled: !!r.auto_deploy_enabled,
          webhookConfigured: Boolean(r.github_webhook_secret),
        }))
        // Debug: log exact count and payload
        console.log('[GitHubIntegrationPanel] integrations.length =', mapped.length, mapped)
        setRepos(mapped)
      } catch (e: any) {
        setError(e?.message || "Failed to load integrations")
        setRepos(null)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Pull Requests useEffect
  useEffect(() => {
    if (!repos || repos.length === 0) return // Don't fetch if no repos loaded yet

    const fetchPullRequests = async () => {
      try {
        setPrLoading(true)
        setPrError(null)
        console.log('Fetching pull requests for repository:', selectedRepository)
        const data = await apiClient.getPullRequests(selectedRepository)
        console.log('Pull requests API response:', data)
        console.log('Raw PR data structure:', JSON.stringify(data, null, 2))
        
        // 백엔드 응답 구조에 맞게 처리
        let allPullRequests: any[] = []
        const responseData = data as any
        if (responseData && responseData.repositories && Array.isArray(responseData.repositories)) {
          for (const repo of responseData.repositories) {
            if (repo.pullRequests && Array.isArray(repo.pullRequests)) {
              allPullRequests = allPullRequests.concat(repo.pullRequests)
            }
          }
        }
        
        const mapped: PullRequest[] = allPullRequests.map((pr: any) => ({
          id: String(pr.id),
          number: pr.number,
          title: pr.title,
          author: pr.user?.login || pr.author,
          status: pr.status === "open" ? "open" : pr.merged_at ? "merged" : "closed",
          branch: pr.head?.ref || pr.branch || "main",
          targetBranch: pr.base?.ref || "main",
          createdAt: pr.created_at ? new Date(pr.created_at) : new Date(),
          ciStatus: pr.ciStatus || "pending",
          deploymentStatus: null, // TODO: Get actual deployment status
          htmlUrl: pr.htmlUrl,  // 🔧 수정: pr.html_url → pr.htmlUrl
          deploymentUrl: pr.deploymentUrl  // 🔧 수정: pr.deployment_url → pr.deploymentUrl
        }))
        setPullRequests(mapped)
      } catch (error: any) {
        console.error('Failed to fetch pull requests:', error)
        setPrError(error?.message || "Failed to load pull requests")
      } finally {
        setPrLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchPullRequests, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [selectedRepository]) // 🔧 최적화: repos 의존성 제거

  // Deployment Histories useEffect
  useEffect(() => {
    if (!repos || repos.length === 0) return

    const fetchDeploymentHistories = async () => {
      try {
        setDeploymentLoading(true)
        setDeploymentError(null)
        console.log('Fetching deployment histories for repository:', selectedDeploymentRepository)
        
        const data = await apiClient.getDeploymentHistories(
          selectedDeploymentRepository,
          deploymentStatusFilter === "all" ? undefined : deploymentStatusFilter,
          20,
          0
        ) as any
        console.log('Deployment histories API response:', data)
        
        const mapped: DeploymentHistory[] = (data.deployments || []).map((deployment: any) => ({
          id: deployment.id,
          user_id: deployment.user_id,
          repository: deployment.repository,
          commit: {
            sha: deployment.github_commit_sha || "",
            short_sha: deployment.github_commit_sha?.substring(0, 7) || "",
            message: deployment.github_commit_message || "",
            author: deployment.github_commit_author || "",
            url: deployment.github_commit_url
          },
          status: deployment.status,
          stages: {
            sourcecommit: {
              status: deployment.sourcecommit_status,
              duration: deployment.sourcecommit_duration
            },
            sourcebuild: {
              status: deployment.sourcebuild_status,
              duration: deployment.sourcebuild_duration
            },
            sourcedeploy: {
              status: deployment.sourcedeploy_status,
              duration: deployment.sourcedeploy_duration
            }
          },
          image: {
            name: deployment.image_name,
            tag: deployment.image_tag,
            url: deployment.image_name && deployment.image_tag 
              ? `${deployment.image_name}:${deployment.image_tag}` 
              : null
          },
          cluster: {
            id: deployment.cluster_id,
            name: deployment.cluster_name,
            namespace: deployment.namespace
          },
          timing: {
            started_at: deployment.started_at,
            completed_at: deployment.completed_at,
            total_duration: deployment.total_duration
          },
          error: deployment.error_message ? {
            message: deployment.error_message,
            stage: deployment.error_stage
          } : null,
          auto_deploy_enabled: deployment.auto_deploy_enabled,
          created_at: deployment.created_at,
          updated_at: deployment.updated_at
        }))
        
        setDeploymentHistories(mapped)
      } catch (e: any) {
        console.error('Failed to fetch deployment histories:', e)
        setDeploymentError(e?.message || "Failed to load deployment histories")
        setDeploymentHistories([])
      } finally {
        setDeploymentLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchDeploymentHistories, 500)
    return () => clearTimeout(timeoutId)
  }, [selectedDeploymentRepository, deploymentStatusFilter])

  // Pipelines useEffect
  useEffect(() => {
    if (!repos || repos.length === 0) return // Don't fetch if no repos loaded yet

    const fetchPipelines = async () => {
      try {
        setPipelineLoading(true)
        setPipelineError(null)
        console.log('Fetching pipelines for repository:', selectedPipelineRepository)
        const data = await apiClient.getPipelines(selectedPipelineRepository)
        console.log('Pipelines API response:', data)
        
        // 백엔드 응답 구조에 맞게 처리
        let allPipelines: any[] = []
        const responseData = data as any
        console.log('Full API response:', responseData)
        
        // 새로운 배포 히스토리 API 응답 구조 처리
        if (responseData && responseData.deployments && Array.isArray(responseData.deployments)) {
          allPipelines = responseData.deployments
        }
        // 기존 repositories 구조도 지원 (하위 호환성)
        else if (responseData && responseData.repositories && Array.isArray(responseData.repositories)) {
          for (const repo of responseData.repositories) {
            if (repo.pipelines && Array.isArray(repo.pipelines)) {
              allPipelines = allPipelines.concat(repo.pipelines)
            }
          }
        }
        
        const mapped: Pipeline[] = allPipelines.map((pipeline: any) => {
          // 새로운 배포 히스토리 구조인지 확인
          if (pipeline.repository && typeof pipeline.repository === 'string' && pipeline.repository.includes('/')) {
            // 새로운 배포 히스토리 구조
            console.log('DEBUG: Processing pipeline with status:', pipeline.status)
            const mappedStatus = pipeline.status === "success" ? "completed" : 
                      pipeline.status === "running" ? "running" :
                      pipeline.status === "pending" ? "pending" : 
                      pipeline.status === "failed" ? "failed" : 
                      pipeline.status === "completed" ? "completed" : "unknown"
            console.log('DEBUG: Mapped status:', mappedStatus)
            return {
              id: String(pipeline.id),
              repository: pipeline.repository,
              branch: pipeline.commit?.sha ? pipeline.commit.sha.substring(0, 7) : "main",
              status: mappedStatus,
              workflowName: "Deployment Pipeline",
              actor: pipeline.commit?.author || "system",
              runNumber: pipeline.id,
              event: "deployment",
              conclusion: pipeline.status,
              htmlUrl: pipeline.commit?.url || "#",
              logsUrl: pipeline.logs_url,
              startedAt: pipeline.timing?.started_at ? new Date(pipeline.timing.started_at) : new Date(),
              updatedAt: pipeline.updated_at ? new Date(pipeline.updated_at) : new Date(),
              duration: pipeline.timing?.total_duration || 0,
              headCommit: {
                id: pipeline.commit?.sha || "",
                message: pipeline.commit?.message || "",
                author: pipeline.commit?.author || "unknown"
              },
              stages: pipeline.stages || {
                sourcecommit: { status: null, duration: null },
                sourcebuild: { status: null, duration: null },
                sourcedeploy: { status: null, duration: null }
              },
              timing: pipeline.timing,
              error: pipeline.error,
              auto_deploy_enabled: pipeline.auto_deploy_enabled
            }
          } else {
            // 기존 GitHub Actions 구조
            return {
              id: String(pipeline.id),
              repository: typeof pipeline.repository === 'string' 
                ? pipeline.repository 
                : pipeline.repository?.name || "unknown",
              branch: pipeline.head_branch || "main",
              status: pipeline.status === "completed" ? "completed" : 
                      pipeline.status === "in_progress" ? "running" :
                      pipeline.status === "queued" ? "pending" : "unknown",
              workflowName: pipeline.workflowName || "Unknown Workflow",
              actor: pipeline.actor?.login || "unknown",
              runNumber: pipeline.run_number || 0,
              event: pipeline.event || "push",
              conclusion: pipeline.conclusion,
              htmlUrl: pipeline.html_url,
              logsUrl: pipeline.logs_url,
              startedAt: pipeline.started_at ? new Date(pipeline.started_at) : new Date(),
              updatedAt: pipeline.updated_at ? new Date(pipeline.updated_at) : new Date(),
              duration: pipeline.run_duration_ms ? Math.round(pipeline.run_duration_ms / 1000) : 0,
              headCommit: {
                id: pipeline.head_commit?.id || "",
                message: pipeline.head_commit?.message || "",
                author: pipeline.head_commit?.author?.name || "unknown"
              }
            }
          }
        })
        console.log('Mapped pipelines:', mapped)
        setPipelines(mapped)
      } catch (error: any) {
        console.error('Failed to fetch pipelines:', error)
        setPipelineError(error?.message || "Failed to load pipelines")
      } finally {
        setPipelineLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchPipelines, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [selectedPipelineRepository]) // 🔧 최적화: repos 의존성 제거

  // 수동 새로고침: 파이프라인 목록도 강제 갱신
  const handleRefreshPipelines = useCallback(async () => {
    if (!repos || repos.length === 0) return
    try {
      setPipelineLoading(true)
      setPipelineError(null)
      const data = await apiClient.getPipelines(selectedPipelineRepository)
      let allPipelines: any[] = []
      const responseData = data as any
      if (responseData && responseData.deployments && Array.isArray(responseData.deployments)) {
        allPipelines = responseData.deployments
      } else if (responseData && responseData.repositories && Array.isArray(responseData.repositories)) {
        for (const repo of responseData.repositories) {
          if (repo.pipelines && Array.isArray(repo.pipelines)) {
            allPipelines = allPipelines.concat(repo.pipelines)
          }
        }
      }

      const mapped: Pipeline[] = allPipelines.map((pipeline: any) => {
        if (pipeline.repository && typeof pipeline.repository === 'string' && pipeline.repository.includes('/')) {
          const mappedStatus = pipeline.status === "success" ? "completed" :
                pipeline.status === "running" ? "running" :
                pipeline.status === "pending" ? "pending" :
                pipeline.status === "failed" ? "failed" :
                pipeline.status === "completed" ? "completed" : "unknown"
          return {
            id: String(pipeline.id),
            repository: pipeline.repository,
            branch: pipeline.commit?.sha ? pipeline.commit.sha.substring(0, 7) : "main",
            status: mappedStatus,
            workflowName: "Deployment Pipeline",
            actor: pipeline.commit?.author || "system",
            runNumber: pipeline.id,
            event: "deployment",
            conclusion: pipeline.status,
            htmlUrl: pipeline.commit?.url || "#",
            logsUrl: pipeline.logs_url,
            startedAt: pipeline.timing?.started_at ? new Date(pipeline.timing.started_at) : new Date(),
            updatedAt: pipeline.updated_at ? new Date(pipeline.updated_at) : new Date(),
            duration: pipeline.timing?.total_duration || 0,
            headCommit: {
              id: pipeline.commit?.sha || "",
              message: pipeline.commit?.message || "",
              author: pipeline.commit?.author || "unknown"
            },
            stages: pipeline.stages || {
              sourcecommit: { status: null, duration: null },
              sourcebuild: { status: null, duration: null },
              sourcedeploy: { status: null, duration: null }
            },
            timing: pipeline.timing,
            error: pipeline.error,
            auto_deploy_enabled: pipeline.auto_deploy_enabled
          }
        } else {
          return {
            id: String(pipeline.id),
            repository: typeof pipeline.repository === 'string' ? pipeline.repository : (pipeline.repository?.name || "unknown"),
            branch: pipeline.head_branch || "main",
            status: pipeline.status === "completed" ? "completed" :
                    pipeline.status === "in_progress" ? "running" :
                    pipeline.status === "queued" ? "pending" : "unknown",
            workflowName: pipeline.workflowName || "Unknown Workflow",
            actor: pipeline.actor?.login || "unknown",
            runNumber: pipeline.run_number || 0,
            event: pipeline.event || "push",
            conclusion: pipeline.conclusion,
            htmlUrl: pipeline.html_url,
            logsUrl: pipeline.logs_url,
            startedAt: pipeline.started_at ? new Date(pipeline.started_at) : new Date(),
            updatedAt: pipeline.updated_at ? new Date(pipeline.updated_at) : new Date(),
            duration: pipeline.run_duration_ms ? Math.round(pipeline.run_duration_ms / 1000) : 0,
            headCommit: {
              id: pipeline.head_commit?.id || "",
              message: pipeline.head_commit?.message || "",
              author: pipeline.head_commit?.author?.name || "unknown"
            }
          }
        }
      })

      setPipelines(mapped)
    } catch (error: any) {
      setPipelineError(error?.message || 'Failed to load pipelines')
    } finally {
      setPipelineLoading(false)
    }
  }, [repos, selectedPipelineRepository])

  // Set default repository when repos are loaded
  useEffect(() => {
    if (repos && repos.length > 0 && !selectedRepository && !selectedPipelineRepository) {
      const firstRepo = repos[0]
      setSelectedRepository(firstRepo.fullName)
      setSelectedPipelineRepository(firstRepo.fullName)
    }
  }, [repos, selectedRepository, selectedPipelineRepository])


  const getStatusIcon = (status: Repository["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "inactive":
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Repository["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Inactive</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const getPRStatusBadge = (status: PullRequest["status"]) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>
      case "merged":
        return <Badge className="bg-purple-100 text-purple-800">Merged</Badge>
      case "closed":
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getCIStatusIcon = (status: PullRequest["ciStatus"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failure":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
    }
  }

  const getPipelineStatusIcon = (status: Pipeline["status"]) => {
    switch (status) {
      case "success":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "running":
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
      case "unknown":
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleConnectRepo = async () => {
    if (!newRepoUrl.trim()) {
      setError("Please enter a repository URL")
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Extract repository name from URL
      const repoName = newRepoUrl.split('/').pop()?.replace('.git', '') || 'unknown'
      const projectId = `project-${Date.now()}` // Generate a unique project ID
      
      console.log("Connecting repository:", newRepoUrl)
      
      // Call the API to connect the repository
      console.log("API 호출 시작:", { newRepoUrl, projectId, repoName })
      const result = await apiClient.connectRepository(newRepoUrl, projectId, repoName)
      
      console.log("Repository connection result:", result)
      
      // Refresh the integrations list
      const data = await apiClient.getProjectIntegrations()
      const mapped: Repository[] = (Array.isArray(data) ? data : []).map((r: any, idx: number) => ({
        id: String(r.id ?? idx),
        name: r.repo ?? r.name ?? "",
        fullName: r.github_full_name ?? `${r.owner ?? r.github_owner}/${r.repo ?? r.github_repo}`,
        connected: true,
        lastSync: r.updated_at ? new Date(r.updated_at) : new Date(),
        branch: r.branch ?? "main",
        status: (r.auto_deploy_enabled ? "active" : "inactive") as Repository["status"],
        autoDeployEnabled: !!r.auto_deploy_enabled,
        webhookConfigured: Boolean(r.github_webhook_secret),
        htmlUrl: `https://github.com/${r.github_full_name}`,
      }))
      setRepos(mapped)
      setNewRepoUrl("")
      
    } catch (error: any) {
      console.error("Failed to connect repository:", error)
      
      setError(error?.message || "Failed to connect repository")
    } finally {
      setLoading(false)
    }
  }

  const handleConfigure = async (repoId: string, type: 'general' | 'auto-deploy' | 'webhook' = 'general') => {
    try {
      console.log(`Configure requested for repository: ${repoId}, type: ${type}`)
      // TODO: 리포지토리 설정 모달 또는 페이지로 이동
      const configTypes = {
        'general': '일반 설정',
        'auto-deploy': '자동 배포 설정',
        'webhook': '웹훅 설정'
      }
      alert(`${configTypes[type]} 기능은 곧 구현될 예정입니다.`)
    } catch (error) {
      console.error("Configure failed:", error)
      alert("설정 페이지 로드에 실패했습니다.")
    }
  }

  const handleWebhookToggle = async (repoId: string, enabled: boolean) => {
    try {
      console.log(`Auto Deploy toggle for repository ${repoId}: ${enabled}`)
      console.log(`Sending API request to: /api/v1/github/webhook/${repoId}?enabled=${enabled}`)
      
      // 로컬 상태 먼저 업데이트 (즉시 UI 반영)
      setRepos(prevRepos => 
        prevRepos?.map(repo => 
          repo.id === repoId 
            ? { 
                ...repo, 
                webhookConfigured: enabled, 
                autoDeployEnabled: enabled,
                status: enabled ? "active" : "inactive"  // 🔧 수정: status도 즉시 업데이트
              }
            : repo
        ) || null
      )
      
      // 백엔드 API 호출 (웹훅 설정/해제)
      try {
        const response = await apiClient.updateWebhookConfig(parseInt(repoId), enabled) as any
        
        if (response.status === "success") {
          console.log(`Auto Deploy ${enabled ? '활성화' : '비활성화'} 성공`)
          // 🔧 최적화: API 성공 시 전체 리포지토리 목록 다시 로드 제거
          // 로컬 상태가 이미 업데이트되었으므로 불필요한 네트워크 요청 방지
        } else {
          console.warn("API 응답이 성공이 아닙니다:", response)
          // API 실패 시 로컬 상태 롤백
          setRepos(prevRepos => 
            prevRepos?.map(repo => 
              repo.id === repoId 
                ? { 
                    ...repo, 
                    webhookConfigured: !enabled, 
                    autoDeployEnabled: !enabled,
                    status: !enabled ? "active" : "inactive"
                  }
                : repo
            ) || null
          )
        }
      } catch (apiError: any) {
        console.warn("API 호출 실패, 로컬 상태 롤백:", apiError)
        // API 실패 시 로컬 상태 롤백
        setRepos(prevRepos => 
          prevRepos?.map(repo => 
            repo.id === repoId 
              ? { 
                  ...repo, 
                  webhookConfigured: !enabled, 
                  autoDeployEnabled: !enabled,
                  status: !enabled ? "active" : "inactive"
                }
              : repo
          ) || null
        )
      }
      
    } catch (error: any) {
      console.error("Auto Deploy toggle failed:", error)
      // 에러가 발생해도 로컬 상태는 이미 업데이트됨
    }
  }

  const handleNavigateToPipelines = () => {
    setActiveTab("pipelines")
    if (onNavigateToPipelines) {
      onNavigateToPipelines()
    }
  }


  const handleTriggerDeploy = async (repoFullName: string) => {
    try {
      console.log(`Trigger Deploy requested for repository: ${repoFullName}`)

      // Parse owner/repo from fullName
      const [owner, repo] = repoFullName.split('/')

      if (!owner || !repo) {
        toast({
          title: "오류",
          description: "잘못된 저장소 형식입니다.",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Show success toast message immediately
      toast({
        title: "배포 시작",
        description: `${owner}/${repo} 배포를 시작했습니다. CI/CD Pipelines 탭에서 진행 상황을 확인하세요.`,
        duration: 3000,
      })

      // Switch to CI/CD Pipelines tab immediately
      setActiveTab("pipelines")

      // Call the backend API in the background
      try {
        const response = await apiClient.triggerDeploy(owner, repo, "main")
        console.log("Trigger Deploy response:", response)
      } catch (apiError) {
        console.error("Trigger Deploy failed:", apiError)
        const errorMessage = apiError instanceof Error ? apiError.message : "배포 트리거에 실패했습니다."
        toast({
          title: "배포 실패",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        })
      }

    } catch (error) {
      console.error("Trigger Deploy failed:", error)
      const errorMessage = error instanceof Error ? error.message : "배포 트리거에 실패했습니다."
      toast({
        title: "배포 실패",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleDeployPreview = (pr: PullRequest) => {
    if (pr.deploymentUrl) {
      window.open(pr.deploymentUrl, '_blank')
    } else {
      alert("Deploy preview is not available for this PR")
    }
  }

  return (
    <div className="space-y-6">

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Repos</CardTitle>
            <Github className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(repos || []).filter((r) => r.connected).length}</div>
            <p className="text-xs text-muted-foreground">
              {(repos || []).length - (repos || []).filter((r) => r.connected).length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PRs</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pullRequests.filter((pr) => pr.status === "open").length}</div>
            <p className="text-xs text-muted-foreground">
              {pullRequests.filter((pr) => pr.ciStatus === "success").length} ready to merge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelines.filter((p) => p.status === "running").length}</div>
            <p className="text-xs text-muted-foreground">
              {pipelines.filter((p) => p.status === "completed").length} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Deployments</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(repos || []).filter((r) => r.autoDeployEnabled).length}</div>
            <p className="text-xs text-muted-foreground">Repositories with auto-deploy</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="pullrequests">Pull Requests</TabsTrigger>
          <TabsTrigger value="pipelines">CI/CD Pipelines</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {/* Add New Repository */}
          <Card>
            <CardHeader>
              <CardTitle>Connect New Repository</CardTitle>
              <CardDescription>Add a GitHub repository to enable automated deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleConnectRepo}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Repository List */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Repositories</CardTitle>
              <CardDescription>Manage your GitHub repository integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {error && <div className="text-sm text-red-500">{error}</div>}
                {loading && !repos && <div className="text-sm text-muted-foreground">Loading...</div>}
                {(repos || []).map((repo, idx) => (
                  <div key={`${repo.fullName}-${idx}`} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Github className="w-5 h-5" />
                        <div>
                          <h3 className="font-semibold">{repo.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Branch: {repo.branch} • Last sync: {repo.lastSync.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(repo.status)}
                        {getStatusBadge(repo.status)}
                      </div>
                    </div>

                    {/* Auto Deploy 섹션 (웹훅 통합) */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Auto Deploy</span>
                        <span className="text-xs text-gray-500">GitHub Push 시 자동 빌드/배포</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={repo.autoDeployEnabled ? "default" : "secondary"}
                          className={repo.autoDeployEnabled 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-gray-100 text-gray-600 border-gray-200"
                          }
                        >
                          {repo.autoDeployEnabled ? "활성" : "비활성"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleConfigure(repo.id, 'auto-deploy')}
                          className="h-6 w-6 p-0"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                        <Switch 
                          checked={repo.autoDeployEnabled} 
                          onCheckedChange={(checked) => handleWebhookToggle(repo.id, checked)}
                        />
                      </div>
                    </div>

                    {/* Connection 상태 */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Connection</span>
                        <span className="text-xs text-gray-500">리포지토리 연결 상태</span>
                      </div>
                      <Badge variant={repo.connected ? "default" : "destructive"}>
                        {repo.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={repo.htmlUrl || `https://github.com/${repo.fullName}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View on GitHub
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleConfigure(repo.id, 'general')}>
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTriggerDeploy(repo.fullName)}>
                        <Play className="w-4 h-4 mr-1" />
                        Trigger Deploy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pullrequests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{UI_TEXT.pullRequests.title}</CardTitle>
                  <CardDescription>{UI_TEXT.pullRequests.description}</CardDescription>
                </div>
            <div className="flex items-center space-x-4">
                  {repos && repos.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Repository:</span>
                      <select 
                        value={selectedRepository || ""} 
                        onChange={(e) => setSelectedRepository(e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm w-[200px]"
                      >
                        {repos.map((repo) => (
                          <option key={repo.id} value={repo.fullName}>
                            {repo.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Status:</span>
                    <select 
                      value={prStatusFilter} 
                      onChange={(e) => setPrStatusFilter(e.target.value as "all" | "open" | "closed" | "merged")}
                      className="px-3 py-1 border rounded-md text-sm w-[120px]"
                    >
                      <option value="all">All</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="merged">Merged</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prLoading && <div className="text-sm text-muted-foreground">{UI_TEXT.pullRequests.loading}</div>}
                {prError && <div className="text-sm text-red-500">{prError}</div>}
                {!prLoading && !prError && filteredPullRequests.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    {prStatusFilter === "all" ? UI_TEXT.pullRequests.noPRs : `No ${prStatusFilter} pull requests found`}
                  </div>
                )}
                {!prLoading && !prError && filteredPullRequests.map((pr) => (
                  <div key={pr.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <GitPullRequest className="w-4 h-4" />
                        <span className="font-medium">#{pr.number}</span>
                        <span>{pr.title}</span>
                      </div>
                      {getPRStatusBadge(pr.status)}
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      {pr.author} wants to merge {pr.branch} into {pr.targetBranch} • {pr.createdAt.toLocaleString()}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {getCIStatusIcon(pr.ciStatus)}
                          <span className="text-sm">CI: {pr.ciStatus}</span>
                        </div>
                        {pr.deploymentStatus && (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-4 h-4" />
                            <span className="text-sm">Deploy: {pr.deploymentStatus}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild={!!pr.htmlUrl}
                          disabled={!pr.htmlUrl}
                        >
                          {pr.htmlUrl ? (
                            <a href={pr.htmlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {UI_TEXT.pullRequests.viewPR}
                            </a>
                          ) : (
                            <span className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {UI_TEXT.pullRequests.viewPR}
                            </span>
                          )}
                        </Button>
                        {pr.status === "open" && pr.ciStatus === "success" && (
                          <Button 
                            size="sm" 
                            onClick={() => handleDeployPreview(pr)}
                          >
                            {UI_TEXT.pullRequests.deployPreview}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deployment History</CardTitle>
        <CardDescription>
          Monitor deployment progress and history
          {!user ? (
            <span className="ml-2 text-orange-500">● Not Authenticated</span>
          ) : isConnected ? (
            <span className="ml-2 text-green-600">● Live</span>
          ) : (
            <span className="ml-2 text-red-500">● Offline</span>
          )}
          <Button 
            onClick={async () => {
              try { 
                setRefreshing(true);
                await Promise.all([
                  handleRefreshDeploymentHistories(),
                  handleRefreshPipelines(),
                ])
              } finally { setRefreshing(false) }
            }}
            variant="outline" 
            size="sm"
            aria-busy={refreshing}
            disabled={refreshing}
            className="ml-2 h-6 px-2 inline-flex items-center gap-1 align-middle transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button 
            onClick={handleConnectSlack}
            variant={slackConnected ? "secondary" : "default"}
            size="sm"
            aria-busy={connectingSlack}
            disabled={connectingSlack || slackConnected}
            className="ml-2 h-6 px-2 inline-flex items-center gap-1 align-middle transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
            title={slackConnected ? 'Already connected' : undefined}
          >
            {slackConnected ? 'Connected!' : (connectingSlack ? 'Connecting…' : 'Connect Slack')}
          </Button>
        </CardDescription>
                </div>
                {repos && repos.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Repository:</span>
                      <select 
                        value={selectedPipelineRepository || repos[0]?.fullName || ""} 
                        onChange={(e) => { setSelectedPipelineRepository(e.target.value); setSelectedDeploymentRepository(e.target.value) }}
                        className="px-3 py-1 border rounded-md text-sm w-[240px]"
                      >
                        {repos.map((repo) => (
                          <option key={repo.id} value={repo.fullName}>
                            {repo.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Status:</span>
                      <select 
                        value={deploymentStatusFilter} 
                        onChange={(e) => setDeploymentStatusFilter(e.target.value as "all" | "running" | "success" | "failed")}
                        className="px-3 py-1 border rounded-md text-sm w-[120px]"
                      >
                        <option value="all">All</option>
                        <option value="running">Running</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  {/* Global last WebSocket update time */}
                  <div className="text-xs text-muted-foreground">
                    {/* This will be set by child monitors via console/logs; optional future lift-up */}
                  </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineLoading && <div className="text-sm text-muted-foreground">Loading deployment histories...</div>}
                {pipelineError && <div className="text-sm text-red-500">{pipelineError}</div>}
                {!pipelineLoading && !pipelineError && pipelines.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    {deploymentStatusFilter === "all" ? "No deployments found" : `No ${deploymentStatusFilter} deployments found`}
                  </div>
                )}
                {!pipelineLoading && !pipelineError && pipelines
                  .filter((p) => {
                    if (deploymentStatusFilter === "all") return true
                    if (deploymentStatusFilter === "success") return p.status === "completed"
                    return p.status === deploymentStatusFilter
                  })
                  .map((deployment) => (
                  <RealtimeDeploymentMonitor
                    key={deployment.id}
                    deploymentId={deployment.id}
                    repository={deployment.repository}
                    initialStatus={deployment.status}
                    initialStages={deployment.stages}
                    initialTiming={deployment.timing}
                    error={deployment.error}
                    auto_deploy_enabled={deployment.auto_deploy_enabled ?? false}
                    userId={userId}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration Settings</CardTitle>
              <CardDescription>Configure your GitHub integration preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-deploy on merge</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically deploy when PRs are merged to main branch
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Code Review</h4>
                    <p className="text-sm text-muted-foreground">Enable AI-powered code review comments</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Blog Posts</h4>
                    <p className="text-sm text-muted-foreground">Generate blog posts for major releases</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Slack Notifications</h4>
                    <p className="text-sm text-muted-foreground">Send deployment notifications to Slack</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  <Github className="w-4 h-4 mr-2" />
                  Reconnect GitHub Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions for deployment status icons
function getDeploymentStatusIcon(status: "running" | "success" | "failed") {
  switch (status) {
    case "running":
      return <Clock className="w-4 h-4 text-blue-500" />
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

function getStageStatusIcon(status: "success" | "failed" | null) {
  if (status === "success") {
    return <CheckCircle className="w-4 h-4 text-green-500" />
  } else if (status === "failed") {
    return <XCircle className="w-4 h-4 text-red-500" />
  } else {
    return <Clock className="w-4 h-4 text-gray-400" />
  }
}

