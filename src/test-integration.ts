// 통합 테스트 스크립트
import { kubernetesService } from './services/kubernetesService';
import { websocketService } from './services/websocketService';

export class IntegrationTest {
  private static instance: IntegrationTest;
  private testResults: { [key: string]: boolean } = {};

  static getInstance(): IntegrationTest {
    if (!IntegrationTest.instance) {
      IntegrationTest.instance = new IntegrationTest();
    }
    return IntegrationTest.instance;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 통합 테스트 시작');
    console.log('==================================================\n');

    try {
      await this.testKubernetesAPI();
      await this.testWebSocketConnection();
      await this.testResourceCRUD();
      
      this.printResults();
    } catch (error) {
      console.error('❌ 통합 테스트 실패:', error);
    }
  }

  private async testKubernetesAPI(): Promise<void> {
    console.log('1. Kubernetes API 테스트');
    
    try {
      // 컨텍스트 목록 조회
      const contexts = await kubernetesService.getContexts();
      this.testResults['contexts'] = Array.isArray(contexts);
      const contextCount = Array.isArray(contexts) ? contexts.length : 0;
      console.log(`   ${this.testResults['contexts'] ? '✅' : '❌'} 컨텍스트 목록 조회: ${contextCount}개`);

      // 네임스페이스 목록 조회
      const namespaces = await kubernetesService.getNamespaces();
      this.testResults['namespaces'] = Array.isArray(namespaces);
      const namespaceCount = Array.isArray(namespaces) ? namespaces.length : 0;
      console.log(`   ${this.testResults['namespaces'] ? '✅' : '❌'} 네임스페이스 목록 조회: ${namespaceCount}개`);

      // 리소스 목록 조회 (Kubernetes 클러스터 연결 문제로 실패할 수 있음)
      try {
        const deployments = await kubernetesService.getDeployments();
        this.testResults['deployments'] = true;
        const deploymentCount = deployments?.resources?.length || 0;
        console.log(`   ✅ Deployment 목록 조회: ${deploymentCount}개`);
      } catch (error) {
        this.testResults['deployments'] = false;
        console.log(`   ⚠️ Deployment 목록 조회 실패 (클러스터 연결 문제): ${error}`);
      }

      this.testResults['kubernetes_api'] = this.testResults['contexts'] && this.testResults['namespaces'];

    } catch (error) {
      console.error('   ❌ Kubernetes API 테스트 실패:', error);
      this.testResults['kubernetes_api'] = false;
    }
  }

  private async testWebSocketConnection(): Promise<void> {
    console.log('\n2. WebSocket 연결 테스트');
    
    try {
      await websocketService.connect();
      this.testResults['websocket_connect'] = true;
      console.log('   ✅ WebSocket 연결 성공');

      // 연결 상태 확인
      const isConnected = websocketService['ws']?.readyState === WebSocket.OPEN;
      this.testResults['websocket_state'] = isConnected;
      console.log(`   ${isConnected ? '✅' : '❌'} WebSocket 상태: ${isConnected ? '연결됨' : '연결 안됨'}`);

      // 구독 테스트
      websocketService.subscribeToKubernetesUpdates('default');
      this.testResults['websocket_subscribe'] = true;
      console.log('   ✅ Kubernetes 업데이트 구독 성공');

      // 연결 해제
      websocketService.disconnect();
      this.testResults['websocket_disconnect'] = true;
      console.log('   ✅ WebSocket 연결 해제 성공');

    } catch (error) {
      console.error('   ❌ WebSocket 테스트 실패:', error);
      this.testResults['websocket'] = false;
    }
  }

  private async testResourceCRUD(): Promise<void> {
    console.log('\n3. 리소스 CRUD 테스트');
    
    try {
      // ConfigMap 생성 테스트
      const testConfigMap = {
        apiVersion: 'v1',
        kind: 'ConfigMap' as const,
        metadata: {
          name: 'test-integration-configmap',
          namespace: 'default'
        },
        data: {
          'test-key': 'test-value',
          'environment': 'integration-test'
        }
      };

      try {
        await kubernetesService.createResource('ConfigMap', testConfigMap, 'default');
        this.testResults['create_resource'] = true;
        console.log('   ✅ ConfigMap 생성 성공');

        // 생성된 ConfigMap 조회
        await kubernetesService.getResource('ConfigMap', 'test-integration-configmap', 'default');
        this.testResults['get_resource'] = true;
        console.log('   ✅ ConfigMap 조회 성공');

        // ConfigMap 삭제
        await kubernetesService.deleteResource('ConfigMap', 'test-integration-configmap', 'default');
        this.testResults['delete_resource'] = true;
        console.log('   ✅ ConfigMap 삭제 성공');

      } catch (error) {
        this.testResults['crud_operations'] = false;
        console.log(`   ⚠️ CRUD 작업 실패 (클러스터 연결 문제): ${error}`);
      }

    } catch (error) {
      console.error('   ❌ 리소스 CRUD 테스트 실패:', error);
      this.testResults['resource_crud'] = false;
    }
  }

  private printResults(): void {
    console.log('\n==================================================');
    console.log('📊 테스트 결과 요약');
    console.log('==================================================');

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';

    console.log(`총 테스트: ${totalTests}개`);
    console.log(`성공: ${passedTests}개`);
    console.log(`실패: ${totalTests - passedTests}개`);
    console.log(`성공률: ${successRate}%`);

    console.log('\n상세 결과:');
    Object.entries(this.testResults).forEach(([test, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${test}`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 모든 테스트 통과!');
    } else {
      console.log('\n⚠️ 일부 테스트 실패 (Kubernetes 클러스터 연결 문제일 수 있음)');
    }
  }
}

// 테스트는 수동으로 실행됩니다 (Kubernetes 페이지의 버튼을 통해)
