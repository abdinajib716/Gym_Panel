import { NextRequest, NextResponse } from "next/server"

import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { getReportData, isReportName, reportCell, reportColumns, reportLabels, toCsv } from "@/lib/reports"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"

export const runtime = "nodejs"

async function pdfBuffer(input: {
  title: string
  columns: ReturnType<typeof reportColumns>
  rows: Record<string, unknown>[]
}) {
  const escapePdf = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)")
  const trim = (value: string, length: number) => value.length > length ? `${value.slice(0, Math.max(0, length - 3))}...` : value
  const pageWidth = 842
  const pageHeight = 595
  const margin = 32
  const usableWidth = pageWidth - margin * 2
  const columnWidth = usableWidth / input.columns.length
  const rowsPerPage = 15
  const rowChunks = input.rows.length > 0
    ? Array.from({ length: Math.ceil(input.rows.length / rowsPerPage) }, (_, index) => input.rows.slice(index * rowsPerPage, (index + 1) * rowsPerPage))
    : [[]]

  const pages = rowChunks.map((rows, pageIndex) => {
    const commands: string[] = [
      "BT",
      "/F1 16 Tf",
      `${margin} ${pageHeight - margin} Td`,
      `(${escapePdf(input.title)}) Tj`,
      "ET",
      "BT",
      "/F1 8 Tf",
      `${margin} ${pageHeight - margin - 16} Td`,
      `(Generated ${escapePdf(new Date().toLocaleString())} | Page ${pageIndex + 1} of ${rowChunks.length}) Tj`,
      "ET",
    ]

    let y = pageHeight - margin - 44
    input.columns.forEach((column, index) => {
      commands.push("BT", "/F1 7 Tf", `${margin + index * columnWidth} ${y} Td`, `(${escapePdf(trim(column.label, 18))}) Tj`, "ET")
    })

    y -= 20
    if (rows.length === 0) {
      commands.push("BT", "/F1 10 Tf", `${margin} ${y} Td`, "(No rows found for the selected filters.) Tj", "ET")
    }

    rows.forEach((row) => {
      input.columns.forEach((column, index) => {
        commands.push("BT", "/F1 7 Tf", `${margin + index * columnWidth} ${y} Td`, `(${escapePdf(trim(reportCell(row, column), 22))}) Tj`, "ET")
      })
      y -= 28
    })

    return commands.join("\n")
  })

  const objects: string[] = []
  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>")
  const pagesId = addObject("")
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  const pageIds: number[] = []

  pages.forEach((content) => {
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`)
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
    pageIds.push(pageId)
  })

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ report: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("reports.export")
    const { report } = await params
    if (!isReportName(report)) throw new AppError(404, "Report not found")

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get("format") || "csv").toLowerCase()
    if (!["csv", "pdf"].includes(format)) throw new AppError(400, "Export format must be csv or pdf")

    const filters = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit") || "100",
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })

    const columns = reportColumns(report)
    const data = await getReportData(report, filters, true)
    const rows = data.rows as Record<string, unknown>[]
    const filename = `${report}-${new Date().toISOString().slice(0, 10)}.${format}`

    if (format === "csv") {
      return new NextResponse(toCsv(columns, rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    }

    const buffer = await pdfBuffer({ title: reportLabels[report], columns, rows })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }, { path: "/api/v1/reports/[report]/export", method: "GET" })
}
