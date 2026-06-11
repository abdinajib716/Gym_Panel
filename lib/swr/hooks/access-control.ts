"use client"

import useSWR from "swr"

import { fetcher } from "@/lib/swr/fetcher"

export type AccessPermissionRecord = {
  id: string
  name: string
  guardName: string
  groupKey: string
  createdAt: string
  updatedAt: string
}

export type AccessRoleRecord = {
  id: string
  name: string
  guardName: string
  createdAt: string
  updatedAt: string
  permissions: AccessPermissionRecord[]
}

export type AccessUserRecord = {
  id: string
  avatarUrl: string | null
  firstName: string
  lastName: string
  username: string
  email: string
  displayName: string | null
  createdAt: string
  updatedAt: string
  roles: AccessRoleRecord[]
}

export type AccessSettingsRecord = {
  id: string
  key: string
  siteName: string
  siteLogoFullLight: string | null
  siteIcon: string | null
  siteLogoFullDark: string | null
  siteFavicon: string | null
  loginPageLogo: string | null
  themeMode: "light" | "dark" | "system"
  primaryColor: string
  sidebarStyle: "default" | "compact" | "floating"
  layoutWidth: "boxed" | "full"
  headerStyle: "sticky" | "static" | "minimal"
  mailDriver: "smtp" | "sendmail" | "resend"
  fromName: string | null
  fromEmail: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpPassword: string | null
  encryption: "none" | "ssl" | "tls"
  firebaseEnabled: boolean
  firebaseProjectId: string | null
  firebaseClientEmail: string | null
  firebasePrivateKey: string | null
  firebaseServerKey: string | null
  createdAt: string
  updatedAt: string
}

export type WaafiConfigRecord = {
  waafiEnabled: boolean
  waafiEnvironment: "test" | "live"
  waafiApiBaseUrl: string | null
  waafiMerchantUid: string | null
  waafiApiUserId: string | null
  waafiMerchantNumber: string | null
  waafiApiKeyConfigured: boolean
}

export type AccessActivityLogRecord = {
  id: string
  type: string
  activity: string
  subject: string
  subjectId?: string | null
  userId?: string | null
  userDisplay?: string | null
  metadata?: unknown
  createdAt: string
}

export type PaginationResponse = {
  total: number
  page: number
  limit: number
  pages: number
}

export type AccessSettingsResponse = {
  settings: AccessSettingsRecord
}

export type AccessBrandingRecord = Pick<
  AccessSettingsRecord,
  "siteName" | "siteLogoFullLight" | "siteLogoFullDark" | "siteIcon"
>

export type AccessBrandingResponse = {
  branding: AccessBrandingRecord | null
}

export type WaafiConfigResponse = {
  config: WaafiConfigRecord
}

export type AccessUsersResponse = {
  users: AccessUserRecord[]
  roles: AccessRoleRecord[]
  pagination: PaginationResponse
}

export type AccessRolesResponse = {
  roles: AccessRoleRecord[]
  permissions: AccessPermissionRecord[]
  pagination: PaginationResponse
}

export type AccessPermissionsResponse = {
  permissions: AccessPermissionRecord[]
  pagination: PaginationResponse
}

export type AccessActivityLogsResponse = {
  logs: AccessActivityLogRecord[]
  pagination: PaginationResponse
}

export function useAccessSettings() {
  return useSWR<AccessSettingsResponse>("/api/v1/access-control/settings", fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
}

export function useAccessBranding() {
  return useSWR<AccessBrandingResponse>("/api/v1/access-control/branding", fetcher)
}

export function useAccessUsers(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", String(params.page))
  if (params?.limit) queryParams.append("limit", String(params.limit))
  if (params?.search) queryParams.append("search", params.search)
  return useSWR<AccessUsersResponse>(`/api/v1/access-control/users?${queryParams.toString()}`, fetcher)
}

export function useAccessRoles(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", String(params.page))
  if (params?.limit) queryParams.append("limit", String(params.limit))
  if (params?.search) queryParams.append("search", params.search)
  return useSWR<AccessRolesResponse>(`/api/v1/access-control/roles?${queryParams.toString()}`, fetcher)
}

export function useAccessPermissions(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", String(params.page))
  if (params?.limit) queryParams.append("limit", String(params.limit))
  if (params?.search) queryParams.append("search", params.search)
  return useSWR<AccessPermissionsResponse>(`/api/v1/access-control/permissions?${queryParams.toString()}`, fetcher)
}

export function useAccessActivityLogs(params?: {
  page?: number
  limit?: number
  search?: string
  type?: string
  sort?: string
}) {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", String(params.page))
  if (params?.limit) queryParams.append("limit", String(params.limit))
  if (params?.search) queryParams.append("search", params.search)
  if (params?.type) queryParams.append("type", params.type)
  if (params?.sort) queryParams.append("sort", params.sort)
  return useSWR<AccessActivityLogsResponse>(`/api/v1/access-control/activity-logs?${queryParams.toString()}`, fetcher)
}

export function useWaafiConfig() {
  return useSWR<WaafiConfigResponse>("/api/v1/settings/waafi-config", fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
}
