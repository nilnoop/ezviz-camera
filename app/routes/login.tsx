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
import { Camera, LockKeyhole, LogIn, Radar, ShieldCheck } from "lucide-react";
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
      <section className="auth-brief" aria-label="系统概览">
        <div className="brand-mark" aria-hidden="true">
          <Camera size={24} />
        </div>
        <div className="auth-copy">
          <Chip className="chip-inline signal-chip" color="success" size="sm">
            氧屋东西
          </Chip>
          <Typography.Heading className="auth-title" level={1}>
            摄像头播放控制台
          </Typography.Heading>
          <Typography.Paragraph className="auth-summary" color="muted">
            项目摄像头集中播放、授权校验和实时画面调度入口。
          </Typography.Paragraph>
        </div>
        <div className="auth-signal-grid" aria-label="平台能力">
          <div className="signal-card">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>授权访问</span>
          </div>
          <div className="signal-card">
            <Radar size={18} aria-hidden="true" />
            <span>实时拉流</span>
          </div>
          <div className="signal-card">
            <LockKeyhole size={18} aria-hidden="true" />
            <span>会话保护</span>
          </div>
        </div>
      </section>

      <Card className="auth-card" variant="secondary">
        <Card.Header>
          <div className="card-copy">
            <Card.Title>登录</Card.Title>
            <Card.Description>使用已授权账号进入控制台</Card.Description>
          </div>
        </Card.Header>
        <Card.Content>
          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField className="field-stack" fullWidth>
              <Label>账号</Label>
              <Input
                name="loginName"
                autoComplete="username"
                variant="secondary"
                placeholder="请输入账号"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
              />
            </TextField>
            <TextField className="field-stack" fullWidth>
              <Label>密码</Label>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                variant="secondary"
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
            <Button fullWidth type="submit" isDisabled={submitting} size="lg">
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
