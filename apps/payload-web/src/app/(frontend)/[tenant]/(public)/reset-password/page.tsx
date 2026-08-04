import React, { Suspense } from "react"
import { ResetPasswordForm } from "./ResetPasswordForm"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-background to-muted/30 p-4 md:p-8">
      <title>Reset Password</title>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
