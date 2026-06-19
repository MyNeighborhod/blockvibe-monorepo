#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { ChatServiceStack } from "../lib/chat-service-stack"

const app = new cdk.App()

const stage = (app.node.tryGetContext("stage") as string | undefined) ?? "dev"
const account = process.env.CDK_DEFAULT_ACCOUNT
const region = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "us-east-1"

const signingSecret = process.env.CHAT_SERVICE_SIGNING_SECRET
if (!signingSecret) {
  throw new Error(
    "CHAT_SERVICE_SIGNING_SECRET is required. Export it or source an env file before deploy."
  )
}

new ChatServiceStack(app, `BlockvibeChat-${stage}`, {
  stage,
  signingSecret,
  geminiApiKey: process.env.GEMINI_GENERAL_API_KEY,
  cursorApiKey: process.env.CURSOR_GENERAL_API_KEY,
  cursorApiUrl: process.env.CURSOR_API_URL,
  env: {
    account,
    region,
  },
  description: `BlockVibe AI Documentation Chat Service (${stage}) — public API Gateway + Lambda`,
})

app.synth()
