"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Calendar } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { type AccessBrandingRecord, useAccessBranding } from "@/lib/swr"
import { cn } from "@/lib/utils"

const BRANDING_STORAGE_KEY = "startap-admin-branding"

interface LogoProps {
	variant?: "default" | "compact"
	className?: string
	href?: string | null
}

export function Logo({ variant = "default", className, href = "/" }: LogoProps) {
	const { resolvedTheme } = useTheme()
	const { data } = useAccessBranding()
	const [storedBranding, setStoredBranding] = useState<AccessBrandingRecord | null>(null)
	const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

	useEffect(() => {
		if (typeof window === "undefined") return

		try {
			const cached = window.localStorage.getItem(BRANDING_STORAGE_KEY)
			if (!cached) return

			const parsed = JSON.parse(cached) as AccessBrandingRecord
			setStoredBranding(parsed)
		} catch {
			window.localStorage.removeItem(BRANDING_STORAGE_KEY)
		}
	}, [])

	useEffect(() => {
		if (typeof window === "undefined" || !data?.branding) return

		window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(data.branding))
		setStoredBranding(data.branding)
	}, [data])

	const branding = data?.branding ?? storedBranding
	const siteName = branding?.siteName || "Startap Admin"
	const rawLogoSrc = useMemo(
		() =>
			resolvedTheme === "dark"
				? branding?.siteLogoFullDark || branding?.siteLogoFullLight
				: branding?.siteLogoFullLight || branding?.siteLogoFullDark,
		[branding, resolvedTheme],
	)
	const rawIconSrc = branding?.siteIcon || branding?.siteLogoFullLight || branding?.siteLogoFullDark
	const logoSrc = rawLogoSrc && !failedImages[rawLogoSrc] ? rawLogoSrc : null
	const iconSrc = rawIconSrc && !failedImages[rawIconSrc] ? rawIconSrc : null
	const handleImageError = (src: string) => {
		setFailedImages((current) => ({ ...current, [src]: true }))
	}

	const logoContent = (
		<div className={cn("flex items-center gap-2", className)}>
			{variant === "compact" || !logoSrc ? (
				<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70">
					{iconSrc ? (
						<Image src={iconSrc} alt={siteName} width={40} height={40} className="h-full w-full object-cover" unoptimized onError={() => handleImageError(iconSrc)} />
					) : (
						<Calendar className="w-6 h-6 text-white" />
					)}
				</div>
			) : null}
			{variant === "default" ? (
				logoSrc ? (
					<Image
						src={logoSrc}
						alt={siteName}
						width={168}
						height={40}
						className="h-10 w-auto max-w-[11rem] object-contain"
						unoptimized
						onError={() => handleImageError(logoSrc)}
					/>
				) : (
					<span
						className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
						style={{ fontFamily: "var(--font-space-grotesk)" }}
					>
						{siteName}
					</span>
				)
			) : null}
		</div>
	)

	if (href) {
		return (
			<Link href={href} className="flex items-center">
				{logoContent}
			</Link>
		)
	}

	return logoContent
}
