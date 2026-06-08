import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, registerSchema } from "@devboard/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin, useRegister } from "./useAuth";
import { getApiErrorMessage, getApiErrorDetails } from "@/lib/api";
import { toast } from "@/stores/uiStore";

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-surface-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
            D
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">{footer}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setErrors({});
    try {
      await login.mutateAsync(parsed.data);
      navigate("/boards");
    } catch (err) {
      setErrors(getApiErrorDetails(err) ?? {});
      toast.error(getApiErrorMessage(err, "Login failed"));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your DevBoard account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-indigo-600">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.[0]}
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.[0]}
        />
        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
      <p className="mt-4 rounded-md bg-slate-50 p-2 text-center text-xs text-slate-500">
        Demo: alice@devboard.dev / password123
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setErrors({});
    try {
      await register.mutateAsync(parsed.data);
      navigate("/boards");
    } catch (err) {
      setErrors(getApiErrorDetails(err) ?? {});
      toast.error(getApiErrorMessage(err, "Registration failed"));
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organizing work with DevBoard"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          id="name"
          name="name"
          label="Name"
          placeholder="Ada Lovelace"
          autoComplete="name"
          error={errors.name?.[0]}
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.[0]}
        />
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          error={errors.password?.[0]}
        />
        <Button type="submit" className="w-full" loading={register.isPending}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
