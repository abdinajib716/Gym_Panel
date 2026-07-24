"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Plus, Users } from "lucide-react"
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
import { LocalImageUpload } from "@/components/access-control/local-image-upload"
import { RowActions, defaultActionIcons } from "@/components/access-control/row-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { apiRequest } from "@/lib/client-api"
import { useAccessUsers, type AccessUserRecord } from "@/lib/swr"
import { createUserSchema } from "@/lib/validations/access-control"

type UserFormValues = z.infer<typeof createUserSchema>

const userDefaults: UserFormValues = {
  avatarUrl: "",
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  displayName: "",
  roleIds: [],
}

export function AccessControlUsersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AccessUserRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { data, mutate, isLoading } = useAccessUsers({ page, limit, search })
  const users = data?.users ?? []
  const roles = data?.roles ?? []

  const form = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: userDefaults,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  })

  const selectedRoleIds = form.watch("roleIds") ?? []

  const selectedRoleText = useMemo(() => {
    const selectedRoleId = selectedRoleIds[0]
    if (!selectedRoleId) return "No role assigned yet"
    return roles.find((role) => role.id === selectedRoleId)?.name ?? "Selected role"
  }, [roles, selectedRoleIds])

  const openCreate = () => {
    setEditingUser(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    form.reset(userDefaults)
    setOpen(true)
  }

  const openEdit = (user: AccessUserRecord) => {
    setEditingUser(user)
    setShowPassword(false)
    setShowConfirmPassword(false)
    form.reset({
      avatarUrl: user.avatarUrl ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      password: "",
      confirmPassword: "",
      displayName: user.displayName ?? "",
      roleIds: user.roles.slice(0, 1).map((role) => role.id),
    })
    setOpen(true)
  }

  const selectRole = (roleId: string) => {
    form.setValue("roleIds", [roleId], { shouldValidate: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const endpoint = editingUser
        ? `/api/v1/access-control/users/${editingUser.id}`
        : "/api/v1/access-control/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await apiRequest<{ message: string }>(endpoint, {
        method,
        body: values,
      })

      toast.success(response.message)
      setOpen(false)
      form.reset(userDefaults)
      setEditingUser(null)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save user")
    } finally {
      setSubmitting(false)
    }
  })

  const handleDelete = async (user: AccessUserRecord) => {
    try {
      const response = await apiRequest<{ message: string }>(`/api/v1/access-control/users/${user.id}`, {
        method: "DELETE",
      })
      toast.success(response.message)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    }
  }

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Access Control", "Users"]}
        title="Users"
        description="Manage users and role assignments."
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <AccessSearchField value={search} onChange={(value) => {
            setSearch(value)
            setPage(1)
          }} placeholder="Search by name, username, or email" />
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
        <p className="text-sm text-muted-foreground">
          {data?.pagination.total ?? 0} users in the access directory
        </p>
      </AccessToolbar>

      <AccessCard
        title="User Directory"
        description="Search, edit, and manage accounts."
      >
        <TableShell>
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all users" /></th>
                <th className="px-4 py-3">Avatar</th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border/70">
                  <td className="px-4 py-3 align-top">
                    <input type="checkbox" aria-label={`Select ${user.firstName} ${user.lastName}`} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Avatar className="h-10 w-10 ring-1 ring-border/80">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? user.firstName} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(user.firstName[0] ?? "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="px-4 py-3 font-medium">{user.firstName}</td>
                  <td className="px-4 py-3">{user.lastName}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <Pill key={role.id} variant="secondary" className="bg-primary/10 text-primary">
                          {role.name}
                        </Pill>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <RowActions
                        label={`Actions for ${user.firstName} ${user.lastName}`}
                        actions={[
                          { label: "Edit", icon: defaultActionIcons.edit, onClick: () => openEdit(user) },
                          {
                            label: "Delete",
                            icon: defaultActionIcons.delete,
                            destructive: true,
                            separatorBefore: true,
                            onClick: () => handleDelete(user),
                            confirm: {
                              title: "Delete user",
                              description: `This will permanently remove ${user.firstName} ${user.lastName} from the access registry.`,
                            },
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && users.length === 0 ? (
            <div className="p-4">
              <TableEmpty title="No users found" description="Try a different search or create a new user to populate the directory." />
            </div>
          ) : null}
          {isLoading ? <TableSkeleton columns={8} rows={5} /> : null}
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
          form.reset(userDefaults)
          setEditingUser(null)
        }
      }}>
        <SheetContent side="right" className="w-[96vw] max-w-[42rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle>{editingUser ? "Edit user" : "Create user"}</SheetTitle>
            <p className="text-sm text-muted-foreground">Manage personal details, credentials, and roles.</p>
          </SheetHeader>

          <form onSubmit={onSubmit} className="space-y-5 p-6">
            <AccessCard title="Personal Information" description="Core account details.">
              <div className="grid gap-4 md:grid-cols-2">
                <LocalImageUpload
                  label="Avatar"
                  hint="Upload avatar (Max 2MB). Images will be automatically optimized to WebP format."
                  value={form.watch("avatarUrl")}
                  error={form.formState.errors.avatarUrl?.message}
                  onChange={(value) => form.setValue("avatarUrl", value, { shouldValidate: true })}
                />
                <FieldBlock
                  label="Display Name"
                  error={form.formState.errors.displayName?.message}
                >
                  <Input {...form.register("displayName")} placeholder="Optional display name" />
                </FieldBlock>
                <FieldBlock label="First Name" error={form.formState.errors.firstName?.message}>
                  <Input {...form.register("firstName")} placeholder="First name" />
                </FieldBlock>
                <FieldBlock label="Last Name" error={form.formState.errors.lastName?.message}>
                  <Input {...form.register("lastName")} placeholder="Last name" />
                </FieldBlock>
                <FieldBlock label="Username" error={form.formState.errors.username?.message}>
                  <Input {...form.register("username")} placeholder="Username" />
                </FieldBlock>
                <FieldBlock label="User Email" error={form.formState.errors.email?.message}>
                  <Input {...form.register("email")} placeholder="name@company.com" />
                </FieldBlock>
                <FieldBlock label="Password" error={form.formState.errors.password?.message}>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...form.register("password")}
                      placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 8 characters"}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FieldBlock>
                <FieldBlock label="Confirm Password" error={form.formState.errors.confirmPassword?.message}>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      {...form.register("confirmPassword")}
                      placeholder="Confirm password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FieldBlock>
              </div>
            </AccessCard>

            <AccessCard title="Permissions & Display" description="Assign exactly one role to this user.">
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const selected = selectedRoleIds.includes(role.id)

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => selectRole(role.id)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#2f8fe8]/25 bg-[#2f8fe8]/10 shadow-[0_16px_30px_-22px_rgba(47,143,232,0.9)]"
                            : "border-border/70 hover:border-[#2f8fe8]/15 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{role.permissions.length} linked permissions</p>
                          </div>
                          <input
                            type="radio"
                            checked={selected}
                            readOnly
                            name="access-user-role"
                            className="mt-1 h-4 w-4"
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
                {form.formState.errors.roleIds?.message ? (
                  <p className="text-xs font-medium text-destructive">{form.formState.errors.roleIds.message}</p>
                ) : null}
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Selected role: <span className="font-medium text-foreground">{selectedRoleText}</span>
                </div>
              </div>
            </AccessCard>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>Save this user to update the shared access registry and audit history.</span>
              </div>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting ? "Saving..." : editingUser ? "Save changes" : "Create user"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
