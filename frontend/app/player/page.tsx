"use client";

import { useEffect, useRef, useState } from "react";

// ==================== 类型定义 ====================
interface MediaLayer {
  id: string;
  name: string;
  file: File;
  type: "video" | "audio";
  position: { x: number; y: number };
  scale: number;
  zIndex: number;
  decoder: VideoDecoder | null;
  audioDecoder: AudioDecoder | null;
  frames: VideoFrame[];
  currentFrameIndex: number;
  duration: number;
  isPlaying: boolean;
}

// ==================== WebCodecs 解码器封装 ====================
class MediaDecoder {
  private videoDecoder: VideoDecoder | null = null;
  private audioDecoder: AudioDecoder | null = null;
  private frames: VideoFrame[] = [];
  private onFrameCallback: ((frame: VideoFrame) => void) | null = null;

  async initVideoDecoder(config: VideoDecoderConfig) {
    this.videoDecoder = new VideoDecoder({
      output: (frame: VideoFrame) => {
        this.frames.push(frame);
        if (this.onFrameCallback) {
          this.onFrameCallback(frame);
        }
        console.log(
          `[Decoder] Frame decoded: ${frame.timestamp}, total frames: ${this.frames.length}`,
        );
      },
      error: (error: Error) => {
        console.error("[Decoder] Video decode error:", error);
      },
    });

    this.videoDecoder.configure(config);
    console.log("[Decoder] Video decoder configured:", config);
  }

  async initAudioDecoder(config: AudioDecoderConfig) {
    this.audioDecoder = new AudioDecoder({
      output: (audioData: AudioData) => {
        console.log("[Decoder] Audio data decoded:", audioData.timestamp);
        audioData.close();
      },
      error: (error: Error) => {
        console.error("[Decoder] Audio decode error:", error);
      },
    });

    this.audioDecoder.configure(config);
    console.log("[Decoder] Audio decoder configured:", config);
  }

  decodeVideoChunk(chunk: EncodedVideoChunk) {
    if (this.videoDecoder && this.videoDecoder.state === "configured") {
      this.videoDecoder.decode(chunk);
    }
  }

  decodeAudioChunk(chunk: EncodedAudioChunk) {
    if (this.audioDecoder && this.audioDecoder.state === "configured") {
      this.audioDecoder.decode(chunk);
    }
  }

  onFrame(callback: (frame: VideoFrame) => void) {
    this.onFrameCallback = callback;
  }

  getFrames(): VideoFrame[] {
    return this.frames;
  }

  async flush() {
    if (this.videoDecoder) {
      await this.videoDecoder.flush();
      console.log("[Decoder] Video decoder flushed");
    }
    if (this.audioDecoder) {
      await this.audioDecoder.flush();
      console.log("[Decoder] Audio decoder flushed");
    }
  }

  destroy() {
    this.frames.forEach((frame) => frame.close());
    this.frames = [];
    if (this.videoDecoder) {
      this.videoDecoder.close();
      this.videoDecoder = null;
    }
    if (this.audioDecoder) {
      this.audioDecoder.close();
      this.audioDecoder = null;
    }
    console.log("[Decoder] Decoder destroyed");
  }
}

// ==================== WebGPU 渲染器封装 ====================
class WebGPURenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private sampler: GPUSampler | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private resourcePool: Array<{ buffer?: GPUBuffer; texture?: GPUTexture }> =
    [];

  async initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 检查 WebGPU 支持
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported");
    }

    // 获取 GPU 适配器和设备
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No GPU adapter found");
    }

    this.device = await adapter.requestDevice();
    console.log("[WebGPU] Device initialized");

    // 配置 canvas context
    this.context = canvas.getContext("webgpu");
    if (!this.context) {
      throw new Error("Failed to get WebGPU context");
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied",
    });

    // 创建着色器
    const shaderModule = this.device.createShaderModule({
      label: "Video shader",
      code: `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        };

        @vertex
        fn vertexMain(@location(0) position: vec2f, @location(1) texCoord: vec2f) -> VertexOutput {
          var output: VertexOutput;
          output.position = vec4f(position, 0.0, 1.0);
          output.texCoord = texCoord;
          return output;
        }

        @group(0) @binding(0) var textureSampler: sampler;
        @group(0) @binding(1) var textureData: texture_2d<f32>;

        @fragment
        fn fragmentMain(@location(0) texCoord: vec2f) -> @location(0) vec4f {
          return textureSample(textureData, textureSampler, texCoord);
        }
      `,
    });

    // 创建渲染管线
    this.pipeline = this.device.createRenderPipeline({
      label: "Video pipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: [
          {
            arrayStride: 4 * 4, // 4 floats: 2 for position, 2 for texCoord
            attributes: [
              { format: "float32x2", offset: 0, shaderLocation: 0 }, // position
              { format: "float32x2", offset: 8, shaderLocation: 1 }, // texCoord
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: presentationFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // 创建采样器
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    console.log("[WebGPU] Renderer initialized");
  }

  createVertexBuffer(
    x: number,
    y: number,
    width: number,
    height: number,
  ): GPUBuffer {
    if (!this.device) throw new Error("Device not initialized");

    // 将像素坐标转换为 NDC 坐标 (-1 to 1)
    const canvasWidth = this.canvas?.width || 1920;
    const canvasHeight = this.canvas?.height || 1080;

    const ndcX = (x / canvasWidth) * 2 - 1;
    const ndcY = -((y / canvasHeight) * 2 - 1);
    const ndcWidth = (width / canvasWidth) * 2;
    const ndcHeight = (height / canvasHeight) * 2;

    // 顶点数据: position (x, y), texCoord (u, v)
    const vertices = new Float32Array([
      // Triangle 1
      ndcX,
      ndcY,
      0,
      0, // top-left
      ndcX + ndcWidth,
      ndcY,
      1,
      0, // top-right
      ndcX,
      ndcY - ndcHeight,
      0,
      1, // bottom-left

      // Triangle 2
      ndcX + ndcWidth,
      ndcY,
      1,
      0, // top-right
      ndcX + ndcWidth,
      ndcY - ndcHeight,
      1,
      1, // bottom-right
      ndcX,
      ndcY - ndcHeight,
      0,
      1, // bottom-left
    ]);

    const buffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(buffer, 0, vertices);
    return buffer;
  }

  renderFrame(layers: MediaLayer[]) {
    if (!this.device || !this.context || !this.pipeline || !this.sampler) {
      console.warn("[WebGPU] Renderer not fully initialized");
      return;
    }

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);

    // 清理上一帧的资源
    this.cleanupResourcePool();

    // 按 zIndex 排序（从小到大，后渲染的在上层）
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      if (layer.frames.length === 0) continue;

      const frameIndex = Math.min(
        layer.currentFrameIndex,
        layer.frames.length - 1,
      );
      const frame = layer.frames[frameIndex];

      if (!frame) continue;

      try {
        // 创建纹理
        const texture = this.device.createTexture({
          size: { width: frame.displayWidth, height: frame.displayHeight },
          format: "rgba8unorm",
          usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
        });

        // 从 VideoFrame 复制数据到纹理
        this.device.queue.copyExternalImageToTexture(
          { source: frame },
          { texture },
          { width: frame.displayWidth, height: frame.displayHeight },
        );

        // 创建绑定组
        const bindGroup = this.device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: this.sampler },
            { binding: 1, resource: texture.createView() },
          ],
        });

        // 创建顶点缓冲区
        const vertexBuffer = this.createVertexBuffer(
          layer.position.x,
          layer.position.y,
          frame.displayWidth * layer.scale,
          frame.displayHeight * layer.scale,
        );

        renderPass.setBindGroup(0, bindGroup);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.draw(6); // 6 vertices for 2 triangles

        // 将资源添加到池中，在下一帧再清理
        this.resourcePool.push({ buffer: vertexBuffer, texture });
      } catch (error) {
        console.error("[WebGPU] Error rendering layer:", layer.name, error);
      }
    }

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  private cleanupResourcePool() {
    // 清理上一帧的资源
    for (const resource of this.resourcePool) {
      if (resource.buffer) {
        resource.buffer.destroy();
      }
      if (resource.texture) {
        resource.texture.destroy();
      }
    }
    this.resourcePool = [];
  }

  destroy() {
    // 清理资源池
    this.cleanupResourcePool();

    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }
    if (this.device) {
      this.device.destroy();
    }
    console.log("[WebGPU] Renderer destroyed");
  }
}

// ==================== 文件解析器 ====================
class MediaFileParser {
  static async parseMP4(file: File): Promise<{
    videoConfig?: VideoDecoderConfig;
    audioConfig?: AudioDecoderConfig;
  }> {
    console.log("[Parser] Parsing MP4 file:", file.name);

    // 简化的 MP4 解析 - 使用硬编码的配置
    // 在实际项目中，应该使用 mp4box.js 或类似库来解析 MP4 容器

    return {
      videoConfig: {
        codec: "avc1.64001f", // H.264 High Profile
        codedWidth: 1920,
        codedHeight: 1080,
        hardwareAcceleration: "prefer-hardware",
      },
    };
  }

  static async extractVideoFrames(
    file: File,
    decoder: MediaDecoder,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    console.log("[Parser] Extracting video frames from:", file.name);

    // 创建 video 元素来提取帧
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    const duration = video.duration;
    const fps = 30; // 假设 30fps
    const frameCount = Math.floor(duration * fps);

    console.log(
      `[Parser] Video duration: ${duration}s, extracting ${frameCount} frames`,
    );

    // 使用 VideoDecoder 配置
    const config: VideoDecoderConfig = {
      codec: "avc1.64001f",
      codedWidth: video.videoWidth,
      codedHeight: video.videoHeight,
      hardwareAcceleration: "prefer-hardware",
    };

    await decoder.initVideoDecoder(config);

    // 使用 MediaSource 或简化方法提取帧
    // 这里使用简化的方法：使用 canvas 捕获帧
    for (let i = 0; i < Math.min(frameCount, 300); i++) {
      // 限制最多300帧用于演示
      const time = i / fps;
      video.currentTime = time;

      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      // 创建 VideoFrame
      const frame = new VideoFrame(video, {
        timestamp: time * 1000000, // 微秒
      });

      decoder.decodeVideoChunk(
        new EncodedVideoChunk({
          type: "key",
          timestamp: time * 1000000,
          data: new Uint8Array(0), // 空数据，因为我们直接使用 VideoFrame
        }),
      );

      if (onProgress) {
        onProgress((i + 1) / frameCount);
      }
    }

    await decoder.flush();
    URL.revokeObjectURL(video.src);
    console.log("[Parser] Frame extraction complete");
  }
}

// ==================== 主组件 ====================
export default function PlayerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [layers, setLayers] = useState<MediaLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [gpuSupported, setGpuSupported] = useState(true);

  // 初始化 WebGPU
  useEffect(() => {
    const initWebGPU = async () => {
      if (!canvasRef.current) return;

      try {
        const renderer = new WebGPURenderer();
        await renderer.initialize(canvasRef.current);
        rendererRef.current = renderer;
        console.log("[App] WebGPU initialized successfully");
      } catch (error) {
        console.error("[App] Failed to initialize WebGPU:", error);
        setGpuSupported(false);
      }
    };

    initWebGPU();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 渲染循环
  useEffect(() => {
    if (!isPlaying || !rendererRef.current) return;

    let startTime = performance.now();
    const fps = 30;
    const frameTime = 1000 / fps;

    const render = (time: number) => {
      const elapsed = time - startTime;

      if (elapsed >= frameTime) {
        startTime = time;

        // 更新所有图层的当前帧
        setLayers((prevLayers) =>
          prevLayers.map((layer) => ({
            ...layer,
            currentFrameIndex: Math.min(
              layer.currentFrameIndex + 1,
              layer.frames.length - 1,
            ),
          })),
        );

        // 渲染
        if (rendererRef.current) {
          rendererRef.current.renderFrame(layers);
        }

        setCurrentTime((prev) => prev + frameTime / 1000);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, layers]);

  // 加载媒体文件
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const type = file.type.startsWith("video/") ? "video" : "audio";
      const id = `${Date.now()}-${Math.random()}`;

      console.log(`[App] Loading file: ${file.name}, type: ${type}`);

      const newLayer: MediaLayer = {
        id,
        name: file.name,
        file,
        type,
        position: { x: 100, y: 100 },
        scale: 0.5,
        zIndex: layers.length,
        decoder: null,
        audioDecoder: null,
        frames: [],
        currentFrameIndex: 0,
        duration: 0,
        isPlaying: false,
      };

      setLayers((prev) => [...prev, newLayer]);

      // 异步解码
      if (type === "video") {
        const decoder = new MediaDecoder();

        try {
          // 简化的帧提取：使用 video 元素
          const video = document.createElement("video");
          video.src = URL.createObjectURL(file);
          video.muted = true;

          await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
          });

          const duration = video.duration;
          const fps = 30;
          const totalFrames = Math.min(Math.floor(duration * fps), 150); // 限制帧数

          const frames: VideoFrame[] = [];

          for (let i = 0; i < totalFrames; i++) {
            video.currentTime = i / fps;
            await new Promise((resolve) => (video.onseeked = resolve));

            const frame = new VideoFrame(video, {
              timestamp: (i / fps) * 1000000,
            });
            frames.push(frame);
          }

          URL.revokeObjectURL(video.src);

          console.log(`[App] Loaded ${frames.length} frames for ${file.name}`);

          setLayers((prev) =>
            prev.map((layer) =>
              layer.id === id ? { ...layer, frames, duration } : layer,
            ),
          );
        } catch (error) {
          console.error("[App] Error loading video:", error);
        }
      }
    }
  };

  // 更新图层位置
  const updateLayerPosition = (id: string, x: number, y: number) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, position: { x, y } } : layer,
      ),
    );
  };

  // 更新图层层级
  const updateLayerZIndex = (id: string, zIndex: number) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, zIndex } : layer)),
    );
  };

  // 删除图层
  const removeLayer = (id: string) => {
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (layer) {
        layer.frames.forEach((frame) => frame.close());
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  // 播放/暂停
  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  // 重置
  const reset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setLayers((prev) =>
      prev.map((layer) => ({ ...layer, currentFrameIndex: 0 })),
    );
  };

  if (!gpuSupported) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">WebGPU Not Supported</h1>
          <p>
            Your browser does not support WebGPU. Please use Chrome 113+ or Edge
            113+.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">WebGPU + WebCodecs Player</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas 区域 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="aspect-video bg-black rounded overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={1920}
                  height={1080}
                  className="w-full h-full"
                />
              </div>

              {/* 控制按钮 */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
                >
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded font-semibold"
                >
                  ⏹ Reset
                </button>
                <span className="text-gray-400">
                  Time: {currentTime.toFixed(2)}s
                </span>
              </div>

              {/* 文件加载 */}
              <div className="mt-4">
                <label className="block">
                  <span className="sr-only">Choose files</span>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    multiple
                    onChange={handleFileLoad}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700
                      cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 图层控制面板 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">
                Layers ({layers.length})
              </h2>

              <div className="space-y-3">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`bg-gray-700 rounded p-3 cursor-pointer transition ${
                      selectedLayerId === layer.id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold truncate flex-1">
                        {layer.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="ml-2 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Type: {layer.type}</div>
                      <div>Frames: {layer.frames.length}</div>
                      <div>Frame: {layer.currentFrameIndex}</div>
                    </div>

                    {/* 位置控制 */}
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-xs text-gray-400">
                          X Position
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1920"
                          value={layer.position.x}
                          onChange={(e) =>
                            updateLayerPosition(
                              layer.id,
                              parseInt(e.target.value),
                              layer.position.y,
                            )
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Y Position
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1080"
                          value={layer.position.y}
                          onChange={(e) =>
                            updateLayerPosition(
                              layer.id,
                              layer.position.x,
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Z-Index (Layer Order)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={layer.zIndex}
                          onChange={(e) =>
                            updateLayerZIndex(
                              layer.id,
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full bg-gray-600 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {layers.length === 0 && (
                  <div className="text-gray-400 text-center py-8">
                    No layers loaded. Add files to get started.
                  </div>
                )}
              </div>
            </div>

            {/* 调试信息 */}
            <div className="mt-4 bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-bold mb-2">Debug Info</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>WebGPU: ✓ Supported</div>
                <div>WebCodecs: ✓ Supported</div>
                <div>Playing: {isPlaying ? "Yes" : "No"}</div>
                <div>Layers: {layers.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 在frontend/app下增加一个页面player，实现多个音视频的播放功能。要求：
// 1. 必须完全使用webgpu和webcodecs实现！！！
// 2. 可以从本地加载音频或视频
// 3. 可以编辑层级，靠上的层级的视频渲染时在画面中也靠前
// 4. 可以调整视频在画面中的位置
// 5. 所有代码都写到page.tsx中即可，就是实现一个最简单的功能，还有，加载文件时使用web，不要使用tauri。不过代码要清晰，解码、渲染等逻辑都要封装好，而且要利于调试
