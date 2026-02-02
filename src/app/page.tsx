"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase"
import { User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, Lock, Zap, ArrowRight } from "lucide-react"
import { getValidatedRedirectUrl, buildAuthRedirectUrl } from "@/lib/redirect"

function HomePageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u)
      setLoading(false)

      // If user is authenticated and there's a valid redirect URL, redirect back
      if (u) {
        const redirectUrl = getValidatedRedirectUrl(searchParams)
        if (redirectUrl) {
          setRedirecting(true)
          try {
            const idToken = await u.getIdToken()
            const finalUrl = await buildAuthRedirectUrl(redirectUrl, idToken)
            window.location.href = finalUrl
          } catch (error) {
            console.error("Error getting ID token", error)
            setRedirecting(false)
          }
        }
      }
    })
    return () => unsubscribe()
  }, [searchParams])

  if (loading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          {redirecting && (
            <p className="text-zinc-400 text-sm">Redirecting you back...</p>
          )}
        </div>
      </div>
    )
  }

  // If authenticated but no redirect URL, show authenticated state
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
                  <span>{user.displayName || "Not set"}</span>
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
              Close this window to return to your application, or use the link provided by the service that directed you here.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Landing Page for non-authenticated users
  const redirectUrl = getValidatedRedirectUrl(searchParams)
  const loginUrl = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"
  const registerUrl = redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"

  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="h-6 w-6 rounded-full bg-indigo-500 blur-[8px] absolute opacity-50"></div>
            <span className="relative z-10">Zest<span className="text-indigo-400">Auth</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={loginUrl} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href={registerUrl}>
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200 rounded-full px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
          <div className="absolute inset-0 z-0">
            <Image
              src="/auth-hero-desktop-hq.jpg"
              alt="Background"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/40"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400 backdrop-blur-xl mb-4">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
              Secure Authentication Service
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              One Account.<br />All of Zest.
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Centralized authentication for Zest Academy. Sign in once, access everything.
              Your credentials stay secure while you explore our entire ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href={registerUrl}>
                <Button size="lg" className="h-12 px-8 rounded-full text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={loginUrl}>
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-zinc-700 hover:bg-zinc-800 hover:text-white bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 relative">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Zest Auth?</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Enterprise-grade security meets seamless user experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-zinc-400 text-sm">
                  Built on Firebase Auth with industry-standard security protocols and encryption.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-zinc-400 text-sm">
                  Instant authentication and seamless redirects. No waiting, just learning.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
                <p className="text-zinc-400 text-sm">
                  Your data stays yours. We only store what's necessary for authentication.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© 2026 Zest Academy. Secure authentication for modern learners.</p>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
