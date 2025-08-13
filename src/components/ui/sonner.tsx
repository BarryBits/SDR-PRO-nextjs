"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {

  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/50 group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: 
            "group toast group-[.toaster]:bg-black/50 group-[.toaster]:text-foreground group-[.toaster]:border-l-4 group-[.toaster]:border-destructive/80",
          success:
            "group toast group-[.toaster]:bg-black/50 group-[.toaster]:text-foreground group-[.toaster]:border-l-4 group-[.toaster]:border-success/80",
          warning:
            "group toast group-[.toaster]:bg-black/50 group-[.toaster]:text-foreground group-[.toaster]:border-l-4 group-[.toaster]:border-warning/80",
          info:
            "group toast group-[.toaster]:bg-black/50 group-[.toaster]:text-foreground group-[.toaster]:border-l-4 group-[.toaster]:border-accent/80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }