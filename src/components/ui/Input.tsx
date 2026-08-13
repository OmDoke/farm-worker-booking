import * as React from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-12 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm transition-all duration-300 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-transparent focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950/50 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:bg-gray-900 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
