import { AxiosError } from "axios"
import type { ApiError } from "./client"

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return (
      (err.response?.data as { detail?: string })?.detail ||
      err.message ||
      "Something went wrong."
    )
  }

  const errDetail = (err as ApiError & { body?: { detail?: unknown } }).body?.detail
  if (Array.isArray(errDetail) && errDetail.length > 0) {
    return (errDetail[0] as { msg?: string }).msg || "Something went wrong."
  }
  return (
    (typeof errDetail === "string" ? errDetail : undefined) ||
    (err instanceof Error ? err.message : undefined) ||
    "Something went wrong."
  )
}

export const handleError = function (
  this: (msg: string) => void,
  err: unknown,
) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
