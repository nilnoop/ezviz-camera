import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ListBox,
  Separator,
  Spinner,
  Table,
  Typography,
  toast,
} from "@heroui/react";
import {
  ArrowLeft,
  Camera,
  LogOut,
  RefreshCw,
  RotateCw,
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
        <Card>
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
    <main className="console-screen page-stack">
      <Card>
        <Card.Content>
          <div className="hero-card">
            <div className="hero-copy">
              <Chip
                className="chip-inline"
                color={loadFailed ? "warning" : "success"}
                size="sm"
              >
                {loadFailed ? "加载异常" : "项目摄像头"}
              </Chip>
              <Typography.Heading level={1}>摄像头播放</Typography.Heading>
              <Typography.Paragraph color="muted">
                {FIXED_PROJECT_ID}
              </Typography.Paragraph>
            </div>
            <div className="header-actions">
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
                  onPress={() => {
                    void navigate("/projects");
                  }}
                  aria-label="返回项目列表"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </Button>
              </span>
              <span title="退出登录">
                <Button isIconOnly onPress={logout} aria-label="退出登录">
                  <LogOut size={18} aria-hidden="true" />
                </Button>
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>

      <section className="camera-layout">
        <Card aria-label="摄像头列表">
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
            <Separator />
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
                    id={String(index)}
                    key={cameraKey(camera, index)}
                    textValue={camera.spaceName || "未命名空间"}
                  >
                    <Video size={18} aria-hidden="true" />
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
          <Card className="camera-stage-card">
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
                {/* <Chip
                  className="chip-inline"
                  color={selectedCamera ? "success" : "warning"}
                  size="sm"
                >
                  {selectedCamera ? "可播放" : "待选择"}
                </Chip> */}
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

          <Card>
            <Card.Header>
              <div className="panel-heading">
                <div className="card-copy">
                  <Card.Title>摄像头详情</Card.Title>
                </div>
                <Chip className="chip-inline" size="sm">
                  {cameras.length}
                </Chip>
              </div>
            </Card.Header>
            <Card.Content>
              {cameras.length === 0 ? (
                <EmptyState>
                  <Camera size={18} aria-hidden="true" />
                  <Typography.Paragraph>暂无摄像头详情</Typography.Paragraph>
                </EmptyState>
              ) : (
                <CameraDetailTable
                  cameras={cameras}
                  selectedIndex={selectedIndex}
                />
              )}
            </Card.Content>
          </Card>
        </section>
      </section>
    </main>
  );
}

function CameraDetailTable({
  cameras,
  selectedIndex,
}: {
  cameras: CameraLiveAddress[];
  selectedIndex: number;
}) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="摄像头详情表">
          <Table.Header>
            <Table.Column isRowHeader>摄像头</Table.Column>
            <Table.Column>通道</Table.Column>
            <Table.Column>状态</Table.Column>
          </Table.Header>
          <Table.Body>
            {cameras.map((camera, index) => (
              <Table.Row
                id={cameraKey(camera, index)}
                key={cameraKey(camera, index)}
              >
                <Table.Cell>
                  <div className="table-cell-stack">
                    <span>{camera.spaceName || "未命名空间"}</span>
                    <Typography.Paragraph size="xs" color="muted">
                      第 {index + 1} 路
                    </Typography.Paragraph>
                  </div>
                </Table.Cell>
                <Table.Cell>{camera.channelNo ?? "-"}</Table.Cell>
                <Table.Cell>
                  <Chip
                    className="chip-inline"
                    color={index === selectedIndex ? "success" : "warning"}
                    size="sm"
                  >
                    {index === selectedIndex ? "当前播放" : "待切换"}
                  </Chip>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
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
