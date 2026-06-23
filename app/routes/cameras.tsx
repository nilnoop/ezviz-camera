import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ListBox,
  Spinner,
  Typography,
  toast,
} from "@heroui/react";
import {
  ArrowLeft,
  Camera,
  CircleDot,
  LogOut,
  RefreshCw,
  RotateCw,
  Rows3,
  Video,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { EzvizPlayer } from "../components/EzvizPlayer";
import { useRequireAuth } from "../hooks/use-auth-redirect";
import {
  ApiError,
  getCameraLiveAddresses,
  type CameraLiveAddress,
} from "../lib/api";
import { clearAuthSession } from "../lib/auth";
import { FIXED_PROJECT_ID } from "../lib/projects";

export function meta() {
  return [
    { title: "摄像头播放" },
    { name: "description", content: "摄像头播放" },
  ];
}

export default function CamerasRoute() {
  const { checking } = useRequireAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<CameraLiveAddress[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const selectedCamera = useMemo(
    () => cameras[selectedIndex] ?? null,
    [cameras, selectedIndex],
  );
  const knownProject = projectId === FIXED_PROJECT_ID;

  async function loadCameras() {
    if (!knownProject) {
      return;
    }

    setLoading(true);
    setLoadFailed(false);
    try {
      const result = await getCameraLiveAddresses(FIXED_PROJECT_ID);
      setCameras(result);
      setSelectedIndex(0);
    } catch (currentError) {
      if (currentError instanceof ApiError && currentError.httpStatus === 401) {
        toast.danger(currentError.message);
        navigate("/login", { replace: true });
        return;
      }
      toast.danger(
        currentError instanceof Error ? currentError.message : "摄像头加载失败",
      );
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!checking) {
      void loadCameras();
    }
    // loadCameras depends on route state and intentionally runs after auth check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, knownProject]);

  if (checking) {
    return <PageLoading label="正在校验登录状态" />;
  }

  if (!knownProject) {
    return (
      <main className="console-screen center-screen">
        <Card className="state-card" variant="secondary">
          <Card.Header>
            <Card.Title>项目不存在</Card.Title>
          </Card.Header>
          <Card.Footer>
            <Button
              onPress={() => {
                void navigate("/projects");
              }}
            >
              <ArrowLeft size={18} aria-hidden="true" />
              返回项目列表
            </Button>
          </Card.Footer>
        </Card>
      </main>
    );
  }

  return (
    <main className="console-screen camera-screen">
      <header className="console-topbar">
        <div className="console-brand">
          <div className="brand-mark" aria-hidden="true">
            <Video size={22} />
          </div>
          <div>
            <span className="eyebrow">LIVE VIEW</span>
            <Typography.Heading className="page-title" level={1}>
              摄像头播放
            </Typography.Heading>
          </div>
        </div>
        <div className="header-actions">
          <Chip
            className="chip-inline"
            color={loadFailed ? "warning" : "success"}
            size="sm"
            variant="soft"
          >
            {loadFailed ? "加载异常" : "项目摄像头"}
          </Chip>
          <span title="刷新摄像头">
            <Button
              isIconOnly
              isDisabled={loading}
              onPress={() => void loadCameras()}
              aria-label="刷新摄像头"
            >
              {loading ? (
                <Spinner
                  color="current"
                  size="sm"
                  aria-label="正在刷新摄像头"
                />
              ) : (
                <RefreshCw size={18} aria-hidden="true" />
              )}
            </Button>
          </span>
          <span title="返回项目列表">
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => {
                void navigate("/projects");
              }}
              aria-label="返回项目列表"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </Button>
          </span>
          <span title="退出登录">
            <Button
              isIconOnly
              variant="ghost"
              onPress={logout}
              aria-label="退出登录"
            >
              <LogOut size={18} aria-hidden="true" />
            </Button>
          </span>
        </div>
      </header>

      <section
        className="command-strip camera-command-strip"
        aria-label="播放总览"
      >
        <div className="command-copy">
          <Chip className="chip-inline signal-chip" color="success" size="sm">
            {loading ? "刷新中" : "实时画面"}
          </Chip>
          <Typography.Heading className="command-title" level={2}>
            {selectedCamera?.spaceName || "等待选择摄像头"}
          </Typography.Heading>
          <Typography.Paragraph className="command-summary" color="muted">
            {selectedCamera
              ? `${selectedCamera.deviceSerial || "未知设备"} / 通道 ${
                  selectedCamera.channelNo ?? "-"
                }`
              : "摄像头加载后显示播放信息"}
          </Typography.Paragraph>
        </div>
        <div className="telemetry-grid" aria-label="摄像头状态">
          <MetricTile
            icon={<Rows3 size={18} aria-hidden="true" />}
            label="摄像头"
            value={String(cameras.length)}
          />
          <MetricTile
            icon={<CircleDot size={18} aria-hidden="true" />}
            label="当前"
            value={selectedCamera ? String(selectedIndex + 1) : "-"}
          />
        </div>
      </section>

      <section className="camera-layout">
        <Card
          className="camera-list-card"
          aria-label="摄像头列表"
          variant="secondary"
        >
          <Card.Header>
            <div className="panel-heading">
              <div className="card-copy">
                <Card.Title>摄像头列表</Card.Title>
                <Card.Description>
                  选择任一摄像头查看播放和详情
                </Card.Description>
              </div>
              <Chip className="chip-inline" color="success" size="sm">
                {cameras.length}
              </Chip>
            </div>
          </Card.Header>
          <Card.Content aria-busy={loading}>
            {loading && <CameraLoadingState label="正在加载摄像头" />}
            {!loading && loadFailed && cameras.length === 0 && (
              <EmptyState>
                <Camera size={18} aria-hidden="true" />
                <Typography.Paragraph>摄像头加载失败</Typography.Paragraph>
                <Button onPress={() => void loadCameras()}>
                  <RotateCw size={15} aria-hidden="true" />
                  重试
                </Button>
              </EmptyState>
            )}
            {!loading && !loadFailed && cameras.length === 0 && (
              <EmptyState>
                <Camera size={18} aria-hidden="true" />
                <Typography.Paragraph>
                  当前项目未返回摄像头
                </Typography.Paragraph>
              </EmptyState>
            )}
            {!loading && cameras.length > 0 && (
              <ListBox
                aria-label="摄像头列表"
                selectionMode="single"
                selectedKeys={[String(selectedIndex)]}
                onSelectionChange={(keys) => {
                  if (keys === "all") {
                    return;
                  }

                  const nextKey = Array.from(keys)[0];
                  if (nextKey != null) {
                    setSelectedIndex(Number(nextKey));
                  }
                }}
              >
                {cameras.map((camera, index) => (
                  <ListBox.Item
                    className="camera-list-item"
                    id={String(index)}
                    key={cameraKey(camera, index)}
                    textValue={camera.spaceName || "未命名空间"}
                  >
                    <span className="camera-list-icon" aria-hidden="true">
                      <Video size={18} />
                    </span>
                    <span className="table-cell-stack">
                      <span data-slot="label">
                        {camera.spaceName || "未命名空间"}
                      </span>
                      <span data-slot="description">
                        {camera.deviceSerial || "未知设备"} / 通道{" "}
                        {camera.channelNo ?? "-"}
                      </span>
                    </span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            )}
          </Card.Content>
        </Card>

        <section className="detail-stack" aria-label="摄像头播放与详情">
          <Card className="camera-stage-card" variant="secondary">
            <Card.Header>
              <div className="stage-meta">
                <div className="camera-title">
                  <Card.Title>
                    {selectedCamera?.spaceName || "等待选择摄像头"}
                  </Card.Title>
                  <Card.Description>
                    {selectedCamera
                      ? `${selectedCamera.deviceSerial || "未知设备"} / 通道 ${
                          selectedCamera.channelNo ?? "-"
                        }`
                      : "选择摄像头后显示播放状态"}
                  </Card.Description>
                </div>
                <Chip
                  className="chip-inline"
                  color={selectedCamera ? "success" : "warning"}
                  size="sm"
                  variant="soft"
                >
                  {selectedCamera ? "可播放" : "待选择"}
                </Chip>
              </div>
            </Card.Header>
            <Card.Content>
              <EzvizPlayer
                url={selectedCamera?.url ?? null}
                accessToken={selectedCamera?.accessToken ?? null}
                deviceSerial={selectedCamera?.deviceSerial ?? null}
                channelNo={selectedCamera?.channelNo ?? null}
              />
            </Card.Content>
          </Card>
        </section>
      </section>
    </main>
  );
}

function MetricTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="metric-tile">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function cameraKey(camera: CameraLiveAddress, index: number) {
  return `${camera.deviceSerial || "unknown"}-${camera.channelNo ?? "x"}-${index}`;
}

function PageLoading({ label }: { label: string }) {
  return (
    <main className="console-screen center-screen">
      <CameraLoadingState label={label} />
    </main>
  );
}

function CameraLoadingState({ label }: { label: string }) {
  return (
    <EmptyState>
      <Spinner color="accent" size="lg" aria-label={label} />
      <Typography.Paragraph>{label}</Typography.Paragraph>
    </EmptyState>
  );
}
