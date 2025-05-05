import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { BuildingIcon, LockIcon, MailIcon, UserIcon } from 'lucide-react';
import Link from "next/link";
import { USER_APP_ROUTES } from "@/routing/routes";
import { useRouter } from "next/router";
import { useCreateOrganization } from "@/hooks/organization/useCreateOrganization";
import classNames from "classnames";
import { Form, Input, Button, Alert } from "antd";
import { SignUpWithOrganizationDto } from "common";

type PasswordStrength = {
  hasLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

type Props = object;

export const SignUpComponent: FunctionComponent<Props> = ({}) => {
  const router = useRouter();
  const { error, isError, mutateAsync: createOrganization, isLoading } = useCreateOrganization();
  const [form] = Form.useForm<SignUpWithOrganizationDto>();
  const values = Form.useWatch([], form);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const [submittable, setSubmittable] = useState<boolean>(false);

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasLength: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const getPasswordStrengthLevel = useCallback(() => {
    return Object.values(passwordStrength).filter(Boolean).length;
  }, [passwordStrength]);

  const onPasswordsChange = useCallback((value: string) => {
    // Update password strength if password field is changed
    setPasswordStrength({
      hasLength: value.length >= 8,
      hasNumber: /\d/.test(value),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  }, []);

  const handleSubmit = useCallback(
    async ({ user, organization }: SignUpWithOrganizationDto) => {
      try {
        await createOrganization({
          organization,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email.toLowerCase(),
            password: user.password,
          },
        });
        router.push(USER_APP_ROUTES.getPath("dashboard")).catch();
      } catch (err) {}
    },
    [createOrganization, router],
  );

  useEffect(() => {
    const validateForm = async () => {
      try {
        await form.validateFields({ validateOnly: true });
        setSubmittable(getPasswordStrengthLevel() >= 3);
      } catch (e) {
        setSubmittable(false);
      }
    };
    validateForm().catch();
  }, [form, values, getPasswordStrengthLevel]);

  return (
    <Card className="max-w-md w-full mx-auto">
      <Form
        className="space-y-6"
        layout="vertical"
        form={form}
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <CardContent className="space-y-4 pt-6 pb-0">
          {isError && (
            <Alert
              className="text-sm text-red-600 bg-red-50 p-3 rounded-md"
              message={error.message}
              type="error"
            />
          )}

          <div>
            <Form.Item
              name={["organization", "name"]}
              label="Organisation Name"
              rules={[
                { required: true, message: "Please input organisation name" },
              ]}
            >
              <Input
                placeholder="Enter organisation name"
                size="large"
                disabled={isLoading}
                prefix={
                  <BuildingIcon className="size-4 text-muted-foreground" />
                }
              />
            </Form.Item>

            <Form.Item
              className="[&>.ant-row>.ant-col>div>div]:grid [&>.ant-row>.ant-col>div>div]:sm:grid-cols-2 [&>.ant-row>.ant-col>div>div]:gap-4"
              style={{ marginBottom: 0 }}
            >
              <Form.Item
                name={["user", "firstName"]}
                label="First Name"
                rules={[{ required: true, message: "Please input first name" }]}
              >
                <Input
                  placeholder="First name"
                  size="large"
                  disabled={isLoading}
                  prefix={<UserIcon className="size-4 text-muted-foreground" />}
                />
              </Form.Item>
              <Form.Item
                name={["user", "lastName"]}
                label="Last Name"
                rules={[{ required: true, message: "Please input last name" }]}
              >
                <Input
                  placeholder="Last name"
                  size="large"
                  disabled={isLoading}
                  prefix={<UserIcon className="size-4 text-muted-foreground" />}
                />
              </Form.Item>
            </Form.Item>

            <Form.Item
              name={["user", "email"]}
              label="Email Address"
              rules={[{ required: true, message: "Please input email", type: 'email' }]}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                size="large"
                disabled={isLoading}
                prefix={<MailIcon className="size-4 text-muted-foreground" />}
              />
            </Form.Item>

            <Form.Item
              name={["user", "password"]}
              label="Password"
              rules={[{ required: true, message: "Please input password" }]}
            >
              <Input.Password
                placeholder="Create a password"
                size="large"
                disabled={isLoading}
                prefix={
                  <LockIcon className="size-4 text-muted-foreground" />
                }
                onFocus={() => setIsPasswordFieldFocused(true)}
                onBlur={() => setIsPasswordFieldFocused(false)}
                onChange={(e) => onPasswordsChange(e.target.value)}
              />
            </Form.Item>

            <Form.Item
              name={["user", "confirmPassword"]}
              label="Confirm Password"
              dependencies={[["user", "password"]]}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: "Please input password confirmation",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      !value ||
                      getFieldValue(["user", "password"]) === value
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm your password"
                size="large"
                disabled={isLoading}
                prefix={
                  <LockIcon className="size-4 text-muted-foreground" />
                }
                onFocus={() => setIsPasswordFieldFocused(true)}
                onBlur={() => setIsPasswordFieldFocused(false)}
                onChange={(e) => onPasswordsChange(e.target.value)}
              />
            </Form.Item>
          </div>

          {/* Password Strength Indicator */}
          <div
            className={classNames("space-y-2", {
              "opacity-0": !isPasswordFieldFocused,
            })}
          >
            <div className="flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthLevel() >= 1 ? "bg-green-500" : "bg-gray-200"}`}
                />
              </div>
              <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthLevel() >= 2 ? "bg-green-500" : "bg-gray-200"}`}
                />
              </div>
              <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthLevel() >= 3 ? "bg-green-500" : "bg-gray-200"}`}
                />
              </div>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li
                className={passwordStrength.hasLength ? "text-green-500" : ""}
              >
                • At least 8 characters
              </li>
              <li
                className={passwordStrength.hasNumber ? "text-green-500" : ""}
              >
                • At least one number
              </li>
              <li
                className={passwordStrength.hasSpecial ? "text-green-500" : ""}
              >
                • At least one special character
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
            disabled={!submittable}
            loading={isLoading}
          >
            {isLoading ? "Creating Organisation..." : "Create Organisation"}
          </Button>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={USER_APP_ROUTES.getPath("signIn")}
              className="font-medium text-primary hover:underline"
              tabIndex={isLoading ? -1 : 0}
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Form>
    </Card>
  );
};
