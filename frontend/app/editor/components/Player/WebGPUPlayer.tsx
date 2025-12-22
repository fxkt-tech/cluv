/**
 * WebGPU Video Player Component
 * 基于 WebGPU 的视频播放和合成引擎
 * 完全独立的播放器，不依赖外部状态管理
 */

import {
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
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
import { generateId } from "../../utils/timeline";

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
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
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

/**
 * Player 组件属性
 */
interface PlayerProps {
  tracks: Track[];
  fps?: number; // 帧率，用于上一帧/下一帧功能
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onDurationChange?: (duration: number) => void;
}

export const WebGPUPlayer = forwardRef<PlayerRef, PlayerProps>(
  (
    {
      tracks,
      fps = 30,
      onTimeUpdate,
      onPlayStateChange,
      onDurationChange,
    }: PlayerProps,
    ref,
  ) => {
    // Canvas 引用
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 播放状态 - 组件内部状态
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasLayers, setHasLayers] = useState(false);
    const [isWebGPUReady, setIsWebGPUReady] = useState(false);

    // WebGPU 资源引用
    const deviceRef = useRef<GPUDevice | null>(null);
    const contextRef = useRef<GPUCanvasContext | null>(null);
    const pipelineRef = useRef<GPURenderPipeline | null>(null);
    const samplerRef = useRef<GPUSampler | null>(null);

    // 图层和动画状态
    const layersRef = useRef<VideoLayer[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number>(0);
    const isSeekingRef = useRef(false);
    const isPlayingRef = useRef(isPlaying);
    const currentTimeRef = useRef(currentTime);
    const durationRef = useRef(duration);

    // 画布尺寸
    const width: number = 1920;
    const height: number = 1080;

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
        canvas.width = width;
        canvas.height = height;

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
     * 渲染循环 - 使用 ref 获取最新状态
     */
    const renderLoopRef = useRef<((timestamp: number) => void) | null>(null);

    useEffect(() => {
      isPlayingRef.current = isPlaying;
      currentTimeRef.current = currentTime;
      durationRef.current = duration;

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

        const currentIsPlaying = isPlayingRef.current;
        const currentDuration = durationRef.current;
        let newTime = currentTimeRef.current;

        // 更新时间
        if (!isSeekingRef.current && currentIsPlaying) {
          newTime += deltaTime;

          if (newTime >= currentDuration) {
            newTime = currentDuration;
            // 播放结束，暂停
            setIsPlaying(false);
            onPlayStateChange?.(false);
            layersRef.current.forEach((layer) => layer.video.pause());
          }

          setCurrentTime(newTime);
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
          if (currentIsPlaying && !isSeekingRef.current) {
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
          const hasResource =
            layer.video.readyState >= 2 && !layer.video.seeking;

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

      renderLoopRef.current = renderLoop;
    }, [isPlaying, currentTime, duration, onTimeUpdate, onPlayStateChange]);

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
        if (Math.abs(prevDuration - maxDuration) > 0.001) {
          onDurationChange?.(maxDuration);
          return maxDuration;
        }
        return prevDuration;
      });
    }, [onDurationChange]);

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
            const canvasAspect = width / height;
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
              id: generateId(),
              name: name || `Video ${layersRef.current.length + 1}`,
              video,
              zIndex: 100 - layersRef.current.length,
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
     * 播放
     */
    const play = useCallback(() => {
      if (layersRef.current.length === 0) return;

      // 如果播放到结尾，重置到开始
      setCurrentTime((prevTime) => {
        if (prevTime >= duration - 0.001) {
          const newTime = 0;
          syncVideosToTime(newTime);
          return newTime;
        }
        return prevTime;
      });

      setIsPlaying(true);
      onPlayStateChange?.(true);

      // 启动相关时间点的视频
      layersRef.current.forEach((layer) => {
        const localTime = currentTime - layer.startTime;
        if (localTime >= 0 && localTime < layer.video.duration) {
          layer.video.play().catch(() => {});
        }
      });
    }, [currentTime, duration, syncVideosToTime, onPlayStateChange]);

    /**
     * 暂停
     */
    const pause = useCallback(() => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      layersRef.current.forEach((layer) => layer.video.pause());
    }, [onPlayStateChange]);

    /**
     * 切换播放/暂停
     */
    const togglePlayPause = useCallback(() => {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    }, [isPlaying, play, pause]);

    /**
     * 跳转到指定时间
     */
    const seekTo = useCallback(
      (time: number) => {
        isSeekingRef.current = true;
        const clampedTime = Math.max(0, Math.min(time, duration));
        setCurrentTime(clampedTime);
        syncVideosToTime(clampedTime);
        onTimeUpdate?.(clampedTime);

        setTimeout(() => {
          isSeekingRef.current = false;
        }, 100);
      },
      [duration, onTimeUpdate, syncVideosToTime],
    );

    /**
     * 下一帧
     */
    const stepForward = useCallback(() => {
      const frameTime = 1 / fps;
      setCurrentTime((prevTime) => {
        const newTime = Math.min(prevTime + frameTime, duration);
        syncVideosToTime(newTime);
        onTimeUpdate?.(newTime);
        return newTime;
      });
    }, [fps, duration, syncVideosToTime, onTimeUpdate]);

    /**
     * 上一帧
     */
    const stepBackward = useCallback(() => {
      const frameTime = 1 / fps;
      setCurrentTime((prevTime) => {
        const newTime = Math.max(prevTime - frameTime, 0);
        syncVideosToTime(newTime);
        onTimeUpdate?.(newTime);
        return newTime;
      });
    }, [fps, syncVideosToTime, onTimeUpdate]);

    /**
     * 获取当前时间
     */
    const getCurrentTime = useCallback(() => currentTime, [currentTime]);

    /**
     * 获取总时长
     */
    const getDuration = useCallback(() => duration, [duration]);

    /**
     * 获取播放状态
     */
    const getIsPlaying = useCallback(() => isPlaying, [isPlaying]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        play, // 播放
        pause, // 暂停
        togglePlayPause, // 切换播放状态
        seekTo, // 跳转到指定时间
        stepForward, // 向前跳一帧
        stepBackward, // 向后跳一帧
        getCurrentTime, // 获取当前时间
        getDuration, // 获取总时长
        isPlaying: getIsPlaying, // 获取播放状态
        addVideoLayer, // 添加视频层
        clearLayers, // 清除所有层
        updateLayerTransform, // 更新层的变换
        syncTracksToLayers, // 同步轨道到层
      }),
      [
        play,
        pause,
        togglePlayPause,
        seekTo,
        stepForward,
        stepBackward,
        getCurrentTime,
        getDuration,
        getIsPlaying,
        addVideoLayer,
        clearLayers,
        updateLayerTransform,
        syncTracksToLayers,
      ],
    );

    // 初始化 WebGPU 和渲染循环
    useEffect(() => {
      let mounted = true;
      const init = async () => {
        const success = await initWebGPU();
        if (success && mounted && renderLoopRef.current) {
          animationFrameRef.current = requestAnimationFrame(
            renderLoopRef.current,
          );
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
    }, []);

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

    // UI 控制处理
    const handlePlayPause = () => {
      togglePlayPause();
    };

    const handlePrevious = () => {
      stepBackward();
    };

    const handleNext = () => {
      stepForward();
    };

    return (
      <main className={"flex-1 flex flex-col relative min-w-0 bg-editor-bg"}>
        {/* 播放器画布 */}
        <div className="flex-1 flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            className="aspect-video max-w-full max-h-full shadow-lg border border-editor-border bg-black object-contain"
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

WebGPUPlayer.displayName = "WebGPUPlayer";
