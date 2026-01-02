"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ComponentShowcaseProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  id?: string
}

export function ComponentShowcase({
  title,
  description,
  children,
  className,
  id,
  ...props
}: ComponentShowcaseProps) {
  return (
    <section
      id={id}
      className={cn("flex flex-col gap-4 scroll-mt-20", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          {title}
          <a href={`#${id}`} className="opacity-0 hover:opacity-100 text-muted-foreground transition-opacity">#</a>
        </h2>
        {description && (
          <p className="text-muted-foreground text-lg">{description}</p>
        )}
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-10 min-h-[200px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
               style={{
                 backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                 backgroundSize: '20px 20px'
               }}
          />
          
          <div className="w-full relative z-10">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
