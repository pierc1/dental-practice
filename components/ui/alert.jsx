import React from 'react'

export function Alert({ className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-slate-50 text-slate-800 border-slate-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
  }
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${variants[variant] ?? variants.default} ${className}`}
      {...props}
    />
  )
}

export function AlertDescription(props) {
  return <div {...props} />
}

export default Alert

