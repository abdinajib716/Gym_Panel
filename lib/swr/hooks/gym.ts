"use client"

import useSWR from "swr"

import { fetcher } from "@/lib/swr/fetcher"

export type GymPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type GymListParams = {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  method?: string
  memberId?: string
  dateFrom?: string
  dateTo?: string
}

function buildQuery(params?: GymListParams) {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append("page", String(params.page))
  if (params?.limit) queryParams.append("limit", String(params.limit))
  if (params?.search) queryParams.append("search", params.search)
  if (params?.status) queryParams.append("status", params.status)
  if (params?.type) queryParams.append("type", params.type)
  if (params?.method) queryParams.append("method", params.method)
  if (params?.memberId) queryParams.append("memberId", params.memberId)
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom)
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo)
  const query = queryParams.toString()
  return query ? `?${query}` : ""
}

export function useGymDashboard() {
  return useSWR("/api/v1/dashboard", fetcher)
}

export function useMembers(params?: GymListParams) {
  return useSWR(`/api/v1/members${buildQuery(params)}`, fetcher)
}

export function useMembershipPlans(params?: GymListParams) {
  return useSWR(`/api/v1/membership-plans${buildQuery(params)}`, fetcher)
}

export function useSubscriptions(params?: GymListParams) {
  return useSWR(`/api/v1/subscriptions${buildQuery(params)}`, fetcher)
}

export function usePayments(params?: GymListParams) {
  return useSWR(`/api/v1/payments${buildQuery(params)}`, fetcher)
}

export function useAttendance(params?: GymListParams) {
  return useSWR(`/api/v1/attendance${buildQuery(params)}`, fetcher)
}

export function useNotifications(params?: GymListParams) {
  return useSWR(`/api/v1/notifications${buildQuery(params)}`, fetcher)
}

export function useTrainers(params?: GymListParams) {
  return useSWR(`/api/v1/trainers${buildQuery(params)}`, fetcher)
}

export function useReport(report: string, params?: GymListParams) {
  return useSWR(`/api/v1/reports/${report}${buildQuery(params)}`, fetcher)
}
