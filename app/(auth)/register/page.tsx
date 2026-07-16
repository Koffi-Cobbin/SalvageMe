"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerUser } from "@/lib/auth";
import { ApiClientError } from "@/lib/api-client";
import { Button, Input, Select } from "@/components/ui";

const schema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["donor", "recipient", "both"]),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "both" } });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setFieldErrors({});
    try {
      await registerUser({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        role: values.role,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setFormError("Couldn't create your account. Please try again.");
      }
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-sm">
        <h1 className="text-display-sm text-center">Join SalvageMe</h1>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Username"
            error={errors.username?.message ?? fieldErrors.username?.[0]}
            {...registerField("username")}
          />
          <Input
            label="Email (optional)"
            type="email"
            error={errors.email?.message ?? fieldErrors.email?.[0]}
            {...registerField("email")}
          />
          <Select
            label="I'm mainly here to..."
            options={[
              { value: "both", label: "Give and receive books" },
              { value: "donor", label: "Give books away" },
              { value: "recipient", label: "Find books" },
            ]}
            {...registerField("role")}
          />
          <Input
            label="Password"
            type="password"
            hint="At least 8 characters."
            error={errors.password?.message ?? fieldErrors.password?.[0]}
            {...registerField("password")}
          />
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
