"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
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
import { useAccessRoles, type AccessRoleRecord } from "@/lib/swr"
import { roleSchema } from "@/lib/validations/access-control"

type RoleFormValues = z.input<typeof roleSchema>

const roleDefaults: RoleFormValues = {
  name: "",
  guardName: "web",
  permissionIds: [],
}

export function AccessControlRolesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<AccessRoleRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data, mutate, isLoading } = useAccessRoles({ page, limit, search })
  const roles = data?.roles ?? []
  const permissions = data?.permissions ?? []

  const permissionGroups = useMemo(() => {
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const key = permission.groupKey
      groups[key] = [...(groups[key] ?? []), permission]
      return groups
    }, {})
  }, [permissions])

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: roleDefaults,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  })

  const selectedPermissionIds = form.watch("permissionIds") ?? []

  const openCreate = () => {
    form.reset(roleDefaults)
    setEditingRole(null)
    setOpen(true)
  }

  const openEdit = (role: AccessRoleRecord) => {
    form.reset({
      name: role.name,
      guardName: role.guardName,
      permissionIds: role.permissions.map((permission) => permission.id),
    })
    setEditingRole(role)
    setOpen(true)
  }

  const togglePermission = (permissionId: string) => {
    const current = form.getValues("permissionIds") ?? []
    const next = current.includes(permissionId)
      ? current.filter((entry) => entry !== permissionId)
      : [...current, permissionId]
    form.setValue("permissionIds", next, { shouldValidate: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const response = await apiRequest<{ message: string }>(
        editingRole ? `/api/v1/access-control/roles/${editingRole.id}` : "/api/v1/access-control/roles",
        {
          method: editingRole ? "PUT" : "POST",
          body: values,
        },
      )

      toast.success(response.message)
      setOpen(false)
      setEditingRole(null)
      form.reset(roleDefaults)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save role")
    } finally {
      setSubmitting(false)
    }
  })

  const handleDelete = async (role: AccessRoleRecord) => {
    try {
      const response = await apiRequest<{ message: string }>(`/api/v1/access-control/roles/${role.id}`, {
        method: "DELETE",
      })
      toast.success(response.message)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete role")
    }
  }

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Access Control", "Roles"]}
        title="Roles"
        description="Define grouped access profiles."
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New role
          </Button>
        }
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <AccessSearchField value={search} onChange={(value) => {
            setSearch(value)
            setPage(1)
          }} placeholder="Search role name or guard" />
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
        <p className="text-sm text-muted-foreground">{data?.pagination.total ?? 0} roles configured</p>
      </AccessToolbar>

      <AccessCard title="Role Directory" description="Review and maintain role groups.">
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all roles" /></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Guard Name</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-t border-border/70">
                  <td className="px-4 py-3 align-top">
                    <input type="checkbox" aria-label={`Select ${role.name}`} />
                  </td>
                  <td className="px-4 py-3 font-medium">{role.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role.guardName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 4).map((permission) => (
                        <Pill key={permission.id} variant="secondary" className="bg-primary/10 text-primary">
                          {permission.name}
                        </Pill>
                      ))}
                      {role.permissions.length > 4 ? (
                        <Pill variant="outline">+{role.permissions.length - 4} more</Pill>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(role)}>
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
                            <AlertDialogTitle>Delete role</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove the {role.name} role.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDelete(role)}>
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
          {!isLoading && roles.length === 0 ? (
            <div className="p-4">
              <TableEmpty title="No roles found" description="Create a new role to start grouping access control rules." />
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
          form.reset(roleDefaults)
          setEditingRole(null)
        }
      }}>
        <SheetContent side="right" className="w-[96vw] max-w-[42rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle>{editingRole ? "Edit role" : "Create role"}</SheetTitle>
            <p className="text-sm text-muted-foreground">Build role-based access groups.</p>
          </SheetHeader>

          <form onSubmit={onSubmit} className="space-y-5 p-6">
            <AccessCard title="Role Details" description="Name the role and keep the guard consistent.">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Name" error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} placeholder="Manager" />
                </FieldBlock>
                <FieldBlock label="Guard Name" error={form.formState.errors.guardName?.message}>
                  <Input {...form.register("guardName")} placeholder="web" />
                </FieldBlock>
              </div>
            </AccessCard>

            <AccessCard title="Permissions" description="Select the permissions this role should inherit.">
              <div className="space-y-5">
                <div className="space-y-4">
                  {Object.entries(permissionGroups).map(([groupKey, groupedPermissions]) => (
                    <div key={groupKey} className="rounded-2xl border border-border/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{groupKey.replaceAll("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{groupedPermissions.length} available permissions</p>
                        </div>
                        <Pill variant="outline">{groupedPermissions.filter((permission) => selectedPermissionIds.includes(permission.id)).length} selected</Pill>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {groupedPermissions.map((permission) => {
                          const selected = selectedPermissionIds.includes(permission.id)

                          return (
                            <button
                              key={permission.id}
                              type="button"
                              onClick={() => togglePermission(permission.id)}
                              className={`rounded-xl border px-3 py-3 text-left transition ${
                                selected
                                  ? "border-[#2f8fe8]/25 bg-[#2f8fe8]/10"
                                  : "border-border/70 hover:border-[#2f8fe8]/15 hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{permission.name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">Guard: {permission.guardName}</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  readOnly
                                  className="mt-1 h-4 w-4"
                                />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccessCard>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>{selectedPermissionIds.length} permissions selected for this role.</span>
              </div>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting ? "Saving..." : editingRole ? "Save changes" : "Create role"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
