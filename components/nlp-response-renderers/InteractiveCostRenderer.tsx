import React from 'react';

interface NodeSpec {
  spec: string;
  name: string;
  vcpu: number;
  memory_gb: number;
  storage_gb: number;
  price_hourly: number;
  price_monthly: number;
}

interface NodeSpecSelectionRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      available_specs: NodeSpec[];
      next_step: string;
    };
  };
  onSpecSelect: (spec: string) => void;
}

export function NodeSpecSelectionRenderer({ response, onSpecSelect }: NodeSpecSelectionRendererProps) {
  const { data } = response;
  const { available_specs, next_step } = data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">노드 스펙 선택</h3>
        <p className="text-blue-700 mb-4">{data.message}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available_specs.map((spec) => (
            <div
              key={spec.spec}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSpecSelect(spec.spec)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{spec.spec}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  클릭하여 선택
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>vCPU:</span>
                  <span className="font-medium">{spec.vcpu}개</span>
                </div>
                <div className="flex justify-between">
                  <span>메모리:</span>
                  <span className="font-medium">{spec.memory_gb}GB</span>
                </div>
                <div className="flex justify-between">
                  <span>스토리지:</span>
                  <span className="font-medium">{spec.storage_gb}GB</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">시간당:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_hourly)}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">월간:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_monthly)}원</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-sm">{next_step}</p>
        </div>
      </div>
    </div>
  );
}

interface ScalingSpecSelectionRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      available_specs: NodeSpec[];
      next_step: string;
    };
  };
  onSpecSelect: (spec: string) => void;
}

export function ScalingSpecSelectionRenderer({ response, onSpecSelect }: ScalingSpecSelectionRendererProps) {
  const { data } = response;
  const { available_specs, next_step } = data.formatted || {};

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">스케일링 노드 스펙 선택</h3>
        <p className="text-orange-700 mb-4">{data.formatted?.message || '노드 스펙을 선택해주세요.'}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(available_specs || []).map((spec) => (
            <div
              key={spec.spec}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSpecSelect(spec.spec)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{spec.spec}</h4>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  클릭하여 선택
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>vCPU:</span>
                  <span className="font-medium">{spec.vcpu}개</span>
                </div>
                <div className="flex justify-between">
                  <span>메모리:</span>
                  <span className="font-medium">{spec.memory_gb}GB</span>
                </div>
                <div className="flex justify-between">
                  <span>스토리지:</span>
                  <span className="font-medium">{spec.storage_gb}GB</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">시간당:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_hourly)}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">월간:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_monthly)}원</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-orange-100 rounded-lg">
          <p className="text-orange-800 text-sm">{next_step}</p>
        </div>
      </div>
    </div>
  );
}

interface ScalingTypeSelectionRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      current_spec: string;
      current_count: number;
      next_step: string;
      options: Array<{
        type: string;
        title: string;
        description: string;
        example: string;
      }>;
    };
  };
  onTypeSelect: (type: string) => void;
}

export function ScalingTypeSelectionRenderer({ response, onTypeSelect }: ScalingTypeSelectionRendererProps) {
  const { data } = response;
  const { options, next_step } = data.formatted || data;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">스케일링 방식 선택</h3>
        <p className="text-blue-700 mb-4">{data.message}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option) => (
            <div
              key={option.type}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onTypeSelect(option.type)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{option.title}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  클릭하여 선택
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>
              
              <div className="bg-gray-50 p-2 rounded text-xs text-gray-500">
                예시: {option.example}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-800 text-sm">{next_step}</p>
        </div>
      </div>
    </div>
  );
}


interface ScaleUpCountInputRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      current_spec: string;
      current_count: number;
      next_step: string;
    };
  };
  onCountSubmit: (targetCount: number) => void;
}

export function ScaleUpCountInputRenderer({ response, onCountSubmit }: ScaleUpCountInputRendererProps) {
  const { data } = response;
  const { current_spec, current_count } = data.formatted || data;
  const [targetCount, setTargetCount] = React.useState(current_count + 1);

  const handleSubmit = () => {
    onCountSubmit(targetCount);
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">스케일업 개수 입력</h3>
        <p className="text-green-700 mb-4">{data.message}</p>
        
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">현재:</span> {current_spec} {current_count}개
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">목표:</span> {current_spec} 노드 개수 입력
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 노드 개수
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            비용 계산하기
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-green-800 text-sm">{data.next_step}</p>
        </div>
      </div>
    </div>
  );
}


interface ScaleOutSpecSelectionRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      available_specs: NodeSpec[];
      next_step: string;
      current_spec: string;
      current_count: number;
    };
  };
  onSpecSelect: (spec: string) => void;
}

export function ScaleOutSpecSelectionRenderer({ response, onSpecSelect }: ScaleOutSpecSelectionRendererProps) {
  const { data } = response;
  const { available_specs, next_step } = data.formatted || data;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">스케일아웃 노드 스펙 선택</h3>
        <p className="text-purple-700 mb-4">{data.message}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(available_specs || []).map((spec) => (
            <div
              key={spec.spec}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSpecSelect(spec.spec)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">{spec.spec}</h4>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  클릭하여 선택
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>vCPU:</span>
                  <span className="font-medium">{spec.vcpu}개</span>
                </div>
                <div className="flex justify-between">
                  <span>메모리:</span>
                  <span className="font-medium">{spec.memory_gb}GB</span>
                </div>
                <div className="flex justify-between">
                  <span>스토리지:</span>
                  <span className="font-medium">{spec.storage_gb}GB</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">시간당:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_hourly)}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">월간:</span>
                  <span className="font-semibold text-green-600">{formatPrice(spec.price_monthly)}원</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-purple-800 text-sm">{next_step}</p>
        </div>
      </div>
    </div>
  );
}


interface ScaleOutCountInputRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      node_spec: string;
      current_spec: string;
      current_count: number;
      next_step: string;
    };
  };
  onCountSubmit: (targetCount: number) => void;
}

export function ScaleOutCountInputRenderer({ response, onCountSubmit }: ScaleOutCountInputRendererProps) {
  const { data } = response;
  const { node_spec, current_spec, current_count } = data.formatted || data;
  const [targetCount, setTargetCount] = React.useState(current_count + 1);

  const handleSubmit = () => {
    onCountSubmit(targetCount);
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">스케일아웃 개수 입력</h3>
        <p className="text-purple-700 mb-4">{data.message}</p>
        
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">현재:</span> {current_spec} {current_count}개
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">목표:</span> {node_spec} 노드 개수 입력
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 노드 개수
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            비용 계산하기
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-purple-800 text-sm">{data.next_step}</p>
        </div>
      </div>
    </div>
  );
}

interface NetworkCostInputRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      form: {
        public_ip_count: {
          label: string;
          type: string;
          default: number;
          min: number;
          max: number;
          description: string;
        };
        traffic_gb: {
          label: string;
          type: string;
          default: number;
          min: number;
          max: number;
          description: string;
        };
      };
      next_step: string;
    };
  };
  onNetworkSubmit: (publicIpCount: number, trafficGb: number) => void;
}

export function NetworkCostInputRenderer({ response, onNetworkSubmit }: NetworkCostInputRendererProps) {
  const { data } = response;
  const { form } = data;
  const [publicIpCount, setPublicIpCount] = React.useState(form.public_ip_count.default);
  const [trafficGb, setTrafficGb] = React.useState(form.traffic_gb.default);

  const handleSubmit = () => {
    onNetworkSubmit(publicIpCount, trafficGb);
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">네트워크 비용 계산</h3>
        <p className="text-purple-700 mb-4">{data.message}</p>
        
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {form.public_ip_count.label}
            </label>
            <input
              type="number"
              min={form.public_ip_count.min}
              max={form.public_ip_count.max}
              value={publicIpCount}
              onChange={(e) => setPublicIpCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">{form.public_ip_count.description}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {form.traffic_gb.label}
            </label>
            <input
              type="number"
              min={form.traffic_gb.min}
              max={form.traffic_gb.max}
              value={trafficGb}
              onChange={(e) => setTrafficGb(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">{form.traffic_gb.description}</p>
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            네트워크 비용 계산하기
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-purple-100 rounded-lg">
          <p className="text-purple-800 text-sm">{data.next_step}</p>
        </div>
      </div>
    </div>
  );
}

interface ScalingCountInputRendererProps {
  response: {
    data: {
      message: string;
      interactive: boolean;
      type: string;
      current_spec: string;
      current_count: number;
      next_step: string;
    };
  };
  onCountSubmit: (targetCount: number) => void;
}

export function ScalingCountInputRenderer({ response, onCountSubmit }: ScalingCountInputRendererProps) {
  const { data } = response;
  const { current_spec, current_count } = data.formatted || data;
  const [targetCount, setTargetCount] = React.useState(current_count + 1);

  const handleSubmit = () => {
    onCountSubmit(targetCount);
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">스케일링 개수 입력</h3>
        <p className="text-green-700 mb-4">{data.message}</p>
        
        <div className="bg-white rounded-lg p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              현재: <span className="font-semibold">{current_spec}</span> {current_count}개
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 노드 개수
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">1-20개 사이에서 선택하세요</p>
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            스케일링 비용 계산하기
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-green-800 text-sm">{data.next_step}</p>
        </div>
      </div>
    </div>
  );
}
