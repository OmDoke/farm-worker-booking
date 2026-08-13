import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    
    let variantStyles = "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-0.5"
    if (variant === "outline") variantStyles = "border-2 border-primary-200 bg-transparent hover:bg-primary-50 text-primary-700 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-900/30"
    if (variant === "ghost") variantStyles = "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50"
    if (variant === "link") variantStyles = "bg-transparent text-primary-600 underline-offset-4 hover:underline shadow-none"

    let sizeStyles = "h-12 px-6 py-3 text-base"
    if (size === "sm") sizeStyles = "h-9 rounded-lg px-4 text-sm"
    if (size === "lg") sizeStyles = "h-14 rounded-2xl px-10 text-lg"
    if (size === "icon") sizeStyles = "h-12 w-12 rounded-xl"

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
