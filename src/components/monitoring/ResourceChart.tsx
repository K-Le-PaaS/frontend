import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components'
import { MetricData } from '@/services/monitoringService'

interface ResourceChartProps {
  cpuData: MetricData[]
  memoryData: MetricData[]
  storageData: MetricData[]
  className?: string
}

export const ResourceChart: React.FC<ResourceChartProps> = ({
  cpuData,
  memoryData,
  storageData,
  className
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatValue = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const chartData = cpuData.map((item, index) => ({
    time: formatTime(item.timestamp),
    cpu: item.value,
    memory: memoryData[index]?.value || 0,
    storage: storageData[index]?.value || 0,
    timestamp: item.timestamp
  }))

  return (
    <Card className={className || ''}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">리소스 사용률 추이</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatValue(value), 
                  name === 'cpu' ? 'CPU' : name === 'memory' ? '메모리' : '스토리지'
                ]}
                labelFormatter={(label) => `시간: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="CPU"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#10B981" 
                strokeWidth={2}
                name="메모리"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="storage" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="스토리지"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

export default ResourceChart
