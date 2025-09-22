// Common types
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// User and Authentication
export interface User extends BaseEntity {
  email: string
  name: string
  role: UserRole
  avatar?: string
  isActive: boolean
  provider: AuthProvider
  providerId: string
  verified: boolean
}

export type UserRole = 'owner' | 'developer' | 'viewer'
export type AuthProvider = 'google' | 'github' | 'local'

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 인증 관련 추가 타입
export interface LoginCredentials {
  email: string
  password: string
}

export interface OAuth2LoginRequest {
  provider: AuthProvider
  code: string
  redirectUri: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface UserUpdateRequest {
  name?: string
  email?: string
  avatar?: string
}

// 권한 관련 타입
export interface Permission {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}

// Kubernetes Resources
export interface KubernetesResource extends BaseEntity {
  name: string
  namespace: string
  kind: ResourceKind
  status: ResourceStatus
  labels: Record<string, string>
  annotations: Record<string, string>
}

export type ResourceKind = 'Deployment' | 'Service' | 'ConfigMap' | 'Secret' | 'Ingress' | 'PersistentVolumeClaim'

export type ResourceStatus = 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown'

// Deployment Pipeline
export interface Deployment extends BaseEntity {
  name: string
  repository: string
  branch: string
  environment: Environment
  status: DeploymentStatus
  image: string
  replicas: number
  ports: Port[]
  envVars: Record<string, string>
  secrets: Record<string, string>
}

export type Environment = 'staging' | 'production'

export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped'

export interface Port {
  name: string
  port: number
  targetPort: number
  protocol: 'TCP' | 'UDP'
}

// Natural Language Processing
export interface NaturalLanguageCommand {
  id: string
  input: string
  parsedCommand: ParsedCommand
  status: CommandStatus
  result?: any
  error?: string
  timestamp: string
}

export interface ParsedCommand {
  action: string
  resource?: string
  parameters: Record<string, any>
  confidence: number
}

export type CommandStatus = 'pending' | 'processing' | 'completed' | 'failed'

// MCP Integration
export interface MCPServer {
  id: string
  name: string
  url: string
  status: MCPServerStatus
  capabilities: string[]
  lastConnected: string
}

export type MCPServerStatus = 'connected' | 'disconnected' | 'error'

// Monitoring
export interface Metric {
  name: string
  value: number
  unit: string
  timestamp: string
  labels: Record<string, string>
}

export interface Alert {
  id: string
  name: string
  severity: AlertSeverity
  status: AlertStatus
  message: string
  timestamp: string
  resolvedAt?: string
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export type AlertStatus = 'firing' | 'resolved'

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error types
export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
  timestamp: string
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => string | null
  }
}

// UI Component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'destructive' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  title?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Dashboard types
export * from './dashboard'

// Tutorial types
export interface TutorialStep {
  id: string
  title: string
  content: string
  actionText?: string
  naturalLanguageExamples: string[]
  isCompleted: boolean
}

export interface TutorialSession {
  id: string
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  userInputs: Array<{
    input: string
    timestamp: string
    step: string
  }>
  errors: Array<{
    error: string
    timestamp: string
    step: string
  }>
}
