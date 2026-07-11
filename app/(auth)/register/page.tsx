"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerUser } from "@/lib/auth";
import { ApiClientError } from "@/lib/api-client";
import { Button, Input } from "@/components/ui";

const schema = z.object({
  displayName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await registerUser(values);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Couldn't create your account. Please try again.");
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <h1 className="text-display-sm text-center">Join SalvageMe</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Input label="Full name" error={errors.displayName?.message} {...registerField("displayName")} />
          <Input label="Email" type="email" error={errors.email?.message} {...registerField("email")} />
          <Input label="Password" type="password" hint="At least 8 characters." error={errors.password?.message} {...registerField("password")} />
          {formError && (
            <p role="alert" className="text-sm font-medium text-rose-700">{formError}</p>
          )}
          <Button type="submit" loading={isSubmitting} className="mt-2">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-700/80">
          Already have an account? <Link href="/login" className="font-medium text-terracotta-600">Log in</Link>
        </p>
      </div>
    </div>
  );
}
