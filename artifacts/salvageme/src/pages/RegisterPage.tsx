import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { register as registerUser, ApiClientError } from "@/lib/auth";
import { Button, Input, Select } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.object({
  username: z.string().min(3, "At least 3 characters").max(30, "At most 30 characters").regex(/^\w+$/, "Letters, numbers, and _ only"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["donor", "recipient", "both"]),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const push = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "both" } });

  async function onSubmit(values: FormValues) {
    try {
      await registerUser({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        role: values.role,
        phone: values.phone || undefined,
      });
      setLocation("/dashboard");
      push("Welcome to SalvageMe!", "success");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errors?.username) setError("username", { message: err.errors.username[0] });
        else if (err.errors?.email) setError("email", { message: err.errors.email[0] });
        else push(err.message, "error");
      } else {
        push("Something went wrong. Please try again.", "error");
      }
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-display-md">Join SalvageMe</h1>
        <p className="mb-8 text-sm text-ink-700/70">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-terracotta-600 hover:underline">
            Log in
          </Link>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Username"
            autoComplete="username"
            autoFocus
            error={errors.username?.message}
            {...register("username")}
          />
          <Input
            label="Email (optional)"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Select
            label="I want to…"
            options={[
              { value: "both", label: "Both give and receive books" },
              { value: "donor", label: "Donate books" },
              { value: "recipient", label: "Receive books" },
            ]}
            error={errors.role?.message}
            {...register("role")}
          />
          <Input
            label="Phone number (optional)"
            type="tel"
            autoComplete="tel"
            hint="Makes it easier for your counterpart to contact you."
            {...register("phone")}
          />
          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-xs text-ink-700/50 text-center">
          By signing up you agree to use the platform respectfully and honestly.
        </p>
      </div>
    </div>
  );
}
