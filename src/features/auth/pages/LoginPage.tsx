import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "@/components/ui/input-error";
import { AuthLayout } from "@/layouts/auth-layout";
import { useLoginMutation } from "../hooks";
import { paths } from "@/lib/paths";
import { resolvePostAuthPath } from "@/lib/resolve-post-auth-path";
import { useAppContext } from "@/contexts/app-context";
import { isDemoEnvironment } from "@/lib/brand-defaults";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  {
    key: "superadmin",
    email: "superadmin@downstreamx.test",
    password: "password",
    labelKey: "Login as Super Admin",
    className: "sm:col-span-2",
  } /*,
  {
    key: "company",
    email: "company@downstreamx.test",
    password: "password",
    labelKey: "Login as Company",
  },
  {
    key: "staff",
    email: "hr1@demo.downstreamx.test",
    password: "password",
    labelKey: "Login as Employee",
  },
  {
    key: "customer",
    email: "customer.zenith-petroleum-marketers@demo.downstreamx.test",
    password: "password",
    labelKey: "Login as Customer",
  },
  {
    key: "supplier",
    email: "supplier.nnpc-products-supply@demo.downstreamx.test",
    password: "password",
    labelKey: "Login as Supplier",
  }, */,
] as const;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginMutation = useLoginMutation();
  const { is_demo: isDemoFlag } = useAppContext();
  const isDemo = isDemoFlag || isDemoEnvironment();
  const status = searchParams.get("status") ?? undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: isDemo ? "company@downstreamx.test" : "",
      password: isDemo ? "password" : "",
      remember: true,
    },
  });

  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  useEffect(() => {
    return () => form.resetField("password");
  }, [form]);

  const submitLogin = async (values: FormValues) => {
    try {
      const { me } = await loginMutation.mutateAsync(values);
      navigate(resolvePostAuthPath(me));
    } catch {
      // Error surfaced via loginMutation.isError / apiError
    }
  };

  const onSubmit = form.handleSubmit(submitLogin);

  const handleQuickLogin = async (
    email: string,
    password: string,
    key: string,
  ) => {
    form.setValue("email", email);
    form.setValue("password", password);
    setQuickLoading(key);
    try {
      const { me } = await loginMutation.mutateAsync({
        email,
        password,
        remember: form.getValues("remember"),
      });
      navigate(resolvePostAuthPath(me));
    } finally {
      setQuickLoading(null);
    }
  };

  const apiError =
    loginMutation.isError &&
    getApiErrorMessage(loginMutation.error, t("Invalid credentials."));

  return (
    <AuthLayout title={t("Log in to your account")}>
      {status ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-center text-sm font-medium text-emerald-800">
          {status}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-900"
            >
              {t("Email address")}
            </Label>
            <Input
              id="email"
              type="email"
              autoFocus
              tabIndex={1}
              autoComplete="email"
              placeholder="email@example.com"
              className="w-full"
              {...form.register("email")}
            />
            <InputError message={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-900"
              >
                {t("Password")}
              </Label>
              <Link
                to={paths.forgotPassword}
                className="text-sm auth-text-primary hover:underline"
                tabIndex={5}
              >
                {t("Forgot password?")}
              </Link>
            </div>
            <PasswordInput
              id="password"
              tabIndex={2}
              autoComplete="current-password"
              placeholder={t("Password")}
              className="w-full"
              {...form.register("password")}
            />
            <InputError message={form.formState.errors.password?.message} />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="remember"
              checked={form.watch("remember")}
              onCheckedChange={(checked) =>
                form.setValue("remember", !!checked)
              }
              tabIndex={3}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              {t("Remember me")}
            </Label>
          </div>

          {apiError ? <InputError message={apiError} /> : null}

          <Button
            type="submit"
            className="auth-primary mt-1 h-11 w-full rounded-lg text-[0.95rem] font-semibold tracking-wide shadow-sm transition-shadow hover:shadow-md"
            tabIndex={4}
            disabled={loginMutation.isPending || !!quickLoading}
            data-test="login-button"
          >
            {loginMutation.isPending ? t("Loading...") : t("Sign in")}
          </Button>
        </div>

        {isDemo ? (
          <div className="pt-1">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("Quick Access")}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.key}
                  type="button"
                  variant="outline"
                  disabled={loginMutation.isPending || !!quickLoading}
                  className={cn(
                    "h-auto rounded-lg border-slate-200 bg-white px-3 py-2.5 text-[0.8rem] font-medium text-slate-700 shadow-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
                    "className" in account ? account.className : "",
                  )}
                  onClick={() =>
                    handleQuickLogin(
                      account.email,
                      account.password,
                      account.key,
                    )
                  }
                >
                  {quickLoading === account.key
                    ? t("Loading...")
                    : t(account.labelKey)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
    </AuthLayout>
  );
}
