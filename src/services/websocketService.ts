// EventEmitter를 직접 구현
type EventListener = (...args: any[]) => void

class EventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  on(event: string, listener: EventListener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: EventListener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface KubernetesResourceUpdate {
  resourceType: string;
  namespace: string;
  name: string;
  action: 'created' | 'updated' | 'deleted';
  resource: any;
}

export class WebSocketService extends EventEmitter {
  // EventEmitter 메서드들을 명시적으로 노출
  public override on = super.on.bind(this)
  public override off = super.off.bind(this)
  public override emit = super.emit.bind(this)
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isConnecting = false;
  private subscriptions = new Set<string>();

  constructor(private url: string) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit('message', message);
            this.emit(message.type, message.data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.emit('disconnected');
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(channel: string) {
    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      channel: channel
    });
  }

  unsubscribe(channel: string) {
    this.subscriptions.delete(channel);
    this.send({
      type: 'unsubscribe',
      channel: channel
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Kubernetes 리소스 업데이트 구독
  subscribeToKubernetesUpdates(namespace?: string) {
    const channel = namespace ? `kubernetes:${namespace}` : 'kubernetes';
    this.subscribe(channel);
  }

  // Kubernetes 리소스 업데이트 구독 해제
  unsubscribeFromKubernetesUpdates(namespace?: string) {
    const channel = namespace ? `kubernetes:${namespace}` : 'kubernetes';
    this.unsubscribe(channel);
  }

  // 리소스 상태 업데이트 리스너
  onResourceUpdate(callback: (update: KubernetesResourceUpdate) => void) {
    this.on('kubernetes:resource_update', callback);
  }

  // 리소스 상태 업데이트 리스너 제거
  offResourceUpdate(callback: (update: KubernetesResourceUpdate) => void) {
    this.off('kubernetes:resource_update', callback);
  }

}

// 싱글톤 인스턴스
const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/api/v1/ws/kubernetes';
export const websocketService = new WebSocketService(wsUrl);
