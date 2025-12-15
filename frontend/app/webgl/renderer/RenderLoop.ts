/**
 * RenderLoop.ts
 *
 * 渲染循环管理器
 * - 帧时序管理
 * - FPS 控制和监控
 * - 更新/渲染周期分离
 * - 时间增量计算
 * - 性能统计
 */

/**
 * 渲染循环回调函数
 */
export interface RenderLoopCallbacks {
  /**
   * 更新回调（逻辑更新）
   * @param deltaTime 距离上一帧的时间（秒）
   * @param totalTime 总运行时间（秒）
   */
  onUpdate?: (deltaTime: number, totalTime: number) => void;

  /**
   * 渲染回调（绘制）
   * @param deltaTime 距离上一帧的时间（秒）
   * @param totalTime 总运行时间（秒）
   * @param interpolation 插值系数（用于固定时间步长时的平滑）
   */
  onRender?: (deltaTime: number, totalTime: number, interpolation: number) => void;

  /**
   * 帧结束回调
   */
  onFrameEnd?: () => void;
}

/**
 * 渲染循环配置
 */
export interface RenderLoopOptions {
  /**
   * 目标 FPS（0 表示不限制）
   * @default 60
   */
  targetFPS?: number;

  /**
   * 是否使用固定时间步长
   * @default false
   */
  fixedTimeStep?: boolean;

  /**
   * 固定时间步长（秒）
   * @default 1/60
   */
  timeStep?: number;

  /**
   * 最大帧时间（秒）- 防止螺旋死亡
   * @default 0.25
   */
  maxFrameTime?: number;

  /**
   * 是否自动启动
   * @default true
   */
  autoStart?: boolean;

  /**
   * 性能监控窗口大小（帧数）
   * @default 60
   */
  statsWindow?: number;
}

/**
 * 性能统计信息
 */
export interface RenderLoopStats {
  /** 当前 FPS */
  fps: number;
  /** 平均帧时间（毫秒） */
  frameTime: number;
  /** 最小帧时间（毫秒） */
  minFrameTime: number;
  /** 最大帧时间（毫秒） */
  maxFrameTime: number;
  /** 总帧数 */
  frameCount: number;
  /** 总运行时间（秒） */
  totalTime: number;
  /** 是否正在运行 */
  isRunning: boolean;
}

/**
 * 渲染循环管理器
 */
export class RenderLoop {
  private callbacks: RenderLoopCallbacks;
  private options: Required<RenderLoopOptions>;

  // 运行状态
  private isRunning = false;
  private rafId: number | null = null;

  // 时间管理
  private startTime = 0;
  private lastTime = 0;
  private currentTime = 0;
  private accumulator = 0;

  // 统计信息
  private frameCount = 0;
  private frameTimes: number[] = [];
  private fpsUpdateInterval = 0.5; // 每 0.5 秒更新一次 FPS
  private lastFpsUpdate = 0;
  private currentFPS = 0;

  constructor(callbacks: RenderLoopCallbacks, options: RenderLoopOptions = {}) {
    this.callbacks = callbacks;
    this.options = {
      targetFPS: options.targetFPS ?? 60,
      fixedTimeStep: options.fixedTimeStep ?? false,
      timeStep: options.timeStep ?? 1 / 60,
      maxFrameTime: options.maxFrameTime ?? 0.25,
      autoStart: options.autoStart ?? true,
      statsWindow: options.statsWindow ?? 60,
    };

    // 初始化帧时间数组
    this.frameTimes = new Array(this.options.statsWindow).fill(0);

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * 启动渲染循环
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.startTime = performance.now() / 1000;
    this.lastTime = this.startTime;
    this.lastFpsUpdate = this.startTime;
    this.accumulator = 0;

    this.rafId = requestAnimationFrame(this.loop);
  }

  /**
   * 停止渲染循环
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 暂停渲染循环
   */
  pause(): void {
    this.stop();
  }

  /**
   * 恢复渲染循环
   */
  resume(): void {
    if (this.isRunning) {
      return;
    }

    // 重置时间以避免大的时间跳跃
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.start();
  }

  /**
   * 渲染循环主函数
   */
  private loop = (timestamp: number): void => {
    if (!this.isRunning) {
      return;
    }

    // 转换为秒
    this.currentTime = timestamp / 1000;
    let deltaTime = this.currentTime - this.lastTime;
    this.lastTime = this.currentTime;

    // 防止螺旋死亡
    if (deltaTime > this.options.maxFrameTime) {
      deltaTime = this.options.maxFrameTime;
    }

    // 记录帧时间
    this.recordFrameTime(deltaTime * 1000); // 转换为毫秒

    const totalTime = this.currentTime - this.startTime;

    // FPS 限制
    if (this.options.targetFPS > 0) {
      const targetFrameTime = 1 / this.options.targetFPS;
      if (deltaTime < targetFrameTime) {
        // 帧太快，跳过本次渲染
        this.rafId = requestAnimationFrame(this.loop);
        return;
      }
    }

    if (this.options.fixedTimeStep) {
      // 固定时间步长模式
      this.fixedTimeStepLoop(deltaTime, totalTime);
    } else {
      // 可变时间步长模式
      this.variableTimeStepLoop(deltaTime, totalTime);
    }

    // 帧结束回调
    if (this.callbacks.onFrameEnd) {
      this.callbacks.onFrameEnd();
    }

    this.frameCount++;

    // 继续循环
    this.rafId = requestAnimationFrame(this.loop);
  };

  /**
   * 可变时间步长循环
   */
  private variableTimeStepLoop(deltaTime: number, totalTime: number): void {
    // 更新
    if (this.callbacks.onUpdate) {
      this.callbacks.onUpdate(deltaTime, totalTime);
    }

    // 渲染
    if (this.callbacks.onRender) {
      this.callbacks.onRender(deltaTime, totalTime, 1.0);
    }
  }

  /**
   * 固定时间步长循环（用于物理模拟等需要确定性的场景）
   */
  private fixedTimeStepLoop(deltaTime: number, totalTime: number): void {
    this.accumulator += deltaTime;

    // 更新：可能执行多次以赶上累积的时间
    let updateCount = 0;
    const maxUpdates = 5; // 防止无限循环

    while (this.accumulator >= this.options.timeStep && updateCount < maxUpdates) {
      if (this.callbacks.onUpdate) {
        this.callbacks.onUpdate(this.options.timeStep, totalTime);
      }
      this.accumulator -= this.options.timeStep;
      updateCount++;
    }

    // 如果积累了太多时间，丢弃多余的
    if (this.accumulator > this.options.timeStep * 2) {
      this.accumulator = this.options.timeStep;
    }

    // 渲染：总是执行一次，使用插值系数平滑
    if (this.callbacks.onRender) {
      const interpolation = this.accumulator / this.options.timeStep;
      this.callbacks.onRender(deltaTime, totalTime, interpolation);
    }
  }

  /**
   * 记录帧时间并更新 FPS
   */
  private recordFrameTime(frameTimeMs: number): void {
    // 循环记录帧时间
    const index = this.frameCount % this.options.statsWindow;
    this.frameTimes[index] = frameTimeMs;

    // 定期更新 FPS
    if (this.currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.updateFPS();
      this.lastFpsUpdate = this.currentTime;
    }
  }

  /**
   * 更新 FPS 统计
   */
  private updateFPS(): void {
    const validFrames = Math.min(this.frameCount, this.options.statsWindow);
    if (validFrames === 0) {
      this.currentFPS = 0;
      return;
    }

    // 计算平均帧时间
    let sum = 0;
    for (let i = 0; i < validFrames; i++) {
      sum += this.frameTimes[i];
    }
    const avgFrameTime = sum / validFrames;

    // 计算 FPS
    this.currentFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): RenderLoopStats {
    const validFrames = Math.min(this.frameCount, this.options.statsWindow);

    let sum = 0;
    let min = Infinity;
    let max = 0;

    for (let i = 0; i < validFrames; i++) {
      const ft = this.frameTimes[i];
      sum += ft;
      if (ft < min) min = ft;
      if (ft > max) max = ft;
    }

    const avgFrameTime = validFrames > 0 ? sum / validFrames : 0;

    return {
      fps: this.currentFPS,
      frameTime: avgFrameTime,
      minFrameTime: min === Infinity ? 0 : min,
      maxFrameTime: max,
      frameCount: this.frameCount,
      totalTime: this.currentTime - this.startTime,
      isRunning: this.isRunning,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.frameCount = 0;
    this.frameTimes.fill(0);
    this.currentFPS = 0;
    this.startTime = performance.now() / 1000;
    this.lastFpsUpdate = this.startTime;
  }

  /**
   * 设置目标 FPS
   */
  setTargetFPS(fps: number): void {
    this.options.targetFPS = Math.max(0, fps);
  }

  /**
   * 获取目标 FPS
   */
  getTargetFPS(): number {
    return this.options.targetFPS;
  }

  /**
   * 是否正在运行
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取总运行时间（秒）
   */
  getTotalTime(): number {
    return this.currentTime - this.startTime;
  }

  /**
   * 获取帧数
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * 更新回调
   */
  setCallbacks(callbacks: RenderLoopCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stop();
    this.frameTimes = [];
  }
}
