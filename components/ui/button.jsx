import React, { cloneElement, isValidElement } from 'react'

export function Button({
  asChild = false,
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    default: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-600',
    outline: 'bg-transparent border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-700',
  }
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  }
  const cls = `${base} ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.md} ${className}`.trim()

  if (asChild && isValidElement(children)) {
    const childClassName = children.props.className ?? ''
    return cloneElement(children, {
      ...props,
      className: `${cls} ${childClassName}`.trim(),
    })
  }

  return <button className={cls} {...props}>{children}</button>
}

export default Button
