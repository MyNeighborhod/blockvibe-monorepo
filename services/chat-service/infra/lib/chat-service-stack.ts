import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as logs from "aws-cdk-lib/aws-logs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { Construct } from "constructs"
import * as path from "path"

export interface ChatServiceStackProps extends cdk.StackProps {
  /** Deployment stage: dev | staging | prod */
  stage: string
  signingSecret: string
  geminiApiKey?: string
  cursorApiKey?: string
  cursorApiUrl?: string
}

export class ChatServiceStack extends cdk.Stack {
  public readonly chatFunction: lambda.Function
  public readonly api: apigateway.LambdaRestApi

  constructor(scope: Construct, id: string, props: ChatServiceStackProps) {
    super(scope, id, props)

    const chatServiceRoot = path.join(__dirname, "..", "..")
    const lambdaBundleDir = path.join(chatServiceRoot, "dist", "lambda")

    const environment: Record<string, string> = {
      CHAT_SERVICE_SIGNING_SECRET: props.signingSecret,
      // Lambda will read docs from local bundled path
      DOCS_DIR: "./docs",
    }

    if (props.geminiApiKey) {
      environment.GEMINI_GENERAL_API_KEY = props.geminiApiKey
    }
    if (props.cursorApiKey) {
      environment.CURSOR_GENERAL_API_KEY = props.cursorApiKey
    }
    if (props.cursorApiUrl) {
      environment.CURSOR_API_URL = props.cursorApiUrl
    }

    this.chatFunction = new lambda.Function(this, "ChatFunction", {
      functionName: `blockvibe-chat-${props.stage}-service`,
      description: `Documentation Chat AI Service (${props.stage})`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "lambda.handler",
      code: lambda.Code.fromAsset(lambdaBundleDir),
      memorySize: 512,
      timeout: cdk.Duration.seconds(45), // LLMs can take up to 30s
      environment,
      logGroup: new logs.LogGroup(this, "ChatFunctionLogGroup", {
        logGroupName: `/aws/lambda/blockvibe-chat-${props.stage}-service`,
        retention: logs.RetentionDays.THREE_DAYS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    })

    // Create a public REST API Gateway proxying to the Lambda function
    this.api = new apigateway.LambdaRestApi(this, "ChatApiGateway", {
      handler: this.chatFunction,
      proxy: true,
      restApiName: `blockvibe-chat-${props.stage}-api`,
      description: `API Gateway for BlockVibe Chat Service (${props.stage})`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowCredentials: true,
      },
    })

    new cdk.CfnOutput(this, "ChatApiUrl", {
      value: this.api.url,
      description: "Base URL of the Chat Service API Gateway",
      exportName: `blockvibe-chat-${props.stage}-api-url`,
    })
  }
}
