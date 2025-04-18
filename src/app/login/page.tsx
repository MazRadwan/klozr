"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError("");
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setError(res.error);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-400 via-sky-400 to-blue-500 dark:from-slate-950 dark:via-indigo-950 dark:to-blue-900 transition-colors">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md">
        <CardContent className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-600 bg-clip-text text-transparent">KLOZR</h1>
            <ThemeToggle />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input id="email" type="email" {...register("email")}
                className="mt-1" aria-invalid={!!errors.email} aria-describedby="email-error" required />
              {errors.email && <span id="email-error" className="text-xs text-red-600">{errors.email.message}</span>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <Input id="password" type="password" {...register("password")}
                className="mt-1" aria-invalid={!!errors.password} aria-describedby="password-error" required minLength={8} />
              {errors.password && <span id="password-error" className="text-xs text-red-600">{errors.password.message}</span>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("remember")} className="accent-blue-600" /> Remember Me
              </label>
              <a href="#" className="text-xs text-blue-600 hover:underline">Forgot Password?</a>
            </div>
            {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="flex flex-col gap-2 mt-6">
            <Button variant="outline" className="w-full flex items-center gap-2 justify-center" onClick={() => signIn("google")}> <FcGoogle className="h-5 w-5" /> Sign in with Google </Button>
            <Button variant="outline" className="w-full flex items-center gap-2 justify-center" onClick={() => signIn("github")}> <FaGithub className="h-5 w-5" /> Sign in with GitHub </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-xs text-white/80 dark:text-slate-300/60">&copy; {new Date().getFullYear()} KLOZR. All rights reserved.</footer>
    </div>
  );
}
