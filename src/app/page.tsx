import { getCurrentUser } from "@/lib/session"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import RegisterView from "@/components/auth/RegisterView"

export default async function HomePage() {
  const user = await getCurrentUser()

  // Authenticated View
  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans">
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur top-0 sticky z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <ShieldCheck className="h-6 w-6 text-indigo-500" />
              <span className="text-primary">Zest</span>Auth
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden sm:inline-block">
                {user.email}
              </span>
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">Sign Out</Button>
              </form>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-bold">You're Authenticated!</h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Your account is successfully signed in to Zest Auth. This centralized authentication
              service keeps your credentials secure across all Zest Academy applications.
            </p>

            <div className="mt-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email:</span>
                  <span className="font-mono">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Display Name:</span>
                  <span>{user.name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email Verified:</span>
                  <span className={user.emailVerified ? "text-emerald-500" : "text-amber-500"}>
                    {user.emailVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mt-8">
              You can now access all Zest Academy applications securely.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Unauthenticated - Show Register Form
  return <RegisterView />
}
