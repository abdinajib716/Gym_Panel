import Header from "./header"

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
	return (
		<main className="min-h-screen bg-background">
			<Header />
			{children}
		</main>
	)
}
