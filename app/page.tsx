"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AuthProvider } from "@/contexts/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DashboardOverview } from "@/components/dashboard-overview"
import { NaturalLanguageCommand } from "@/components/natural-language-command"
import { DeploymentStatusMonitoring } from "@/components/deployment-status-monitoring"
import { GitHubIntegrationPanel } from "@/components/github-integration-panel"
import { RealTimeMonitoringDashboard } from "@/components/real-time-monitoring-dashboard"

export default function HomePage() {
  const [activeView, setActiveView] = useState("dashboard")
  const [githubInitialTab, setGithubInitialTab] = useState("repositories")
  const [scrollToMessageId, setScrollToMessageId] = useState<number | undefined>(undefined)
  const { toast } = useToast()

  // Show Slack connected toast when redirected with ?slack=connected
  useEffect(() => {
    try {
      const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : undefined
      if (search?.get("slack") === "connected") {
        try {
          toast({ title: "Slack 연동 완료", description: "이제 배포 알림을 Slack에서 받아요.", duration: 3000 })
        } catch {
          // fallback
          // eslint-disable-next-line no-alert
          alert("Slack 연동이 완료되었습니다.")
        }
        const url = new URL(window.location.href)
        url.searchParams.delete("slack")
        window.history.replaceState({}, "", url.toString())
      }
    } catch {}
  }, [])

  // 대시보드에서 대화창으로 이동하는 함수
  const handleNavigateToChat = (commandId: number) => {
    setScrollToMessageId(commandId)
    setActiveView("commands")
  }

  // 스크롤 완료 후 scrollToMessageId 초기화
  const handleScrollComplete = () => {
    setScrollToMessageId(undefined)
  }

  const renderContent = () => {
    switch (activeView) {
      case "commands":
        return <NaturalLanguageCommand 
          scrollToMessageId={scrollToMessageId}
          onScrollComplete={handleScrollComplete}
          onNavigateToPipelines={() => {
            setGithubInitialTab("pipelines")
            setActiveView("github")
          }} 
        />
      case "deployments":
        return <DeploymentStatusMonitoring 
          onNavigateToMonitoring={() => setActiveView("monitoring")}
          onNavigateToPipelines={() => {
            setGithubInitialTab("pipelines")
            setActiveView("github")
          }}
        />
      case "github":
        return <GitHubIntegrationPanel 
          onNavigateToPipelines={() => setActiveView("github")} 
          initialTab={githubInitialTab}
        />
      case "monitoring":
        return <RealTimeMonitoringDashboard />
      case "dashboard":
      default:
        return <DashboardOverview 
          onNavigateToDeployments={() => setActiveView("deployments")}
          onNavigateToChat={handleNavigateToChat}
        />
    }
  }

  return (
    <AuthProvider>
      <div className="flex h-screen bg-background">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{renderContent()}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
