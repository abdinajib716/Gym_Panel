"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  AccessCard,
  AccessPageHeader,
  AccessSearchField,
  AccessToolbar,
  FieldBlock,
  PaginationControls,
  Pill,
  TableSkeleton,
  TableEmpty,
  TableShell,
} from "@/components/access-control/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { apiRequest } from "@/lib/client-api"
import { useAccessPermissions, type AccessPermissionRecord } from "@/lib/swr"
import { permissionSchema } from "@/lib/validations/access-control"

type PermissionFormValues = z.input<typeof permissionSchema>

const permissionDefaults: PermissionFormValues = {
  name: "",
  guardName: "web",
  groupKey: "users",
}

export function AccessControlPermissionsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<AccessPermissionRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate, isLoading } = useAccessPermissions({ page, limit, search })
  const permissions = data?.permissions ?? []

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: permissionDefaults,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  })

  const openCreate = () => {
    setEditingPermission(null)
    form.reset(permissionDefaults)
    setOpen(true)
  }

  const openEdit = (permission: AccessPermissionRecord) => {
    setEditingPermission(permission)
    form.reset({
      name: permission.name,
      guardName: permission.guardName,
      groupKey: permission.groupKey,
    })
    setOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const response = await apiRequest<{ message: string }>(
        editingPermission
          ? `/api/v1/access-control/permissions/${editingPermission.id}`
          : "/api/v1/access-control/permissions",
        {
          method: editingPermission ? "PUT" : "POST",
          body: values,
        },
      )

      toast.success(response.message)
      setOpen(false)
      setEditingPermission(null)
      form.reset(permissionDefaults)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save permission")
    } finally {
      setSubmitting(false)
    }
  })

  const handleDelete = async (permission: AccessPermissionRecord) => {
    try {
      const response = await apiRequest<{ message: string }>(`/api/v1/access-control/permissions/${permission.id}`, {
        method: "DELETE",
      })
      toast.success(response.message)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete permission")
    }
  }

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Access Control", "Permissions"]}
        title="Permissions"
        description="Manage low-level access rules."
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New permission
          </Button>
        }
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <AccessSearchField value={search} onChange={(value) => {
            setSearch(value)
            setPage(1)
          }} placeholder="Search permission name or guard" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value))
                setPage(1)
              }}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              {[10, 20, 30, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{data?.pagination.total ?? 0} permissions in the registry</p>
      </AccessToolbar>

      <AccessCard title="Permission Registry" description="Review and maintain granular actions.">
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all permissions" /></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Guard Name</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.id} className="border-t border-border/70">
                  <td className="px-4 py-3 align-top">
                    <input type="checkbox" aria-label={`Select ${permission.name}`} />
                  </td>
                  <td className="px-4 py-3 font-medium">{permission.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{permission.guardName}</td>
                  <td className="px-4 py-3">
                    <Pill variant="secondary" className="bg-primary/10 text-primary">
                      {permission.groupKey.replaceAll("_", " ")}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(permission)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete permission</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove the {permission.name} permission.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDelete(permission)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && permissions.length === 0 ? (
            <div className="p-4">
              <TableEmpty title="No permissions found" description="Create a permission to begin managing granular access rules." />
            </div>
          ) : null}
          {isLoading ? <TableSkeleton columns={5} rows={5} /> : null}
          {data?.pagination ? (
            <PaginationControls
              page={data.pagination.page}
              pages={data.pagination.pages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </TableShell>
      </AccessCard>

      <Sheet open={open} onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          form.reset(permissionDefaults)
          setEditingPermission(null)
        }
      }}>
        <SheetContent side="right" className="w-[96vw] max-w-[34rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle>{editingPermission ? "Edit permission" : "Create permission"}</SheetTitle>
            <p className="text-sm text-muted-foreground">Keep permissions structured and easy to scan.</p>
          </SheetHeader>

          <form onSubmit={onSubmit} className="space-y-5 p-6">
            <AccessCard title="Permission Details" description="Name the action and attach it to the correct guard and group.">
              <div className="space-y-4">
                <FieldBlock label="Name" error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} placeholder="users.view" />
                </FieldBlock>
                <FieldBlock label="Guard Name" error={form.formState.errors.guardName?.message}>
                  <Input {...form.register("guardName")} placeholder="web" />
                </FieldBlock>
                <FieldBlock label="Group" error={form.formState.errors.groupKey?.message}>
                  <Input {...form.register("groupKey")} placeholder="users" />
                </FieldBlock>
              </div>
            </AccessCard>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <KeyRound className="h-4 w-4 text-primary" />
                <span>Permission names should stay compact, readable, and consistent.</span>
              </div>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting ? "Saving..." : editingPermission ? "Save changes" : "Create permission"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
