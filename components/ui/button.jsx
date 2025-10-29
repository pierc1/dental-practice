import React from 'react'

export function Button({ className = '', variant = 'default', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-600',
    outline: 'bg-transparent border border-slate-200 hover:border-cyan-500 hover:text-cyan-600',
  }
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }
  const cls = `${base} ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.md} ${className}`
  return <button className={cls} {...props} />
}

export default Button

