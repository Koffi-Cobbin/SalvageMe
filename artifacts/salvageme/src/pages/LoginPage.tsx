import { useLocation, useSearch, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, ApiClientError } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToastStore } from "@/lib/stores/toast-store";

const schema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const push = useToastStore((s) => s.push);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await login(values.username, values.password);
      setLocation(returnTo);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401 || err.status === 400) {
          setError("password", { message: "Incorrect username or password." });
        } else {
          push(err.message, "error");
        }
      } else {
        push("Something went wrong. Please try again.", "error");
      }
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-display-md">Welcome back</h1>
        <p className="mb-8 text-sm text-ink-700/70">
          New here?{" "}
          <Link href="/register" className="font-medium text-terracotta-600 hover:underline">
            Create an account
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
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" loading={isSubmitting} className="w-full mt-2">
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
