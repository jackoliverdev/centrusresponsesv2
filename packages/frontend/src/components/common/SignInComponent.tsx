import { FunctionComponent, useCallback, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { MailIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";
import { USER_APP_ROUTES } from "@/routing/routes";
import { useSignInWithEmailAndPassword } from "@/hooks/auth/useSignInWithEmailAndPassword";
import { Button, Form, Input } from "antd";
import { SignInDto } from "common";
import { useForgotPassword } from "@/hooks/auth/useForgotPassword";

type Props = object;

export const SignInComponent: FunctionComponent<Props> = ({}) => {
  const { isLoading } = useAuthContext();
  const [form] = Form.useForm<SignInDto>();
  const values = Form.useWatch([], form);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState<string>("");

  const {
    mutateAsync: signInWithEmailAndPassword,
    isLoading: isLoadingSignIn,
  } = useSignInWithEmailAndPassword();

  const { mutateAsync: forgotPassword, isLoading: isLoadingForgotPassword } =
    useForgotPassword();

  const handleSubmit = useCallback(
    async (data: SignInDto) => {
      setResetError("");
      setResetEmailSent(false);
      try {
        await signInWithEmailAndPassword(data);
      } catch (e) {}
    },
    [signInWithEmailAndPassword],
  );

  const handleForgotPassword = useCallback(async () => {
    setResetError("");
    setResetEmailSent(false);

    if (!values?.email) {
      setResetError("Please enter your email address first");
      return;
    }

    try {
      await forgotPassword(values.email);
      setResetEmailSent(true);
    } catch (error) {
      setResetError("Failed to send reset email. Please try again.");
    }
  }, [values?.email, forgotPassword]);

  if (isLoading) return null;

  return (
    <Card className="max-w-md w-full mx-auto">
      <Form
        form={form}
        layout="vertical"
        className="space-y-2"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <CardContent className="pt-6 pb-2 space-y-2">
          {resetEmailSent && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              Password reset email sent. Please check your inbox.
            </div>
          )}

          {resetError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {resetError}
            </div>
          )}
          <div>
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                {
                  required: true,
                  message: "Please input email",
                  type: "email",
                },
              ]}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                size="large"
                disabled={isLoadingSignIn}
                prefix={<MailIcon className="size-4 text-muted-foreground" />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please input password" }]}
            >
              <Input.Password
                placeholder="Enter your password"
                size="large"
                disabled={isLoadingSignIn}
                prefix={<LockIcon className="size-4 text-muted-foreground" />}
              />
            </Form.Item>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-y-4">
          <Button
            htmlType="submit"
            type="primary"
            className="w-full"
            disabled={isLoadingForgotPassword}
            loading={isLoadingSignIn}
          >
            {isLoadingSignIn ? "Signing in..." : "Sign in"}
          </Button>
          <div className="flex flex-col items-center gap-3 text-sm">
            <div className="text-muted-foreground">
              Forgot password?{" "}
              <Button
                type="link"
                onClick={handleForgotPassword}
                className="font-medium text-primary hover:text-primary/80 disabled:opacity-50 p-0"
                disabled={isLoadingSignIn || isLoadingForgotPassword}
              >
                {isLoadingForgotPassword ? "Sending..." : "Send reset email"}
              </Button>
            </div>

            <p className="text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={USER_APP_ROUTES.getPath("signUp")}
                className="font-medium text-primary hover:text-primary/80"
                tabIndex={isLoadingSignIn ? -1 : 0}
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardFooter>
      </Form>
    </Card>
  );
};
