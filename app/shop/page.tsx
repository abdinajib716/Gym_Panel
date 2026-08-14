import { PackageOpen, ShoppingBag } from "lucide-react"

import { PublicHeader } from "@/components/landing/public-header"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const products = await prisma.storeProduct.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ createdAt: "desc" }],
  })

  return <div className="min-h-svh bg-muted/40"><PublicHeader page="shop" /><main className="container py-12 sm:py-16"><div className="landing-reveal text-center"><p className="text-sm font-medium text-muted-foreground">AFLAXFINESS STORE</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Shop gym essentials</h1><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Browse products currently published by your gym. Sign in through the AflaxFiness mobile experience to purchase.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{products.length ? products.map((product) => <article key={product.id} className="landing-card overflow-hidden rounded-xl border bg-card shadow-sm"><div className="flex aspect-[4/3] items-center justify-center bg-muted">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <ShoppingBag className="size-10 text-muted-foreground" />}</div><div className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category || "Gym essential"}</p><h2 className="mt-1 text-lg font-semibold">{product.name}</h2></div><strong className="text-base">${Number(product.price).toFixed(2)}</strong></div>{product.description ? <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{product.description}</p> : null}<p className="text-xs font-medium text-muted-foreground">{product.availableQuantity > 0 ? `${product.availableQuantity} in stock` : "Out of stock"}</p></div></article>) : <div className="col-span-full grid place-items-center rounded-xl border border-dashed bg-background px-6 py-16 text-center"><PackageOpen className="size-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Store is being stocked</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Published gym products will appear here as soon as they are available.</p></div>}</div></main></div>
}
