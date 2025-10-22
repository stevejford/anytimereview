import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-[var(--shadow-teal)] hover:brightness-110 active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:shadow-[var(--shadow-red)] hover:brightness-110 active:shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-primary/30 bg-background shadow-sm hover:bg-primary/10 hover:border-primary/50 hover:shadow-md dark:bg-input/30 dark:border-input dark:hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:shadow-lg hover:shadow-[var(--shadow-purple)] hover:brightness-110 active:shadow-sm",
        ghost:
          "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20",
        link: "text-primary underline-offset-4 hover:underline hover:brightness-110",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
