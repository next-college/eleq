"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SignUpFormData, string>>
  >({});
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isCredentialLoading, setIsCredentialLoading] = useState<boolean>(false);

  const isLoading = isGoogleLoading || isCredentialLoading;

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setError("");
      setFieldErrors({});
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Failed to sign up with Google");
      console.error("Google signup error:", err);
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const validationResult = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: Partial<Record<keyof SignUpFormData, string>> = {};
      validationResult.error.issues.forEach((err: z.core.$ZodIssue) => {
        const field = err.path[0] as keyof SignUpFormData;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsCredentialLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create account");
        setIsCredentialLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        username: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but failed to sign in. Please try signing in.");
        setIsCredentialLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Signup error:", err);
      setIsCredentialLoading(false);
    }
  };

  return (
    <Card
      className="w-full max-w-md border-none shadow-lg"
      style={{ backgroundColor: "#E3E2DF", color: "#540B26" }}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold" style={{ color: "#A62653" }}>
          Create your account
        </CardTitle>
        <CardDescription style={{ color: "#540B26", opacity: 0.8 }}>
          Fill in the form below to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div
            className="p-3 rounded-md text-sm animate-in fade-in"
            style={{ backgroundColor: "#ED5B85", color: "#FFFFFF" }}
          >
            {error}
          </div>
        )}

        {/* Google Signup Button */}
        <Button
          variant="outline"
          className="w-full border-2 transition-colors hover:bg-white/20"
          style={{
            borderColor: "#ED5B85",
            color: "#A62653",
            backgroundColor: "transparent",
          }}
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          {isGoogleLoading ? (
            "Connecting..."
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span
              className="w-full border-t"
              style={{ borderColor: "#A62653", opacity: 0.3 }}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span
              className="px-2"
              style={{ backgroundColor: "#E3E2DF", color: "#540B26" }}
            >
              Or continue with
            </span>
          </div>
        </div>

        {/* Credential Signup Form */}
        <form onSubmit={handleCredentialSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" style={{ color: "#540B26" }}>
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              disabled={isLoading}
              className="focus-visible:ring-1"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#540B26",
                borderColor: "#A62653",
                borderWidth: "1px",
              }}
            />
            {fieldErrors.name && (
              <p className="text-sm" style={{ color: "#ED5B85" }}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: "#540B26" }}>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="eleq@example.com"
              disabled={isLoading}
              className="focus-visible:ring-1"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#540B26",
                borderColor: "#A62653",
                borderWidth: "1px",
              }}
            />
            {fieldErrors.email && (
              <p className="text-sm" style={{ color: "#ED5B85" }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" style={{ color: "#540B26" }}>
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              disabled={isLoading}
              className="focus-visible:ring-1"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#540B26",
                borderColor: "#A62653",
                borderWidth: "1px",
              }}
            />
            <p className="text-xs" style={{ color: "#540B26", opacity: 0.7 }}>
              Must be at least 8 characters long
            </p>
            {fieldErrors.password && (
              <p className="text-sm" style={{ color: "#ED5B85" }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" style={{ color: "#540B26" }}>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              disabled={isLoading}
              className="focus-visible:ring-1"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#540B26",
                borderColor: "#A62653",
                borderWidth: "1px",
              }}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-sm" style={{ color: "#ED5B85" }}>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#540B26" }}
            disabled={isLoading}
          >
            {isCredentialLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm" style={{ color: "#540B26" }}>
          Already have an account?{" "}
          <a
            href="/signin"
            className="font-bold hover:underline"
            style={{ color: "#A62653" }}
          >
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
