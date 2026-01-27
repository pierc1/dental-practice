import React, { useMemo } from 'react'

// Very lightweight Select primitives to make the demo work.
// Internally renders a native <select> and maps SelectItem children to <option>.

export function Select({ value, onValueChange, disabled, children }) {
  const { items, triggerClassName, placeholder } = useMemo(() => {
    const items = []
    let triggerClassName = ''
    let placeholder = ''

    const collect = (nodes) => {
      React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child)) return
        const typeName = child.type?.displayName
        if (typeName === 'SelectItem') {
          items.push({ value: child.props.value, label: child.props.children })
        } else {
          if (!triggerClassName && typeName === 'SelectTrigger') {
            triggerClassName = child.props.className || ''
          }
          if (typeName === 'SelectValue' && child.props.placeholder) {
            placeholder = child.props.placeholder
          }
          if (child.props?.children) collect(child.props.children)
        }
      })
    }
    collect(children)
    return { items, triggerClassName, placeholder }
  }, [children])

  return (
    <select
      className={`w-full h-12 rounded-md border border-slate-300 bg-transparent text-inherit px-3 text-sm focus:border-cyan-500 focus:outline-none ${triggerClassName}`}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
    >
      {placeholder && <option value="" disabled={true} hidden>{placeholder}</option>}
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  )
}

export function SelectTrigger({ children }) { return <>{children}</> }
SelectTrigger.displayName = 'SelectTrigger'

export function SelectContent({ children }) { return <>{children}</> }
SelectContent.displayName = 'SelectContent'

export function SelectItem({ children }) { return <>{children}</> }
SelectItem.displayName = 'SelectItem'

export function SelectValue({ placeholder }) { return <>{placeholder ?? null}</> }
SelectValue.displayName = 'SelectValue'

export default Select
