"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { User, signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut, LayoutDashboard, ShieldCheck, Zap } from "lucide-react"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.refresh()
    } catch (error) {
      console.error("Error signing out", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans">
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur top-0 sticky z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-primary">Zest</span>Academy
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden sm:inline-block">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-full mb-8">
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-zinc-400">Welcome back to your comprehensive overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-200">Total Courses</h3>
                <LayoutDashboard className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold">12</p>
              <p className="text-xs text-zinc-500 mt-2">+2 added this month</p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-200">Certificates</h3>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold">3</p>
              <p className="text-xs text-zinc-500 mt-2">Latest earned: Java Advanced</p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-200">Activity Score</h3>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-3xl font-bold">850</p>
              <p className="text-xs text-zinc-500 mt-2">Top 10% of students</p>
            </div>

            {/* Content Area */}
            <div className="col-span-full mt-6 p-8 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                <LayoutDashboard className="h-8 w-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold">Ready to continue learning?</h2>
              <p className="text-zinc-400 max-w-md">
                Jump back into your last course or explore new topics in the catalogue.
              </p>
              <Button className="mt-4">Resume Learning</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Landing Page
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="h-6 w-6 rounded-full bg-indigo-500 blur-[8px] absolute opacity-50"></div>
            <span className="relative z-10">Zest<span className="text-indigo-400">Academy</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register">
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
              New cohort starting soon
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              Master the Future
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Join the elite community of developers building the next generation of web applications.
              Interactive learning, real-time feedback, and expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 rounded-full text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base border-zinc-700 hover:bg-zinc-800 hover:text-white bg-transparent">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
