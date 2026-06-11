import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { ZodError } from "zod"

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
  }
}

function logError(error: unknown, context?: { path?: string; method?: string }) {
  const isDevelopment = process.env.NODE_ENV === "development"
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : "Unknown error",
    ...(error instanceof Error && isDevelopment ? { stack: error.stack } : {}),
    ...(context ?? {}),
  }

  console.error("[ERROR]", JSON.stringify(errorLog, null, 2))
}

export function handleError(error: unknown, context?: { path?: string; method?: string }) {
  logError(error, context)

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors.map((entry) => ({
          path: entry.path.join("."),
          message: entry.message,
        })),
      },
      { status: 400 },
    )
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json({ error: "A record with this value already exists", code: error.code }, { status: 409 })
      case "P2025":
        return NextResponse.json({ error: "Record not found", code: error.code }, { status: 404 })
      default:
        return NextResponse.json({ error: "Database error occurred", code: error.code }, { status: 500 })
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof Error) {
    const isDevelopment = process.env.NODE_ENV === "development"
    return NextResponse.json(
      {
        error: isDevelopment ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: { path?: string; method?: string },
) {
  try {
    const result = await handler()
    return result instanceof NextResponse ? result : NextResponse.json(result)
  } catch (error) {
    return handleError(error, context)
  }
}
