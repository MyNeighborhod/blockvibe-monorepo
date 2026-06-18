import * as cdk from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as logs from "aws-cdk-lib/aws-logs"
import { Construct } from "constructs"
import * as path from "path"

export interface EmailServiceSmtpConfig {
  host?: string
  port?: string
  secure?: string
  user?: string
  pass?: string
  fromAddress?: string
  fromName?: string
}

export interface EmailServiceStackProps extends cdk.StackProps {
  /** Deployment stage: dev | staging | prod */
  stage: string
  signingSecret: string
  payloadSecret?: string
  googleClientId?: string
  googleClientSecret?: string
  smtp?: EmailServiceSmtpConfig
}

export class EmailServiceStack extends cdk.Stack {
  public readonly sendFunction: lambda.Function

  constructor(scope: Construct, id: string, props: EmailServiceStackProps) {
    super(scope, id, props)

    const emailServiceRoot = path.join(__dirname, "..", "..")
    const lambdaBundleDir = path.join(emailServiceRoot, "dist", "lambda")

    const environment: Record<string, string> = {
      EMAIL_SERVICE_SIGNING_SECRET: props.signingSecret,
    }

    if (props.payloadSecret) {
      environment.PAYLOAD_SECRET = props.payloadSecret
    }

    if (props.googleClientId) environment.GOOGLE_CLIENT_ID = props.googleClientId
    if (props.googleClientSecret) environment.GOOGLE_CLIENT_SECRET = props.googleClientSecret

    const smtp = props.smtp ?? {}
    if (smtp.host) environment.SMTP_HOST = smtp.host
    if (smtp.port) environment.SMTP_PORT = smtp.port
    if (smtp.secure) environment.SMTP_SECURE = smtp.secure
    if (smtp.user) environment.SMTP_USER = smtp.user
    if (smtp.pass) environment.SMTP_PASS = smtp.pass
    if (smtp.fromAddress) environment.SMTP_FROM_ADDRESS = smtp.fromAddress
    if (smtp.fromName) environment.SMTP_FROM_NAME = smtp.fromName

    this.sendFunction = new lambda.Function(this, "SendFunction", {
      functionName: `blockvibe-email-${props.stage}-send`,
      description: "Process email campaigns (direct invoke from payload-web EC2)",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "invoke-handler.handler",
      code: lambda.Code.fromAsset(lambdaBundleDir),
      memorySize: 256,
      timeout: cdk.Duration.seconds(300),
      environment,
      logGroup: new logs.LogGroup(this, "SendFunctionLogGroup", {
        retention: logs.RetentionDays.THREE_DAYS,
      }),
    })

    new cdk.CfnOutput(this, "SendFunctionName", {
      value: this.sendFunction.functionName,
      description: "Set EMAIL_LAMBDA_FUNCTION_NAME on payload-web EC2",
      exportName: `blockvibe-email-${props.stage}-send-function-name`,
    })

    new cdk.CfnOutput(this, "SendFunctionArn", {
      value: this.sendFunction.functionArn,
      description: "Lambda ARN for IAM policies",
      exportName: `blockvibe-email-${props.stage}-send-function-arn`,
    })
  }
}
