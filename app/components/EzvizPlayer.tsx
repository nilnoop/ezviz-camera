import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Chip, Spinner } from "@heroui/react";

import type {
  EZUIKitPlayerConstructor,
  EZUIKitPlayerInstance,
} from "ezuikit-js";

type PlayerStatus = "idle" | "loading" | "ready" | "error";

interface PlayerSize {
  width: number;
  height: number;
}

const livePlayerThemeData = {
  footer: {
    btnList: [
      {
        iconId: "play",
        part: "left",
        defaultActive: 1,
        memo: "播放",
        isrender: 1,
      },
      {
        iconId: "sound",
        part: "left",
        defaultActive: 0,
        memo: "声音按钮",
        isrender: 1,
      },
      {
        iconId: "pantile",
        part: "left",
        defaultActive: 0,
        memo: "云台控制按钮",
        isrender: 1,
      },
      {
        iconId: "hd",
        part: "right",
        defaultActive: 0,
        memo: "清晰度切换按钮",
        isrender: 1,
      },
      {
        iconId: "webExpend",
        part: "right",
        defaultActive: 0,
        memo: "网页全屏按钮",
        isrender: 1,
      },
    ],
  },
};

interface EzvizPlayerProps {
  url: string | null;
  accessToken: string | null;
  width?: number;
  height?: number;
  deviceSerial?: string | null;
  channelNo?: number | null;
}

export function EzvizPlayer({
  url,
  accessToken,
  width = 960,
  height = 540,
  deviceSerial,
  channelNo,
}: EzvizPlayerProps) {
  const reactId = useId();
  const containerId = useMemo(
    () => `ezviz-player-${reactId.replace(/:/g, "")}`,
    [reactId],
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const playerSize = useElementSize(frameRef);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [message, setMessage] = useState("等待播放参数");

  useEffect(() => {
    if (!url || !accessToken) {
      setStatus("error");
      setMessage("缺少播放参数");
      return;
    }

    if (!playerSize) {
      setStatus("idle");
      setMessage("等待播放器容器尺寸");
      return;
    }

    let disposed = false;
    let player: EZUIKitPlayerInstance | null = null;

    async function mountPlayer() {
      setStatus("loading");
      setMessage("播放器初始化中");

      try {
        const { EZUIKitPlayer } = (await import("ezuikit-js")) as {
          EZUIKitPlayer: EZUIKitPlayerConstructor;
        };

        if (disposed) {
          return;
        }

        player = new EZUIKitPlayer({
          id: containerId,
          accessToken,
          url,
          width: playerSize.width,
          height: playerSize.height,
          language: "zh",
          themeData: livePlayerThemeData,
          deviceSerial: deviceSerial ?? undefined,
          channelNo: channelNo ?? undefined,
          handleSuccess: () => {
            setStatus("ready");
            setMessage("播放中");
          },
          handleError: (error: unknown) => {
            console.error("EZUIKit player error", error);
            setStatus("error");
            setMessage("播放失败");
          },
        });
      } catch (error) {
        if (!disposed) {
          console.error("EZUIKit player initialization failed", error);
          setStatus("error");
          setMessage("播放器资源加载失败");
        }
      }
    }

    void mountPlayer();

    return () => {
      disposed = true;
      try {
        void player?.stop?.();
        player?.destroy?.();
      } catch {
        // SDK cleanup should not block route transitions.
      } finally {
        document.getElementById(containerId)?.replaceChildren();
      }
    };
  }, [
    accessToken,
    channelNo,
    containerId,
    deviceSerial,
    playerSize,
    url,
  ]);

  return (
    <div className="camera-player-shell">
      <div
        ref={frameRef}
        className="camera-player-frame"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div id={containerId} className="camera-player-target" />
        {status !== "ready" && (
          <div className="camera-player-overlay">
            {status === "loading" && <Spinner size="sm" />}
            <span>{message}</span>
          </div>
        )}
      </div>
      <div className="camera-player-footer">
        <Chip
          color={
            status === "ready"
              ? "success"
              : status === "error"
                ? "danger"
                : "warning"
          }
          size="sm"
        >
          {statusLabel(status)}
        </Chip>
      </div>
    </div>
  );
}

function statusLabel(status: PlayerStatus) {
  if (status === "ready") {
    return "播放中";
  }
  if (status === "loading") {
    return "连接中";
  }
  if (status === "error") {
    return "异常";
  }
  return "待命";
}

function useElementSize(elementRef: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState<PlayerSize | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    let animationFrameId = 0;

    function syncSize() {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        const frameRect = element.getBoundingClientRect();
        const nextSize = getElementSize(frameRect);

        if (!nextSize) {
          return;
        }

        setSize((currentSize) => {
          if (
            currentSize?.width === nextSize.width &&
            currentSize.height === nextSize.height
          ) {
            return currentSize;
          }

          return nextSize;
        });
      });
    }

    syncSize();

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(element);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [elementRef]);

  return size;
}

function getElementSize(frameRect: DOMRect) {
  const measuredWidth = Math.round(frameRect.width);
  const measuredHeight = Math.round(frameRect.height);

  if (measuredWidth <= 0 || measuredHeight <= 0) {
    return null;
  }

  return { width: measuredWidth, height: measuredHeight };
}
