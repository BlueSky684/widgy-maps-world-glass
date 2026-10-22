import * as Scripting from "scripting"

export function api(name: string): any {
  const value = (Scripting as any)[name] ?? (globalThis as any)[name]
  if (value == null) throw new Error(name + " is unavailable in this Scripting version")
  return value
}

// Only these messages are suitable for display; native errors can contain URLs.
export class SafeMapError extends Error {}

