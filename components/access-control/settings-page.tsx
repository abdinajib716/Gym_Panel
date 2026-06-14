"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Send, WalletCards } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { z } from "zod"

import {
  AccessCard,
  AccessPageHeader,
  FieldBlock,
  SelectField,
  TableSkeleton,
} from "@/components/access-control/shared"
import { LocalImageUpload } from "@/components/access-control/local-image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from "@/lib/client-api"
import { useAccessSettings, useWaafiConfig } from "@/lib/swr"
import { settingsSchema } from "@/lib/validations/access-control"

type SettingsFormValues = z.input<typeof settingsSchema>

const defaultValues: SettingsFormValues = {
  siteName: "Startap Admin",
  siteLogoFullLight: "",
  siteIcon: "",
  siteLogoFullDark: "",
  siteFavicon: "",
  loginPageLogo: "",
  themeMode: "system",
  primaryColor: "#2f8fe8",
  sidebarStyle: "default",
  layoutWidth: "boxed",
  headerStyle: "sticky",
  mailDriver: "smtp",
  fromName: "Startap Admin",
  fromEmail: "hello@startap.dev",
  smtpHost: "smtp.mailtrap.io",
  smtpPort: 587,
  smtpUsername: "mailer-user",
  smtpPassword: "mailer-password",
  encryption: "tls",
  firebaseEnabled: false,
  firebaseProjectId: "",
  firebaseClientEmail: "",
  firebasePrivateKey: "",
  firebaseServerKey: "",
}

const waafiDefaults = {
  waafiEnabled: false,
  waafiEnvironment: "test",
  waafiApiBaseUrl: "",
  waafiMerchantUid: "",
  waafiApiUserId: "",
  waafiApiKey: "",
  waafiMerchantNumber: "",
}

type WaafiTestResponse = {
  ok: boolean
  httpOk?: boolean
  waafiOk?: boolean
  status: number
  statusText?: string
  contentType?: string
  url?: string
  message: string
  request?: {
    requestId: string
    provider: string
    phoneNumber: string
    amount: number
    currency: string
  }
  sentPayload?: unknown
  waafiResponse?: unknown
  rawResponse?: string
}

type FirebaseTestResponse = {
  success: boolean
  message: string
  dryRun: boolean
  target: string
  messageId: string
}

function getWaafiToastMessage(response: WaafiTestResponse) {
  if (response.message) return response.message
  const waafiResponse = response.waafiResponse

  if (waafiResponse && typeof waafiResponse === "object") {
    const payload = waafiResponse as { responseMsg?: unknown; params?: { description?: unknown } }
    if (typeof payload.responseMsg === "string") return payload.responseMsg
    if (typeof payload.params?.description === "string") return payload.params.description
  }

  return response.ok ? "WaafiPay test request sent" : "WaafiPay test request failed"
}

function hydrateSettings(settings?: Partial<Record<keyof SettingsFormValues, unknown>> | null): SettingsFormValues {
  const source = (settings ?? {}) as Partial<SettingsFormValues>

  return {
    ...defaultValues,
    ...source,
    siteLogoFullLight: (source.siteLogoFullLight as string | null | undefined) ?? "",
    siteIcon: (source.siteIcon as string | null | undefined) ?? "",
    siteLogoFullDark: (source.siteLogoFullDark as string | null | undefined) ?? "",
    siteFavicon: (source.siteFavicon as string | null | undefined) ?? "",
    loginPageLogo: (source.loginPageLogo as string | null | undefined) ?? "",
    fromName: (source.fromName as string | null | undefined) ?? "",
    fromEmail: (source.fromEmail as string | null | undefined) ?? "",
    smtpHost: (source.smtpHost as string | null | undefined) ?? "",
    smtpPort: (source.smtpPort as number | null | undefined) ?? 587,
    smtpUsername: (source.smtpUsername as string | null | undefined) ?? "",
    smtpPassword: (source.smtpPassword as string | null | undefined) ?? "",
    firebaseEnabled: (source.firebaseEnabled as boolean | null | undefined) ?? false,
    firebaseProjectId: (source.firebaseProjectId as string | null | undefined) ?? "",
    firebaseClientEmail: (source.firebaseClientEmail as string | null | undefined) ?? "",
    firebasePrivateKey: (source.firebasePrivateKey as string | null | undefined) ?? "",
    firebaseServerKey: (source.firebaseServerKey as string | null | undefined) ?? "",
  }
}

export function AccessControlSettingsPage() {
  const { data, isLoading } = useAccessSettings()
  const { data: waafiData, mutate: mutateWaafi } = useWaafiConfig()
  const { mutate: mutateCache } = useSWRConfig()
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingFirebase, setIsTestingFirebase] = useState(false)
  const [isSavingWaafi, setIsSavingWaafi] = useState(false)
  const [waafiValues, setWaafiValues] = useState(waafiDefaults)
  const [waafiTestPhone, setWaafiTestPhone] = useState("")
  const [waafiTestAmount, setWaafiTestAmount] = useState("0.01")
  const [waafiTestResult, setWaafiTestResult] = useState<WaafiTestResponse | null>(null)
  const [firebaseTestResult, setFirebaseTestResult] = useState<FirebaseTestResponse | null>(null)
  const settingsResetKeyRef = useRef<string | null>(null)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
  })

  useEffect(() => {
    if (!data?.settings) return
    const resetKey = `${data.settings.id}:${data.settings.updatedAt ?? ""}`
    if (settingsResetKeyRef.current === resetKey) return
    if (settingsResetKeyRef.current && form.formState.isDirty) return

    settingsResetKeyRef.current = resetKey
    form.reset(hydrateSettings(data.settings))
  }, [data, form])

  useEffect(() => {
    if (!waafiData?.config) return
    setWaafiValues({
      waafiEnabled: waafiData.config.waafiEnabled,
      waafiEnvironment: waafiData.config.waafiEnvironment,
      waafiApiBaseUrl: waafiData.config.waafiApiBaseUrl ?? "",
      waafiMerchantUid: waafiData.config.waafiMerchantUid ?? "",
      waafiApiUserId: waafiData.config.waafiApiUserId ?? "",
      waafiApiKey: "",
      waafiMerchantNumber: waafiData.config.waafiMerchantNumber ?? "",
    })
  }, [waafiData])

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true)
    try {
      const response = await apiRequest<{ message: string; settings: SettingsFormValues & { id?: string; updatedAt?: string } }>("/api/v1/access-control/settings", {
        method: "PUT",
        body: values,
      })
      const nextSettings = hydrateSettings(response.settings)
      settingsResetKeyRef.current = response.settings.id ? `${response.settings.id}:${response.settings.updatedAt ?? ""}` : settingsResetKeyRef.current
      form.reset(nextSettings)
      toast.success(response.message)
      mutateCache("/api/v1/access-control/settings", { settings: response.settings }, false)
      mutateCache("/api/v1/access-control/branding", {
        branding: {
          siteName: response.settings.siteName,
          siteLogoFullLight: response.settings.siteLogoFullLight,
          siteLogoFullDark: response.settings.siteLogoFullDark,
          siteIcon: response.settings.siteIcon,
        },
      }, false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  })

  const handleTestEmail = async () => {
    setIsTesting(true)
    try {
      const response = await apiRequest<{ message: string }>("/api/v1/access-control/settings/test-email", {
        method: "POST",
        body: {
          toEmail: form.getValues("fromEmail"),
        },
      })
      toast.success(response.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send test email")
    } finally {
      setIsTesting(false)
    }
  }

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true)
    try {
      const response = await apiRequest<FirebaseTestResponse>("/api/v1/access-control/settings/test-firebase", {
        method: "POST",
      })
      setFirebaseTestResult(response)
      toast.success(response.message)
    } catch (error) {
      setFirebaseTestResult(null)
      toast.error(error instanceof Error ? error.message : "Failed to test Firebase connection")
    } finally {
      setIsTestingFirebase(false)
    }
  }

  const updateWaafiValue = (key: keyof typeof waafiDefaults, value: string | boolean) => {
    setWaafiValues((current) => ({ ...current, [key]: value }))
  }

  const handleSaveWaafi = async () => {
    setIsSavingWaafi(true)
    try {
      const response = await apiRequest<{ message: string }>("/api/v1/settings/waafi-config", {
        method: "PUT",
        body: waafiValues,
      })
      toast.success(response.message)
      mutateWaafi()
      setWaafiValues((current) => ({ ...current, waafiApiKey: "" }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Waafi configuration")
    } finally {
      setIsSavingWaafi(false)
    }
  }

  const handleTestWaafi = async () => {
    setIsTesting(true)
    try {
      const response = await apiRequest<WaafiTestResponse>("/api/v1/settings/waafi-config/test", {
        method: "POST",
        body: {
          phoneLocal: waafiTestPhone,
          amount: Number(waafiTestAmount),
          provider: "EVC_PLUS",
        },
      })
      setWaafiTestResult(response)
      const toastMessage = getWaafiToastMessage(response)
      if (response.ok) {
        toast.success(toastMessage)
      } else {
        toast.error(toastMessage)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to test WaafiPay connection")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-5">
        <AccessPageHeader
          breadcrumb={["Dashboard", "Access Control", "Settings"]}
          title="Settings"
          description="Manage branding, appearance, and email settings."
        />
        <Skeleton className="h-12 rounded-xl" />
        <AccessCard title="Loading settings" description="Preparing configuration controls.">
          <TableSkeleton columns={2} rows={4} />
        </AccessCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Access Control", "Settings"]}
        title="Settings"
        description="Manage branding, appearance, and email settings."
        action={
          <Button type="submit" form="access-settings-form" className="gap-2">
            {isSaving ? <Spinner /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        }
      />
      <form id="access-settings-form" onSubmit={onSubmit} className="space-y-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start rounded-[1.2rem] border border-border/70 bg-card p-2">
            <TabsTrigger value="general" className="min-w-[10rem] flex-none rounded-xl px-4 py-2.5">
              General Settings
            </TabsTrigger>
            <TabsTrigger value="appearance" className="min-w-[10rem] flex-none rounded-xl px-4 py-2.5">
              Site Appearance
            </TabsTrigger>
            <TabsTrigger value="email" className="min-w-[10rem] flex-none rounded-xl px-4 py-2.5">
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="firebase" className="min-w-[10rem] flex-none rounded-xl px-4 py-2.5">
              Firebase Config
            </TabsTrigger>
            <TabsTrigger value="waafi" className="min-w-[10rem] flex-none rounded-xl px-4 py-2.5">
              Waafi Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-5">
            <AccessCard
              title="General Settings"
              description="Branding assets used across the system."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Site Name" error={form.formState.errors.siteName?.message}>
                  <Input {...form.register("siteName")} placeholder="Startap Admin" />
                </FieldBlock>
                <Controller
                  control={form.control}
                  name="siteLogoFullLight"
                  render={({ field }) => (
                    <LocalImageUpload
                      label="Site Logo Full (Lite Version)"
                      value={field.value ?? ""}
                      error={form.formState.errors.siteLogoFullLight?.message}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="siteIcon"
                  render={({ field }) => (
                    <LocalImageUpload
                      label="Site Icon"
                      value={field.value ?? ""}
                      error={form.formState.errors.siteIcon?.message}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="siteLogoFullDark"
                  render={({ field }) => (
                    <LocalImageUpload
                      label="Site Logo Full (Dark Version)"
                      value={field.value ?? ""}
                      error={form.formState.errors.siteLogoFullDark?.message}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="siteFavicon"
                  render={({ field }) => (
                    <LocalImageUpload
                      label="Site Favicon"
                      value={field.value ?? ""}
                      error={form.formState.errors.siteFavicon?.message}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="loginPageLogo"
                  render={({ field }) => (
                    <LocalImageUpload
                      label="Login Page Logo"
                      value={field.value ?? ""}
                      error={form.formState.errors.loginPageLogo?.message}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </AccessCard>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-5">
            <AccessCard
              title="Site Appearance"
              description="Control the shell look and feel."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <FieldBlock label="Theme mode" error={form.formState.errors.themeMode?.message}>
                  <Controller
                    control={form.control}
                    name="themeMode"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "System", value: "system" },
                          { label: "Light", value: "light" },
                          { label: "Dark", value: "dark" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Primary color" error={form.formState.errors.primaryColor?.message}>
                  <Controller
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Input {...field} placeholder="#2f8fe8" />
                        <input
                          type="color"
                          value={field.value || "#2f8fe8"}
                          onChange={field.onChange}
                          className="h-10 w-12 rounded-md border border-border bg-transparent p-1"
                        />
                      </div>
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Sidebar style" error={form.formState.errors.sidebarStyle?.message}>
                  <Controller
                    control={form.control}
                    name="sidebarStyle"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "Default", value: "default" },
                          { label: "Compact", value: "compact" },
                          { label: "Floating", value: "floating" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Layout width" error={form.formState.errors.layoutWidth?.message}>
                  <Controller
                    control={form.control}
                    name="layoutWidth"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "Boxed", value: "boxed" },
                          { label: "Full Width", value: "full" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Header style" error={form.formState.errors.headerStyle?.message}>
                  <Controller
                    control={form.control}
                    name="headerStyle"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "Sticky", value: "sticky" },
                          { label: "Static", value: "static" },
                          { label: "Minimal", value: "minimal" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
              </div>
            </AccessCard>
          </TabsContent>

          <TabsContent value="email" className="space-y-5">
            <AccessCard
              title="Email Configuration"
              description="Configure outbound mail behavior."
              action={
                <Button type="button" variant="outline" className="gap-2" onClick={handleTestEmail}>
                  {isTesting ? <Spinner /> : <Send className="h-4 w-4" />}
                  {isTesting ? "Testing..." : "Test Email"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Mailer / driver" error={form.formState.errors.mailDriver?.message}>
                  <Controller
                    control={form.control}
                    name="mailDriver"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "SMTP", value: "smtp" },
                          { label: "Sendmail", value: "sendmail" },
                          { label: "Resend", value: "resend" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Encryption" error={form.formState.errors.encryption?.message}>
                  <Controller
                    control={form.control}
                    name="encryption"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { label: "TLS", value: "tls" },
                          { label: "SSL", value: "ssl" },
                          { label: "None", value: "none" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="From name" error={form.formState.errors.fromName?.message}>
                  <Input {...form.register("fromName")} placeholder="Startap Admin" />
                </FieldBlock>
                <FieldBlock label="From email" error={form.formState.errors.fromEmail?.message}>
                  <Input {...form.register("fromEmail")} placeholder="hello@startap.dev" />
                </FieldBlock>
                <FieldBlock label="SMTP host" error={form.formState.errors.smtpHost?.message}>
                  <Input {...form.register("smtpHost")} placeholder="smtp.mailtrap.io" />
                </FieldBlock>
                <FieldBlock label="SMTP port" error={form.formState.errors.smtpPort?.message?.toString()}>
                  <Input type="number" {...form.register("smtpPort", { valueAsNumber: true })} placeholder="587" />
                </FieldBlock>
                <FieldBlock label="SMTP username" error={form.formState.errors.smtpUsername?.message}>
                  <Input {...form.register("smtpUsername")} placeholder="mailer-user" />
                </FieldBlock>
                <FieldBlock label="SMTP password" error={form.formState.errors.smtpPassword?.message}>
                  <Input type="password" {...form.register("smtpPassword")} placeholder="SMTP password" />
                </FieldBlock>
              </div>
            </AccessCard>
          </TabsContent>

          <TabsContent value="firebase" className="space-y-5">
            <AccessCard
              title="Firebase Config"
              description="Configure Firebase Cloud Messaging for member and trainer push notifications."
              action={
                <Button type="button" variant="outline" className="gap-2" onClick={handleTestFirebase} disabled={isTestingFirebase}>
                  {isTestingFirebase ? <Spinner /> : <Send className="h-4 w-4" />}
                  {isTestingFirebase ? "Testing..." : "Test Firebase"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Enable Firebase">
                  <Controller
                    control={form.control}
                    name="firebaseEnabled"
                    render={({ field }) => (
                      <SelectField
                        value={field.value ? "true" : "false"}
                        onChange={(value) => field.onChange(value === "true")}
                        options={[
                          { label: "Disabled", value: "false" },
                          { label: "Enabled", value: "true" },
                        ]}
                      />
                    )}
                  />
                </FieldBlock>
                <FieldBlock label="Project ID" error={form.formState.errors.firebaseProjectId?.message}>
                  <Input {...form.register("firebaseProjectId")} placeholder="firebase-project-id" />
                </FieldBlock>
                <FieldBlock label="Client Email" error={form.formState.errors.firebaseClientEmail?.message}>
                  <Input {...form.register("firebaseClientEmail")} placeholder="firebase-adminsdk@example.iam.gserviceaccount.com" />
                </FieldBlock>
                <FieldBlock label="Server Key" error={form.formState.errors.firebaseServerKey?.message}>
                  <Input type="password" {...form.register("firebaseServerKey")} placeholder="Firebase server key" />
                </FieldBlock>
                <div className="md:col-span-2">
                  <FieldBlock label="Private Key" error={form.formState.errors.firebasePrivateKey?.message}>
                    <textarea
                      {...form.register("firebasePrivateKey")}
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                    />
                  </FieldBlock>
                </div>
              </div>
              {firebaseTestResult ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">{firebaseTestResult.message}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-emerald-700">Mode</p>
                      <p className="font-medium">{firebaseTestResult.dryRun ? "Dry run validation" : "Live send"}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700">Target</p>
                      <p className="break-all font-medium">{firebaseTestResult.target}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700">Message ID</p>
                      <p className="break-all font-medium">{firebaseTestResult.messageId}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </AccessCard>
          </TabsContent>

          <TabsContent value="waafi" className="space-y-5">
            <AccessCard
              title="Waafi Config"
              description="Configure WaafiPay credentials and online payment behavior."
              action={
                <Button type="button" className="gap-2" onClick={handleSaveWaafi} disabled={isSavingWaafi}>
                  {isSavingWaafi ? <Spinner /> : <Save className="h-4 w-4" />}
                  {isSavingWaafi ? "Saving..." : "Save Waafi"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Enable WaafiPay">
                  <SelectField
                    value={waafiValues.waafiEnabled ? "true" : "false"}
                    onChange={(value) => updateWaafiValue("waafiEnabled", value === "true")}
                    options={[
                      { label: "Disabled", value: "false" },
                      { label: "Enabled", value: "true" },
                    ]}
                  />
                </FieldBlock>
                <FieldBlock label="Environment Mode">
                  <SelectField
                    value={waafiValues.waafiEnvironment}
                    onChange={(value) => updateWaafiValue("waafiEnvironment", value)}
                    options={[
                      { label: "Test", value: "test" },
                      { label: "Live", value: "live" },
                    ]}
                  />
                </FieldBlock>
                <FieldBlock label="API Base URL">
                  <Input value={waafiValues.waafiApiBaseUrl} onChange={(event) => updateWaafiValue("waafiApiBaseUrl", event.target.value)} placeholder="https://api.waafipay.net/asm" />
                </FieldBlock>
                <FieldBlock label="Merchant UID">
                  <Input value={waafiValues.waafiMerchantUid} onChange={(event) => updateWaafiValue("waafiMerchantUid", event.target.value)} placeholder="M1234567" />
                </FieldBlock>
                <FieldBlock label="API User ID">
                  <Input value={waafiValues.waafiApiUserId} onChange={(event) => updateWaafiValue("waafiApiUserId", event.target.value)} placeholder="API-123456789ABC" />
                </FieldBlock>
                <FieldBlock label="API Key" hint={waafiData?.config.waafiApiKeyConfigured ? "API key is saved. Leave blank to keep it unchanged." : "API key is not configured."}>
                  <Input type="password" value={waafiValues.waafiApiKey} onChange={(event) => updateWaafiValue("waafiApiKey", event.target.value)} placeholder="Hidden API key" />
                </FieldBlock>
                <FieldBlock label="Merchant Number">
                  <Input value={waafiValues.waafiMerchantNumber} onChange={(event) => updateWaafiValue("waafiMerchantNumber", event.target.value)} placeholder="252..." />
                </FieldBlock>
              </div>
            </AccessCard>

            <AccessCard
              title="Test Connection"
              description="Send a test payment request to WaafiPay. The customer phone receives the trigger, and the server waits up to 90 seconds for Waafi's response."
              action={
                <Button type="button" variant="outline" className="gap-2" onClick={handleTestWaafi} disabled={isTesting}>
                  {isTesting ? <Spinner /> : <WalletCards className="h-4 w-4" />}
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Phone number">
                  <div className="flex">
                    <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">252</span>
                    <Input
                      value={waafiTestPhone}
                      onChange={(event) => setWaafiTestPhone(event.target.value.replace(/\D/g, "").slice(0, 9))}
                      className="rounded-l-none"
                      placeholder="619821172"
                    />
                  </div>
                </FieldBlock>
                <FieldBlock label="Amount">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={waafiTestAmount}
                    onChange={(event) => setWaafiTestAmount(event.target.value)}
                    placeholder="0.01"
                  />
                </FieldBlock>
              </div>
              {waafiTestResult ? (
                <div className="mt-5 space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">HTTP status</p>
                      <p className="font-medium">
                        {waafiTestResult.httpOk ? "Accepted" : "Failed"} ({waafiTestResult.status}{waafiTestResult.statusText ? ` ${waafiTestResult.statusText}` : ""})
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Waafi status</p>
                      <p className="font-medium">{waafiTestResult.waafiOk ? "Approved" : "Not approved"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {waafiTestResult.request?.amount ?? "-"} {waafiTestResult.request?.currency ?? ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Endpoint</p>
                      <p className="break-all font-medium">{waafiTestResult.url ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Request ID</p>
                      <p className="break-all font-medium">{waafiTestResult.request?.requestId ?? "-"}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sent payload</p>
                      <pre className="max-h-64 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                        {JSON.stringify(waafiTestResult.sentPayload ?? {}, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Waafi response</p>
                      <pre className="max-h-64 overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
                        {typeof waafiTestResult.waafiResponse === "string"
                          ? waafiTestResult.waafiResponse || waafiTestResult.rawResponse || ""
                          : JSON.stringify(waafiTestResult.waafiResponse ?? waafiTestResult.rawResponse ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}
            </AccessCard>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading current settings..." : "Changes are saved to the shared global access-control configuration record."}
          </p>
          <Button type="submit" className="gap-2">
            {isSaving ? <Spinner /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
