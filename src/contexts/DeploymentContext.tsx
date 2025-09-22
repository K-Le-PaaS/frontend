import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Deployment, DeploymentStatus, Environment } from '@/types'

interface DeploymentState {
  deployments: Deployment[]
  selectedDeployment: Deployment | null
  isLoading: boolean
  error: string | null
  filters: {
    environment: Environment | 'all'
    status: DeploymentStatus | 'all'
    search: string
  }
}

type DeploymentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEPLOYMENTS'; payload: Deployment[] }
  | { type: 'ADD_DEPLOYMENT'; payload: Deployment }
  | { type: 'UPDATE_DEPLOYMENT'; payload: Deployment }
  | { type: 'REMOVE_DEPLOYMENT'; payload: string }
  | { type: 'SET_SELECTED_DEPLOYMENT'; payload: Deployment | null }
  | { type: 'SET_FILTERS'; payload: Partial<DeploymentState['filters']> }
  | { type: 'CLEAR_FILTERS' }

const initialState: DeploymentState = {
  deployments: [],
  selectedDeployment: null,
  isLoading: false,
  error: null,
  filters: {
    environment: 'all',
    status: 'all',
    search: '',
  },
}

const deploymentReducer = (state: DeploymentState, action: DeploymentAction): DeploymentState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    
    case 'SET_DEPLOYMENTS':
      return {
        ...state,
        deployments: action.payload,
        isLoading: false,
        error: null,
      }
    
    case 'ADD_DEPLOYMENT':
      return {
        ...state,
        deployments: [action.payload, ...state.deployments],
      }
    
    case 'UPDATE_DEPLOYMENT':
      return {
        ...state,
        deployments: state.deployments.map(d =>
          d.id === action.payload.id ? action.payload : d
        ),
        selectedDeployment: state.selectedDeployment?.id === action.payload.id
          ? action.payload
          : state.selectedDeployment,
      }
    
    case 'REMOVE_DEPLOYMENT':
      return {
        ...state,
        deployments: state.deployments.filter(d => d.id !== action.payload),
        selectedDeployment: state.selectedDeployment?.id === action.payload
          ? null
          : state.selectedDeployment,
      }
    
    case 'SET_SELECTED_DEPLOYMENT':
      return {
        ...state,
        selectedDeployment: action.payload,
      }
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      }
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          environment: 'all',
          status: 'all',
          search: '',
        },
      }
    
    default:
      return state
  }
}

interface DeploymentContextType {
  state: DeploymentState
  dispatch: React.Dispatch<DeploymentAction>
  // Deployment actions
  setDeployments: (deployments: Deployment[]) => void
  addDeployment: (deployment: Deployment) => void
  updateDeployment: (deployment: Deployment) => void
  removeDeployment: (id: string) => void
  selectDeployment: (deployment: Deployment | null) => void
  // Filter actions
  setFilters: (filters: Partial<DeploymentState['filters']>) => void
  clearFilters: () => void
  // Computed values
  filteredDeployments: Deployment[]
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(undefined)

interface DeploymentProviderProps {
  children: ReactNode
}

export const DeploymentProvider: React.FC<DeploymentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(deploymentReducer, initialState)

  // Deployment actions
  const setDeployments = (deployments: Deployment[]) => {
    dispatch({ type: 'SET_DEPLOYMENTS', payload: deployments })
  }

  const addDeployment = (deployment: Deployment) => {
    dispatch({ type: 'ADD_DEPLOYMENT', payload: deployment })
  }

  const updateDeployment = (deployment: Deployment) => {
    dispatch({ type: 'UPDATE_DEPLOYMENT', payload: deployment })
  }

  const removeDeployment = (id: string) => {
    dispatch({ type: 'REMOVE_DEPLOYMENT', payload: id })
  }

  const selectDeployment = (deployment: Deployment | null) => {
    dispatch({ type: 'SET_SELECTED_DEPLOYMENT', payload: deployment })
  }

  // Filter actions
  const setFilters = (filters: Partial<DeploymentState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }

  // Computed values
  const filteredDeployments = state.deployments.filter(deployment => {
    const matchesEnvironment = state.filters.environment === 'all' || 
      deployment.environment === state.filters.environment
    const matchesStatus = state.filters.status === 'all' || 
      deployment.status === state.filters.status
    const matchesSearch = state.filters.search === '' || 
      deployment.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
      deployment.repository.toLowerCase().includes(state.filters.search.toLowerCase())
    
    return matchesEnvironment && matchesStatus && matchesSearch
  })

  const value: DeploymentContextType = {
    state,
    dispatch,
    setDeployments,
    addDeployment,
    updateDeployment,
    removeDeployment,
    selectDeployment,
    setFilters,
    clearFilters,
    filteredDeployments,
  }

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  )
}

export const useDeployment = (): DeploymentContextType => {
  const context = useContext(DeploymentContext)
  if (context === undefined) {
    throw new Error('useDeployment must be used within a DeploymentProvider')
  }
  return context
}
