"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        success: "bg-success/20",
        destructive: "bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant, ...props }, ref) => {
    const percentage = (value / max) * 100
    
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={cn(progressVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all",
            variant === "default" && "bg-primary",
            variant === "success" && "bg-success",
            variant === "destructive" && "bg-destructive"
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
