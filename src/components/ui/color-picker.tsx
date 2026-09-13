import * as React from "react"
import { cn } from "@/lib/utils"
import { formFieldClasses } from "@/lib/form-control-styles"

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, value = "#000000", onChange, disabled, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            "h-12 w-16 rounded-control border-2 border-input bg-input-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex h-12 flex-1 px-4 py-2 text-base",
            formFieldClasses,
            className
          )}
          placeholder="#000000"
        />
      </div>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }