"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getValidatedRedirectUrl } from "@/lib/redirect"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await sendPasswordResetEmail(auth, email)
            setIsSubmitted(true)
        } catch (e: any) {
            console.error(e)
            setError(e.message || "Failed to send reset email. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const redirectUrl = getValidatedRedirectUrl(searchParams)
    const loginUrl = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 z-10">
                    <Image
                        src="/auth-hero-desktop.png"
                        alt="Authentication Hero"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="relative z-20 flex items-center text-lg font-medium p-10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-6 w-6"
                    >
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                    </svg>
                    Zest Academy
                </div>
            </div>
            <div className="lg:p-8 relative">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

                    {/* Mobile Hero Image */}
                    <div className="relative w-full aspect-square lg:hidden mb-4">
                        <Image
                            src="/auth-hero-mobile.png"
                            alt="Authentication Hero"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {isSubmitted ? "Check your email" : "Reset password"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isSubmitted
                                ? `We've sent a password reset link to ${email}`
                                : "Enter your email address and we'll send you a link to reset your password"
                            }
                        </p>
                    </div>

                    {!isSubmitted ? (
                        <Card className="border-none shadow-none">
                            <CardContent className="p-0">
                                <form onSubmit={onSubmit}>
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                placeholder="name@example.com"
                                                type="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                disabled={isLoading}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        {error && (
                                            <div className="text-sm text-destructive text-center">
                                                {error}
                                            </div>
                                        )}
                                        <Button disabled={isLoading} className="w-full">
                                            {isLoading && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Send Reset Link
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4 p-0 mt-6 text-center text-sm text-muted-foreground">
                                <Link
                                    href={loginUrl}
                                    className="flex items-center justify-center hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to login
                                </Link>
                            </CardFooter>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => router.push(loginUrl)}>
                                Return to login
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Didn&apos;t receive the email? Check your spam folder or{" "}
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="underline hover:text-primary"
                                >
                                    try again
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
