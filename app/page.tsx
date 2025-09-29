"use client"

import { useState } from "react"
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

  const renderContent = () => {
    switch (activeView) {
      case "commands":
        return <NaturalLanguageCommand />
      case "deployments":
        return <DeploymentStatusMonitoring />
      case "github":
        return <GitHubIntegrationPanel />
      case "monitoring":
        return <RealTimeMonitoringDashboard />
      case "dashboard":
      default:
        return <DashboardOverview />
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
