import {
  Button,
  Card,
  Chip,
  EmptyState,
  Pagination,
  Spinner,
  Typography,
} from "@heroui/react";
import {
  ArrowRight,
  Camera,
  FolderKanban,
  Gauge,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useRequireAuth } from "../hooks/use-auth-redirect";
import { clearAuthSession } from "../lib/auth";
import { PROJECTS } from "../lib/projects";

const PROJECT_PAGE_SIZE = 6;

export function meta() {
  return [{ title: "项目列表" }, { name: "description", content: "项目列表" }];
}

export default function ProjectsRoute() {
  const { session, checking } = useRequireAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const totalProjects: number = PROJECTS.length;
  const pageCount = Math.max(1, Math.ceil(totalProjects / PROJECT_PAGE_SIZE));
  const visibleProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * PROJECT_PAGE_SIZE;
    return PROJECTS.slice(startIndex, startIndex + PROJECT_PAGE_SIZE);
  }, [currentPage]);
  const firstProjectNumber =
    totalProjects === 0 ? 0 : (currentPage - 1) * PROJECT_PAGE_SIZE + 1;
  const lastProjectNumber = Math.min(
    currentPage * PROJECT_PAGE_SIZE,
    totalProjects,
  );

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  if (checking) {
    return <PageLoading label="正在校验登录状态" />;
  }

  return (
    <main className="console-screen projects-screen">
      <header className="console-topbar">
        <div className="console-brand">
          <div className="brand-mark" aria-hidden="true">
            <Camera size={22} />
          </div>
          <div>
            <span className="eyebrow">EZVIZ CONTROL</span>
            <Typography.Heading className="page-title" level={1}>
              项目调度台
            </Typography.Heading>
          </div>
        </div>
        <div className="header-actions">
          <Chip className="chip-inline" variant="soft">
            {session?.user?.loginName || "已登录"}
          </Chip>
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

      <section className="command-strip" aria-label="项目总览">
        <div className="command-copy">
          <Chip className="chip-inline signal-chip" color="success" size="sm">
            已授权
          </Chip>
          <Typography.Heading className="command-title" level={2}>
            选择项目进入摄像头播放
          </Typography.Heading>
          <Typography.Paragraph className="command-summary" color="muted">
            当前账号可查看 {totalProjects} 个项目。
          </Typography.Paragraph>
        </div>
        <div className="telemetry-grid" aria-label="项目状态">
          <MetricTile
            icon={<FolderKanban size={18} aria-hidden="true" />}
            label="项目"
            value={String(totalProjects)}
          />
          <MetricTile
            icon={<ShieldCheck size={18} aria-hidden="true" />}
            label="会话"
            value="有效"
          />
          <MetricTile
            icon={<Gauge size={18} aria-hidden="true" />}
            label="分页"
            value={`${currentPage}/${pageCount}`}
          />
        </div>
      </section>

      <section className="section-stack" aria-label="项目列表">
        <div className="section-heading">
          <div>
            <Typography.Heading level={2}>项目列表</Typography.Heading>
            <Typography.Paragraph color="muted" size="sm">
              {totalProjects === 0
                ? "暂无项目"
                : `${firstProjectNumber}-${lastProjectNumber} / ${totalProjects}`}
            </Typography.Paragraph>
          </div>
        </div>
        <div className="project-grid">
          {visibleProjects.map((project) => (
            <Card key={project.projectId} className="project-card" variant="secondary">
              <Card.Content className="project-card-content">
                <div className="project-card-icon-box" aria-hidden="true">
                  <FolderKanban size={20} />
                </div>
                <div className="project-card-copy">
                  <Card.Title className="project-card-title">
                    {project.name}
                  </Card.Title>
                  <Card.Description className="project-card-description">
                    {project.projectId}
                  </Card.Description>
                </div>
                <Chip
                  className="project-card-status"
                  color="success"
                  size="sm"
                  variant="soft"
                >
                  可查看
                </Chip>
                <Button
                  className="project-card-action"
                  size="sm"
                  onPress={() => {
                    void navigate(`/projects/${project.projectId}/cameras`);
                  }}
                >
                  <span>查看摄像头</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </Card.Content>
            </Card>
          ))}
        </div>

        <ProjectPagination
          currentPage={currentPage}
          firstProjectNumber={firstProjectNumber}
          lastProjectNumber={lastProjectNumber}
          pageCount={pageCount}
          total={totalProjects}
          onPageChange={setCurrentPage}
        />
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

function PageLoading({ label }: { label: string }) {
  return (
    <main className="console-screen center-screen">
      <EmptyState>
        <Spinner />
        <Typography.Paragraph>{label}</Typography.Paragraph>
      </EmptyState>
    </main>
  );
}

function ProjectPagination({
  currentPage,
  firstProjectNumber,
  lastProjectNumber,
  pageCount,
  total,
  onPageChange,
}: {
  currentPage: number;
  firstProjectNumber: number;
  lastProjectNumber: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getPaginationPages(currentPage, pageCount);

  return (
    <div className="pagination-wrap">
      <Pagination aria-label="项目分页">
        <Pagination.Summary>
          {total === 0
            ? "暂无项目"
            : `${firstProjectNumber}-${lastProjectNumber} / ${total}`}
        </Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={currentPage === 1}
              onPress={() => onPageChange(currentPage - 1)}
            >
              <Pagination.PreviousIcon />
              上一页
            </Pagination.Previous>
          </Pagination.Item>
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <Pagination.Item key={`ellipsis-${index}`}>
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={page}>
                <Pagination.Link
                  isActive={page === currentPage}
                  onPress={() => onPageChange(page)}
                >
                  {page}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next
              isDisabled={currentPage === pageCount}
              onPress={() => onPageChange(currentPage + 1)}
            >
              下一页
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>
    </div>
  );
}

function getPaginationPages(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(pageCount - 1, currentPage + 1);

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < pageCount - 1) {
    pages.push("ellipsis");
  }

  pages.push(pageCount);
  return pages;
}
