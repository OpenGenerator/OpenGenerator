/**
 * @opengenerator/deploy-kubernetes
 * Kubernetes deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface K8sOptions { namespace?: string; replicas?: number; port?: number; image?: string }
const DEFAULT_OPTIONS: K8sOptions = { namespace: 'default', replicas: 2, port: 3000 }

function generateDeployment(options: K8sOptions): string {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: ${options.namespace}
spec:
  replicas: ${options.replicas}
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: ${options.image || 'api:latest'}
        ports:
        - containerPort: ${options.port}
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: ${options.port}
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: ${options.port}
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
`
}

function generateService(options: K8sOptions): string {
  return `apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: ${options.namespace}
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: ${options.port}
  type: ClusterIP
`
}

function generateIngress(options: K8sOptions): string {
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  namespace: ${options.namespace}
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 80
`
}

export function createK8sDeploy(options: K8sOptions = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-kubernetes',
    version: '1.0.0',
    target: 'kubernetes',

    async generate(_code: GeneratedCode, options?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...options } as K8sOptions
      const files: GeneratedFile[] = [
        { path: 'k8s/deployment.yaml', content: generateDeployment(opts), type: 'config' },
        { path: 'k8s/service.yaml', content: generateService(opts), type: 'config' },
        { path: 'k8s/ingress.yaml', content: generateIngress(opts), type: 'config' },
      ]

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-kubernetes', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const k8sDeploy = createK8sDeploy()
export default k8sDeploy
