import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard, Kubernetes, Deployments, Monitoring, Settings, Login, Register, AuthCallback } from '@/pages'

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 인증이 필요한 페이지들 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/kubernetes" element={
          <ProtectedRoute>
            <Layout>
              <Kubernetes />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/deployments" element={
          <ProtectedRoute>
            <Layout>
              <Deployments />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/monitoring" element={
          <ProtectedRoute>
            <Layout>
              <Monitoring />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />

        {/* 인증 페이지들 (레이아웃 없음) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* 404 처리 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
