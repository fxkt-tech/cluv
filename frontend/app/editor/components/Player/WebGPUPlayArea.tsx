/**
 * WebGPU Video Player Component
 * 基于 WebGPU 的视频播放和合成引擎
 */

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  PlayIcon,
  PauseIcon,
  PreviousFrameIcon,
  NextFrameIcon,
} from "../../icons";
import { Track } from "../../types/timeline";
import { convertFileSrc } from "@tauri-apps/api/core";
import { SHADER_SOURCE } from "./shader/video";
import { formatTime } from "../../utils/time";
import { useTimelineStore } from "../../stores/timelineStore";

/**
 * 视频图层接口
 */
export interface VideoLayer {
  id: string;
  name: string;
  video: HTMLVideoElement;
  zIndex: number;
  posX: number;
  posY: number;
  scale: number;
  startTime: number;
  baseScaleX: number;
  baseScaleY: number;
  uniformBuffer?: GPUBuffer;
  opacity?: number;
  rotation?: number;
}

/**
 * Player 暴露的方法接口
 */
export interface PlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  addVideoLayer: (
    videoSrc: string,
    startTime: number,
    name?: string,
  ) => Promise<void>;
  clearLayers: () => void;
  updateLayerTransform: (
    layerId: string,
    transform: Partial<VideoLayer>,
  ) => void;
  syncTracksToLayers: (tracks: Track[]) => Promise<void>;
}

interface PlayerProps {
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  externalTime?: number; // 外部控制的时间（从 Timeline）
  className?: string;
  tracks?: Track[]; // Timeline 的 tracks
}

export const WebGPUPlayArea = forwardRef<PlayerRef, PlayerProps>(
  (
    {
      onTimeUpdate,
      onPlayStateChange,
      externalTime,
      className = "",
      tracks = [],
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // 从 timelineStore 读取播放状态和时间，作为单一数据源
    const isPlaying = useTimelineStore((state) => state.isPlaying);
    const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);
    const timelineCurrentTime = useTimelineStore((state) => state.currentTime);
    const setTimelineCurrentTime = useTimelineStore(
      (state) => state.setCurrentTime,
    );
    const stepForward = useTimelineStore((state) => state.stepForward);
    const stepBackward = useTimelineStore((state) => state.stepBackward);

    // 本地状态用于渲染循环的高频更新
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasLayers, setHasLayers] = useState(false);
    const [isWebGPUReady, setIsWebGPUReady] = useState(false);

    // WebGPU 状态
    const deviceRef = useRef<GPUDevice | null>(null);
    const contextRef = useRef<GPUCanvasContext | null>(null);
    const pipelineRef = useRef<GPURenderPipeline | null>(null);
    const samplerRef = useRef<GPUSampler | null>(null);

    // 播放状态
    const layersRef = useRef<VideoLayer[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number>(0);
    const isSeekingRef = useRef(false);
    const externalTimeRef = useRef<number | undefined>(undefined);
    const lastTimelineSyncTimeRef = useRef<number>(timelineCurrentTime);

    /**
     * 初始化 WebGPU
     */
    const initWebGPU = async () => {
      if (!navigator.gpu) {
        console.error("WebGPU 不支持");
        return false;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          console.error("无法获取 GPU 适配器");
          return false;
        }

        const device = await adapter.requestDevice();
        deviceRef.current = device;

        const canvas = canvasRef.current;
        if (!canvas) return false;

        // 设置画布尺寸
        canvas.width = 1920;
        canvas.height = 1080;

        const context = canvas.getContext("webgpu");
        if (!context) {
          console.error("无法获取 WebGPU 上下文");
          return false;
        }

        contextRef.current = context;
        context.configure({
          device,
          format: navigator.gpu.getPreferredCanvasFormat(),
          alphaMode: "premultiplied",
        });

        // 创建 Shader 模块
        const shaderModule = device.createShaderModule({ code: SHADER_SOURCE });

        // 创建渲染管线
        const pipeline = device.createRenderPipeline({
          layout: "auto",
          vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
          },
          fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [
              {
                format: navigator.gpu.getPreferredCanvasFormat(),
                blend: {
                  color: {
                    operation: "add",
                    srcFactor: "src-alpha",
                    dstFactor: "one-minus-src-alpha",
                  },
                  alpha: {
                    operation: "add",
                    srcFactor: "one",
                    dstFactor: "one-minus-src-alpha",
                  },
                },
              },
            ],
          },
          primitive: { topology: "triangle-strip" },
        });

        pipelineRef.current = pipeline;

        // 创建采样器
        const sampler = device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        });

        samplerRef.current = sampler;

        setIsWebGPUReady(true);
        return true;
      } catch (error) {
        console.error("WebGPU 初始化失败:", error);
        setIsWebGPUReady(false);
        return false;
      }
    };

    /**
     * 同步所有视频到指定时间
     */
    const syncVideosToTime = useCallback((time: number) => {
      layersRef.current.forEach((layer) => {
        if (!layer.video.duration) return;

        const localTime = time - layer.startTime;
        const targetTime = Math.max(
          0,
          Math.min(localTime, layer.video.duration),
        );

        if (
          Math.abs(layer.video.currentTime - targetTime) > 0.05 &&
          layer.video.readyState >= 2
        ) {
          layer.video.currentTime = targetTime;
        }
      });
    }, []);

    /**
     * 渲染循环
     */
    const renderLoop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const device = deviceRef.current;
      const context = contextRef.current;
      const pipeline = pipelineRef.current;
      const sampler = samplerRef.current;

      if (!device || !context || !pipeline || !sampler) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      let newTime = currentTime;

      // 处理外部时间同步
      if (
        !isPlaying &&
        externalTimeRef.current !== undefined &&
        Math.abs(currentTime - externalTimeRef.current) > 0.1
      ) {
        newTime = externalTimeRef.current;
        setCurrentTime(newTime);
        syncVideosToTime(newTime);
        onTimeUpdate?.(newTime);
        externalTimeRef.current = undefined;
      }
      // 更新时间
      else if (!isSeekingRef.current && isPlaying) {
        newTime += deltaTime;

        if (newTime >= duration) {
          newTime = duration;
          setIsPlaying(false);
          onPlayStateChange?.(false);
          layersRef.current.forEach((layer) => layer.video.pause());
        }

        setCurrentTime(newTime);
        setTimelineCurrentTime(newTime);
        onTimeUpdate?.(newTime);
      }

      // 开始渲染
      const commandEncoder = device.createCommandEncoder();
      const currentTexture = context.getCurrentTexture();
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: currentTexture.createView(),
            clearValue: { r: 0.02, g: 0.02, b: 0.02, a: 1.0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });

      renderPass.setPipeline(pipeline);

      // 按 zIndex 排序图层
      const sortedLayers = [...layersRef.current].sort(
        (a, b) => a.zIndex - b.zIndex,
      );

      for (const layer of sortedLayers) {
        const localTime = newTime - layer.startTime;

        // 控制视频播放状态
        if (isPlaying && !isSeekingRef.current) {
          if (localTime >= 0 && localTime < layer.video.duration) {
            if (layer.video.paused && !layer.video.ended) {
              layer.video.play().catch(() => {});
            }
          } else {
            if (!layer.video.paused) {
              layer.video.pause();
            }
          }
        }

        // 判断是否可见
        const isVisible = localTime >= 0 && localTime <= layer.video.duration;
        const hasResource = layer.video.readyState >= 2 && !layer.video.seeking;

        if (isVisible && hasResource) {
          try {
            // 更新 uniform buffer
            const data = new Float32Array([
              layer.posX,
              layer.posY,
              layer.baseScaleX * layer.scale,
              layer.baseScaleY * layer.scale,
            ]);

            if (!layer.uniformBuffer) {
              layer.uniformBuffer = device.createBuffer({
                size: 16,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
              });
            }

            device.queue.writeBuffer(layer.uniformBuffer, 0, data);

            // 创建 bind group
            const bindGroup = device.createBindGroup({
              layout: pipeline.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer: layer.uniformBuffer } },
                { binding: 1, resource: sampler },
                {
                  binding: 2,
                  resource: device.importExternalTexture({
                    source: layer.video,
                  }),
                },
              ],
            });

            renderPass.setBindGroup(0, bindGroup);
            renderPass.draw(4);
          } catch {
            // 忽略渲染错误
          }
        }
      }

      renderPass.end();
      device.queue.submit([commandEncoder.finish()]);

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    /**
     * 更新全局时长
     */
    const updateDuration = useCallback(() => {
      const maxDuration =
        layersRef.current.length === 0
          ? 0
          : Math.max(
              ...layersRef.current.map(
                (l) => l.startTime + (l.video.duration || 0),
              ),
            );

      setDuration((prevDuration) => {
        // 只在时长真正变化时更新，避免循环
        if (Math.abs(prevDuration - maxDuration) > 0.01) {
          return maxDuration;
        }
        return prevDuration;
      });
    }, []);

    /**
     * 添加视频图层
     */
    const addVideoLayer = useCallback(
      async (
        videoSrc: string,
        startTime: number = 0,
        name?: string,
      ): Promise<void> => {
        const device = deviceRef.current;
        if (!device) {
          console.error("WebGPU 未初始化");
          return;
        }

        return new Promise((resolve, reject) => {
          const video = document.createElement("video");
          video.src = videoSrc;
          video.muted = false;
          video.playsInline = true;
          video.crossOrigin = "anonymous";
          video.preload = "auto";

          video.onloadedmetadata = () => {
            const canvasAspect = 1920 / 1080;
            const videoAspect = video.videoWidth / video.videoHeight;

            let initScaleX = 1.0;
            let initScaleY = 1.0;

            // 自适应缩放以适配画布
            if (videoAspect > canvasAspect) {
              initScaleY = canvasAspect / videoAspect;
            } else {
              initScaleX = videoAspect / canvasAspect;
            }

            const layer: VideoLayer = {
              id: Math.random().toString(36).substr(2, 9),
              name: name || `Video ${layersRef.current.length + 1}`,
              video,
              zIndex: layersRef.current.length,
              posX: 0,
              posY: 0,
              scale: 1.0,
              startTime,
              baseScaleX: initScaleX,
              baseScaleY: initScaleY,
              opacity: 1.0,
              rotation: 0,
            };

            layersRef.current.push(layer);
            setHasLayers(true);
            updateDuration();
            resolve();
          };

          video.onerror = () => {
            reject(new Error("视频加载失败"));
          };
        });
      },
      [updateDuration],
    );

    /**
     * 清空所有图层
     */
    const clearLayers = useCallback(() => {
      layersRef.current.forEach((layer) => {
        layer.video.pause();
        layer.video.src = "";
        if (layer.uniformBuffer) {
          layer.uniformBuffer.destroy();
        }
      });
      layersRef.current = [];
      setHasLayers(false);
      setCurrentTime(0);
      updateDuration();
    }, [updateDuration]);

    /**
     * 更新图层变换
     */
    const updateLayerTransform = useCallback(
      (layerId: string, transform: Partial<VideoLayer>) => {
        const layer = layersRef.current.find((l) => l.id === layerId);
        if (layer) {
          Object.assign(layer, transform);
        }
      },
      [],
    );

    /**
     * 从 Timeline tracks 同步视频图层
     */
    const syncTracksToLayers = useCallback(
      async (newTracks: Track[]) => {
        const device = deviceRef.current;
        if (!device || !isWebGPUReady) {
          console.warn("WebGPU 未就绪，等待初始化...");
          return;
        }

        // 收集所有视频 clips
        const videoClips = newTracks.flatMap((track) =>
          track.clips
            .filter((clip) => clip.type === "video" && clip.resourceSrc)
            .map((clip) => ({
              id: clip.id,
              src: clip.resourceSrc!,
              startTime: clip.startTime,
              name: clip.name,
            })),
        );

        // 检查是否需要更新
        const existingIds = new Set(layersRef.current.map((l) => l.id));
        const newIds = new Set(videoClips.map((c) => c.id));

        // 如果完全相同，不需要更新
        if (
          existingIds.size === newIds.size &&
          [...existingIds].every((id) => newIds.has(id))
        ) {
          return;
        }

        // 清空现有图层
        layersRef.current.forEach((layer) => {
          layer.video.pause();
          layer.video.src = "";
          if (layer.uniformBuffer) {
            layer.uniformBuffer.destroy();
          }
        });
        layersRef.current = [];

        // 添加新图层
        for (const clip of videoClips) {
          try {
            const videoUrl = convertFileSrc(clip.src);
            await addVideoLayer(videoUrl, clip.startTime, clip.name);
          } catch (error) {
            console.error(`加载视频失败: ${clip.name}`, error);
          }
        }

        setHasLayers(videoClips.length > 0);
      },
      [addVideoLayer, isWebGPUReady],
    );

    /**
     * 播放控制方法
     */
    const play = useCallback(() => {
      if (layersRef.current.length === 0) return;

      // 如果播放到结尾，重置到开始
      if (currentTime >= duration - 0.001) {
        setCurrentTime(0);
        syncVideosToTime(0);
      }

      // 只控制视频播放，不修改状态
      layersRef.current.forEach((layer) => {
        const localTime = currentTime - layer.startTime;
        if (localTime >= 0 && localTime < layer.video.duration) {
          layer.video.play().catch(() => {});
        }
      });
    }, [currentTime, duration, syncVideosToTime]);

    const pause = useCallback(() => {
      // 只控制视频暂停，不修改状态
      layersRef.current.forEach((layer) => layer.video.pause());
    }, []);

    const seekTo = useCallback(
      (time: number) => {
        isSeekingRef.current = true;
        setCurrentTime(time);
        syncVideosToTime(time);
        onTimeUpdate?.(time);

        setTimeout(() => {
          isSeekingRef.current = false;
        }, 100);
      },
      [onTimeUpdate, syncVideosToTime],
    );

    const getCurrentTime = useCallback(() => currentTime, [currentTime]);
    const getDuration = useCallback(() => duration, [duration]);
    const getIsPlaying = useCallback(() => isPlaying, [isPlaying]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        seekTo,
        getCurrentTime,
        getDuration,
        isPlaying: getIsPlaying,
        addVideoLayer,
        clearLayers,
        updateLayerTransform,
        syncTracksToLayers,
      }),
      [
        play,
        pause,
        seekTo,
        getCurrentTime,
        getDuration,
        getIsPlaying,
        addVideoLayer,
        clearLayers,
        updateLayerTransform,
        syncTracksToLayers,
      ],
    );

    // 初始化
    useEffect(() => {
      let mounted = true;
      const init = async () => {
        const success = await initWebGPU();
        if (success && mounted) {
          const loop = (timestamp: number) => {
            renderLoop(timestamp);
          };
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };

      init();

      return () => {
        mounted = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        // 清理图层
        layersRef.current.forEach((layer) => {
          layer.video.pause();
          layer.video.src = "";
          if (layer.uniformBuffer) {
            layer.uniformBuffer.destroy();
          }
        });
        layersRef.current = [];
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 监听 timelineStore 的 currentTime 变化进行同步（用于帧步进等操作）
    useEffect(() => {
      // 使用 ref 来跟踪上次同步的时间，避免循环
      if (
        !isPlaying &&
        timelineCurrentTime !== lastTimelineSyncTimeRef.current &&
        Math.abs(currentTime - timelineCurrentTime) > 0.01
      ) {
        lastTimelineSyncTimeRef.current = timelineCurrentTime;
        // 使用 setTimeout 避免在 effect 中直接调用 setState
        setTimeout(() => {
          setCurrentTime(timelineCurrentTime);
          syncVideosToTime(timelineCurrentTime);
          onTimeUpdate?.(timelineCurrentTime);
        }, 0);
      }
    }, [
      timelineCurrentTime,
      isPlaying,
      currentTime,
      syncVideosToTime,
      onTimeUpdate,
    ]);

    // 外部时间同步 - 使用 ref 避免在 effect 中调用 setState
    useEffect(() => {
      externalTimeRef.current = externalTime;
    }, [externalTime]);

    // 从 tracks 同步图层（等待 WebGPU 初始化完成）
    useEffect(() => {
      let mounted = true;
      const sync = async () => {
        if (mounted && isWebGPUReady && tracks && tracks.length > 0) {
          await syncTracksToLayers(tracks);
        }
      };
      sync();
      return () => {
        mounted = false;
      };
    }, [tracks, syncTracksToLayers, isWebGPUReady]);

    // 监听 isPlaying 状态变化，自动控制视频播放/暂停
    useEffect(() => {
      if (isPlaying && layersRef.current.length > 0) {
        layersRef.current.forEach((layer) => {
          const localTime = currentTime - layer.startTime;
          if (localTime >= 0 && localTime < layer.video.duration) {
            layer.video.play().catch(() => {});
          }
        });
      } else {
        layersRef.current.forEach((layer) => layer.video.pause());
      }
    }, [isPlaying, currentTime]);

    // 播放/暂停控制
    const handlePlayPause = () => {
      // 通过 store 切换播放状态，会触发 useEffect 监听
      setIsPlaying(!isPlaying);
    };

    // 上一帧 - 使用 store 的方法
    const handlePrevious = () => {
      stepBackward();
    };

    // 下一帧 - 使用 store 的方法
    const handleNext = () => {
      stepForward();
    };

    return (
      <main
        className={`flex-1 flex flex-col relative min-w-0 bg-editor-bg ${className}`}
      >
        {/* 播放器画布 */}
        <div className="flex-1 flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="aspect-video max-w-full max-h-full shadow-lg border border-editor-border bg-black"
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* 播放控制栏 */}
        <div className="h-8 flex items-center justify-center gap-4 shrink-0 border-t border-editor-border bg-editor-bg">
          <button
            onClick={handlePrevious}
            className="transition-colors text-lg text-text-secondary hover:text-text-fg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="上一帧"
            disabled={!hasLayers}
          >
            <PreviousFrameIcon size={20} />
          </button>

          <button
            onClick={handlePlayPause}
            className="transition-colors text-lg text-text-secondary hover:text-text-fg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "暂停" : "播放"}
            disabled={!hasLayers}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          <button
            onClick={handleNext}
            className="transition-colors text-lg text-text-secondary hover:text-text-fg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="下一帧"
            disabled={!hasLayers}
          >
            <NextFrameIcon size={20} />
          </button>

          <div className="text-xs font-mono ml-4 text-accent-cyan">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </main>
    );
  },
);

WebGPUPlayArea.displayName = "WebGPUPlayArea";
