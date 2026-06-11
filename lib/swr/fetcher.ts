export const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.")
    ;(error as Error & { status?: number; info?: unknown }).status = response.status
    ;(error as Error & { status?: number; info?: unknown }).info = await response.json().catch(() => ({}))
    throw error
  }

  return response.json()
}
