"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/lib/auth";
import { ApiClientError } from "@/lib/api-client";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push(searchParams.get("returnTo") || "/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Couldn't sign you in. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-display-sm text-center">Welcome back</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
        {formError && (
          <p role="alert" className="text-sm font-medium text-rose-700">{formError}</p>
        )}
        <Button type="submit" loading={isSubmitting} className="mt-2">
          Log in
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-700/80">
        New here? <Link href="/register" className="font-medium text-terracotta-600">Create an account</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
