/**
 * @opengenerator/deploy-lambda
 * AWS Lambda deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface LambdaOptions extends DeployOptions {
  runtime?: string
  memory?: number
  timeout?: number
  region?: string
}

const DEFAULT_OPTIONS: Partial<LambdaOptions> = {
  runtime: 'nodejs20.x',
  memory: 512,
  timeout: 30,
  region: 'us-east-1',
}

function generateSamTemplate(options: Partial<LambdaOptions>): string {
  return `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: OpenGenerator API

Globals:
  Function:
    Timeout: ${options.timeout}
    MemorySize: ${options.memory}
    Runtime: ${options.runtime}

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/handler.handler
      CodeUri: .
      Events:
        Api:
          Type: HttpApi
          Properties:
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !Sub "https://\${ServerlessHttpApi}.execute-api.\${AWS::Region}.amazonaws.com/"
`
}

function generateHandler(): string {
  return `import { createApp } from './app'

const app = createApp()

export const handler = async (event: any, context: any) => {
  // AWS Lambda adapter - implement based on your framework
  return { statusCode: 200, body: JSON.stringify({ message: 'Hello from Lambda' }) }
}
`
}

export function createLambdaDeploy(options: Partial<LambdaOptions> = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-lambda',
    version: '1.0.0',
    target: 'lambda',

    async generate(_code: GeneratedCode, genOptions?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...genOptions } as LambdaOptions
      const files: GeneratedFile[] = [
        { path: 'template.yaml', content: generateSamTemplate(opts), type: 'config' },
        { path: 'src/handler.ts', content: generateHandler(), type: 'source' },
      ]

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-lambda', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const lambdaDeploy = createLambdaDeploy()
export default lambdaDeploy
