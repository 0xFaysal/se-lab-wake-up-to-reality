import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[5rem] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-2xs transition-colors outline-none placeholder:text-slate-400 hover:border-slate-400 focus-visible:border-[#064E3B] focus-visible:ring-2 focus-visible:ring-[#064E3B]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:disabled:bg-slate-800 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
