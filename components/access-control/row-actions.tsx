"use client"

import { Fragment, useState } from "react"
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type TableAction = {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  separatorBefore?: boolean
  confirm?: {
    title: string
    description: string
    actionLabel?: string
  }
}

export const defaultActionIcons = {
  view: <Eye className="h-3.5 w-3.5" />,
  edit: <Pencil className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
}

export function RowActions({ actions, label = "Open row actions" }: { actions: TableAction[]; label?: string }) {
  const [confirmAction, setConfirmAction] = useState<TableAction | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9" aria-label={label}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action) => (
            <Fragment key={action.label}>
              {action.separatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                className={cn(action.destructive ? "text-destructive focus:text-destructive" : "")}
                onSelect={(event) => {
                  event.preventDefault()
                  if (action.confirm) {
                    setConfirmAction(action)
                    return
                  }
                  action.onClick()
                }}
              >
                {action.icon ? <span className="mr-2 flex h-4 w-4 items-center justify-center">{action.icon}</span> : null}
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                confirmAction?.onClick()
                setConfirmAction(null)
              }}
            >
              {confirmAction?.confirm?.actionLabel ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
