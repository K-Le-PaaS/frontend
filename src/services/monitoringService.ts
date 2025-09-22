import { apiClient } from './apiClient'

export interface MetricData {
  timestamp: string
  value: number
  labels?: Record<string, string>
}

export interface Alert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  status: 'firing' | 'resolved'
  timestamp: string
  source: string
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    name: string
    status: 'up' | 'down' | 'unknown'
    responseTime?: number
  }[]
  timestamp: string
}

export interface ResourceMetrics {
  cpu: {
    used: number
    total: number
    percentage: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  storage: {
    used: number
    total: number
    percentage: number
  }
  network: {
    in: number
    out: number
  }
  timestamp: string
}

export class MonitoringService {
  static async getMetrics(query: string, startTime?: string, endTime?: string): Promise<MetricData[]> {
    try {
      const response = await apiClient.post<any>('/monitoring/query', {
        query,
        start_time: startTime,
        end_time: endTime
      })
      
      if (response.status === 'success' && response.data?.result) {
        return response.data.result.map((item: any) => ({
          timestamp: new Date(item.timestamp * 1000).toISOString(),
          value: parseFloat(item.value[1]),
          labels: item.metric || {}
        }))
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      return []
    }
  }

  static async getAlerts(): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>('/monitoring/alerts')
      return response || []
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      return []
    }
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get<SystemHealth>('/monitoring/health')
      return response || {
        status: 'unknown',
        components: [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
      return {
        status: 'unhealthy',
        components: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  static async getSystemMetrics(): Promise<any> {
    try {
      return await apiClient.get<any>('/system/health')
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
      return null
    }
  }

  static async getResourceMetrics(): Promise<ResourceMetrics> {
    try {
      // CPU 사용률
      const cpuQuery = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
      const cpuData = await this.getMetrics(cpuQuery)
      const cpuPercentage = cpuData.length > 0 ? cpuData[0]?.value || 0 : 0

      // 메모리 사용률
      const memoryQuery = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'
      const memoryData = await this.getMetrics(memoryQuery)
      const memoryPercentage = memoryData.length > 0 ? memoryData[0]?.value || 0 : 0

      // 스토리지 사용률
      const storageQuery = '(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100'
      const storageData = await this.getMetrics(storageQuery)
      const storagePercentage = storageData.length > 0 ? storageData[0]?.value || 0 : 0

      // 네트워크 사용량
      const networkInQuery = 'rate(node_network_receive_bytes_total[5m])'
      const networkOutQuery = 'rate(node_network_transmit_bytes_total[5m])'
      const [networkInData, networkOutData] = await Promise.all([
        this.getMetrics(networkInQuery),
        this.getMetrics(networkOutQuery)
      ])

      return {
        cpu: {
          used: cpuPercentage,
          total: 100,
          percentage: cpuPercentage
        },
        memory: {
          used: memoryPercentage * 8 * 1024 * 1024 * 1024, // GB 단위로 변환
          total: 8 * 1024 * 1024 * 1024, // 8GB 가정
          percentage: memoryPercentage
        },
        storage: {
          used: storagePercentage * 100 * 1024 * 1024 * 1024, // GB 단위로 변환
          total: 100 * 1024 * 1024 * 1024, // 100GB 가정
          percentage: storagePercentage
        },
        network: {
          in: networkInData.length > 0 ? networkInData[0]?.value || 0 : 0,
          out: networkOutData.length > 0 ? networkOutData[0]?.value || 0 : 0
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to fetch resource metrics:', error)
      return {
        cpu: { used: 0, total: 100, percentage: 0 },
        memory: { used: 0, total: 8 * 1024 * 1024 * 1024, percentage: 0 },
        storage: { used: 0, total: 100 * 1024 * 1024 * 1024, percentage: 0 },
        network: { in: 0, out: 0 },
        timestamp: new Date().toISOString()
      }
    }
  }

  static async getTimeSeriesMetrics(query: string, duration: string = '1h'): Promise<MetricData[]> {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - this.parseDuration(duration))
    
    return this.getMetrics(query, startTime.toISOString(), endTime.toISOString())
  }

  private static parseDuration(duration: string): number {
    const units: Record<string, number> = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    }
    
    const match = duration.match(/^(\d+)([mhd])$/)
    if (!match) return 60 * 60 * 1000 // 기본 1시간
    
    const value = parseInt(match[1] || '1')
    const unit = match[2] || 'h'
    return value * (units[unit] || units['h'] || 60 * 60 * 1000)
  }
}
