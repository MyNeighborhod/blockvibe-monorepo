#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { EmailServiceStack } from "../lib/email-service-stack"

const app = new cdk.App()

const stage = (app.node.tryGetContext("stage") as string | undefined) ?? "dev"
const account = process.env.CDK_DEFAULT_ACCOUNT
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1"

const signingSecret = process.env.EMAIL_SERVICE_SIGNING_SECRET
if (!signingSecret) {
  throw new Error(
    "EMAIL_SERVICE_SIGNING_SECRET is required. Export it or source an env file before deploy."
  )
}

new EmailServiceStack(app, `BlockvibeEmail-${stage}`, {
  stage,
  signingSecret,
  payloadSecret: process.env.PAYLOAD_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromAddress: process.env.SMTP_FROM_ADDRESS,
    fromName: process.env.SMTP_FROM_NAME,
  },
  env: {
    account,
    region,
  },
  description: `BlockVibe email worker (${stage}) — direct Lambda invoke from EC2`,
})

app.synth()
