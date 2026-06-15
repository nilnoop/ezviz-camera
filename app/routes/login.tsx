import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Spinner,
  TextField,
  Typography,
  toast,
} from "@heroui/react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router";

import { setAuthSession } from "../lib/auth";
import { login } from "../lib/api";
import { useRedirectAuthedUser } from "../hooks/use-auth-redirect";

export function meta() {
  return [{ title: "视频登录" }, { name: "description", content: "登录" }];
}

export default function LoginRoute() {
  useRedirectAuthedUser();

  const navigate = useNavigate();
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!loginName.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }

    setSubmitting(true);
    try {
      const session = await login(loginName.trim(), password);
      setAuthSession(session);
      navigate("/projects", { replace: true });
    } catch (currentError) {
      toast.danger(
        currentError instanceof Error ? currentError.message : "登录失败",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-copy" aria-label="系统概览">
        <div className="hero-copy">
          <Chip className="chip-inline" color="success" size="sm">
            氧屋东西
          </Chip>
          <Typography.Heading level={1}>摄像头播放控制台</Typography.Heading>
        </div>
      </section>
      <Card className="auth-card">
        <Card.Content>
          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField fullWidth>
              <Label>账号</Label>
              <Input
                name="loginName"
                autoComplete="username"
                placeholder="请输入账号"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
              />
            </TextField>
            <TextField fullWidth>
              <Label>密码</Label>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </TextField>
            {error && (
              <Alert status="danger">
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <Button fullWidth type="submit" isDisabled={submitting}>
              {submitting ? (
                <Spinner color="current" size="sm" />
              ) : (
                <LogIn size={18} aria-hidden="true" />
              )}
              <span>{submitting ? "登录中" : "登录"}</span>
            </Button>
          </form>
        </Card.Content>
      </Card>
    </main>
  );
}
