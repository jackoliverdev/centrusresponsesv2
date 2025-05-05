"use client"

import * as React from "react"
import { cn } from "@/utils/shadcn"

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked)

    React.useEffect(() => {
      setIsChecked(checked)
    }, [checked])

    const handleToggle = () => {
      if (disabled) return
      const newValue = !isChecked
      setIsChecked(newValue)
      onCheckedChange?.(newValue)
    }

    return (
      <div
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-primary" : "bg-input",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleToggle}
        ref={ref}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleToggle()
          }
        }}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch } 