import * as React from "react"


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    
    let variantStyles = "bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
    if (variant === "outline") variantStyles = "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
    if (variant === "ghost") variantStyles = "bg-transparent hover:bg-gray-100 text-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    if (variant === "link") variantStyles = "bg-transparent text-primary-600 underline-offset-4 hover:underline shadow-none"

    let sizeStyles = "h-10 px-4 py-2"
    if (size === "sm") sizeStyles = "h-9 rounded-md px-3"
    if (size === "lg") sizeStyles = "h-11 rounded-md px-8"
    if (size === "icon") sizeStyles = "h-10 w-10"

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:pointer-events-none disabled:opacity-50"
    
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
