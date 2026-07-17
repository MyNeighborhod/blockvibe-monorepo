import * as React from "react"

export const Width: React.FC<{
  children: React.ReactNode
  className?: string
  width?: number | string
}> = ({ children, className }) => {
  return <div className={className}>{children}</div>
}
