"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Fingerprint } from "lucide-react"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getValidatedRedirectUrl, buildAuthRedirectUrl } from "@/lib/redirect"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [showExistsDialog, setShowExistsDialog] = useState(false)
    const [heroImage] = useState<string>("/auth-hero-desktop-hq.jpg")

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user && !showVerifyDialog) {
                const redirectUrl = getValidatedRedirectUrl(searchParams)
                if (redirectUrl) {
                    const idToken = await user.getIdToken()
                    const finalUrl = await buildAuthRedirectUrl(redirectUrl, idToken)
                    window.location.href = finalUrl
                } else {
                    router.push("/")
                }
            }
        })
        return () => unsubscribe()
    }, [router, searchParams, showVerifyDialog])

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 409) {
                    setShowExistsDialog(true)
                    return
                }
                throw new Error(data.error || 'Failed to create account')
            }

            // Successful registration
            // Automatically log in (handled by the createSession in register route? No, register route currently just creates user)
            // Wait, register route doesn't create session!
            // I should probbaly log them in OR ask them to login.
            // Let's check register route again.
            // Correct, it returns user but no session cookie.
            // So we should redirect to login or auto-login.
            // For now, let's redirect to login.

            router.push('/login?email=' + encodeURIComponent(email))
        } catch (e: any) {
            console.error(e)
            setError(e.message || "Failed to create account. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogleLogin() {
        // TODO: Implement Google OAuth upstream
        setError("Google signup is not yet configured for this environment.")
    }

    const redirectUrl = getValidatedRedirectUrl(searchParams)
    const loginUrl = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"

    return (
        <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* ... Left Side ... */}
            <div className="relative hidden h-full flex-col bg-muted text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="absolute inset-0 z-10">
                    <Image
                        src={heroImage}
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
                            Create an account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your email below to create your account
                        </p>
                    </div>
                    <Card className="border-none shadow-none">
                        <CardContent className="p-0">
                            <form onSubmit={onSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            type="text"
                                            autoCapitalize="words"
                                            autoComplete="name"
                                            autoCorrect="off"
                                            disabled={isLoading}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
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
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                autoCapitalize="none"
                                                autoComplete="new-password"
                                                disabled={isLoading}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
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
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or continue with
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" disabled={isLoading} className="w-full">
                                    <Fingerprint className="mr-2 h-4 w-4" />
                                    Zest ID
                                </Button>
                                <Button variant="outline" disabled={isLoading} onClick={handleGoogleLogin} className="w-full">
                                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                    Google
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 p-0 mt-6 text-center text-sm text-muted-foreground">
                            <p>
                                Already have an account?{" "}
                                <Link
                                    href={loginUrl}
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    Login
                                </Link>
                            </p>

                        </CardFooter>
                    </Card>
                </div>
            </div>

            <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify your email</DialogTitle>
                        <DialogDescription>
                            Account created successfully! We&apos;ve sent a verification email to <strong>{email}</strong>.
                            Please verify your email address to access all features.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => router.push("/")}>
                            Continue to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showExistsDialog} onOpenChange={setShowExistsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Account Already Exists</DialogTitle>
                        <DialogDescription>
                            It looks like there is already an account associated with <strong>{email}</strong>.
                            Would you like to log in instead?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExistsDialog(false)}>
                            Cancel
                        </Button>
                        <Link href="/login" passHref>
                            <Button onClick={() => setShowExistsDialog(false)}>
                                Log In
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="container relative min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>}>
            <RegisterForm />
        </Suspense>
    )
}
