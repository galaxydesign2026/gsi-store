import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        gradient:
          "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700",
        primary:
          "h-11 rounded-[10px] gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-sm transition-all hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-md disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[18px]",
        secondary:
          "h-11 rounded-[10px] gap-2 border border-blue-600 bg-white text-blue-600 transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[18px]",
        tertiary:
          "h-11 rounded-[10px] gap-2 border border-slate-200 bg-transparent text-slate-600 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[18px]",
        destructive:
          "h-11 rounded-[10px] gap-2 border border-red-500 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[18px]",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }