"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg",
          title: "text-sm font-semibold",
          description: "text-sm opacity-80",
          actionButton:
            "bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium",
          cancelButton:
            "bg-muted text-muted-foreground rounded-md px-3 py-1 text-xs font-medium",
          closeButton:
            "opacity-0 group-hover:opacity-100 transition-opacity",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
