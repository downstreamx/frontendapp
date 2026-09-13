import * as React from "react"

import { cn } from "@/lib/utils"
import { formFieldClasses } from "@/lib/form-control-styles"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full px-4 py-2 text-base",
          formFieldClasses,
          "file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground",
          error && "border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
