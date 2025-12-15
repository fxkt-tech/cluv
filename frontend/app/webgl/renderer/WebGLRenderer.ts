/**
 * WebGLRenderer.ts
 *
 * WebGL 渲染器核心
 * - 场景渲染管理
 * - 相机集成
 * - 资源管理器集成
 * - 批量渲染优化
 * - 渲染状态管理
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import type { SceneManager } from "../scene/SceneManager";
import type { Camera } from "../scene/Camera";
import type { RenderNode } from "../scene/RenderNode";
import type { ShaderManager } from "../shader/ShaderManager";
import type { TextureManager } from "../texture/TextureManager";
import type { GeometryManager } from "../geometry/GeometryManager";
import { RenderState } from "./RenderState";
import type { ShaderProgram } from "../shader/ShaderProgram";
import { Mat4 } from "../utils/math-oop";
import { BlendMode } from "../scene/RenderNode";

/**
 * 渲染器配置
 */
export interface WebGLRendererOptions {
  /**
   * 清除颜色
   * @default [0, 0, 0, 1]
   */
  clearColor?: [number, number, number, number];

  /**
   * 是否启用深度测试
   * @default false
   */
  enableDepthTest?: boolean;

  /**
   * 是否启用面剔除
   * @default false
   */
  enableCullFace?: boolean;

  /**
   * 是否自动清除画布
   * @default true
   */
  autoClear?: boolean;

  /**
   * 是否自动更新视频纹理
   * @default true
   */
  autoUpdateTextures?: boolean;

  /**
   * 是否启用批量渲染优化
   * @default true
   */
  enableBatching?: boolean;

  /**
   * 是否启用视锥剔除
   * @default true
   */
  enableFrustumCulling?: boolean;
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  /** 绘制调用次数 */
  drawCalls: number;
  /** 渲染的节点数 */
  nodesRendered: number;
  /** 剔除的节点数 */
  nodesCulled: number;
  /** 三角形数 */
  triangles: number;
  /** 使用的纹理数 */
  textures: number;
  /** 使用的着色器程序数 */
  shaderPrograms: number;
  /** 渲染时间（毫秒） */
  renderTime: number;
}

/**
 * 渲染批次
 */
interface RenderBatch {
  shader: ShaderProgram;
  nodes: RenderNode[];
}

/**
 * WebGL 渲染器
 */
export class WebGLRenderer {
  private contextWrapper: WebGLContextManager;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private renderState: RenderState;

  // 资源管理器
  private shaderManager: ShaderManager;
  private textureManager: TextureManager;
  private geometryManager: GeometryManager;

  // 配置
  private options: Required<WebGLRendererOptions>;

  // 统计信息
  private stats: RenderStats = {
    drawCalls: 0,
    nodesRendered: 0,
    nodesCulled: 0,
    triangles: 0,
    textures: 0,
    shaderPrograms: 0,
    renderTime: 0,
  };

  // 临时矩阵（避免每帧分配）
  private tempModelMatrix = new Mat4();
  private tempViewMatrix = new Mat4();
  private tempProjectionMatrix = new Mat4();
  private tempViewProjectionMatrix = new Mat4();

  // 渲染批次
  private batches: Map<string, RenderBatch> = new Map();

  constructor(
    contextWrapper: WebGLContextManager,
    shaderManager: ShaderManager,
    textureManager: TextureManager,
    geometryManager: GeometryManager,
    options: WebGLRendererOptions = {},
  ) {
    this.contextWrapper = contextWrapper;
    const gl = contextWrapper.getContext();
    if (!gl) {
      throw new Error("WebGLRenderer: Failed to get WebGL context");
    }
    this.gl = gl;
    this.shaderManager = shaderManager;
    this.textureManager = textureManager;
    this.geometryManager = geometryManager;

    // 初始化渲染状态管理器
    this.renderState = new RenderState(contextWrapper);

    // 应用配置
    this.options = {
      clearColor: options.clearColor ?? [0, 0, 0, 1],
      enableDepthTest: options.enableDepthTest ?? false,
      enableCullFace: options.enableCullFace ?? false,
      autoClear: options.autoClear ?? true,
      autoUpdateTextures: options.autoUpdateTextures ?? true,
      enableBatching: options.enableBatching ?? true,
      enableFrustumCulling: options.enableFrustumCulling ?? true,
    };

    // 初始化渲染状态
    this.initializeRenderState();
  }

  /**
   * 初始化渲染状态
   */
  private initializeRenderState(): void {
    const [r, g, b, a] = this.options.clearColor;
    this.renderState.setClearColor(r, g, b, a);

    // 深度测试
    if (this.options.enableDepthTest) {
      this.renderState.setDepth({
        enabled: true,
        func: this.gl.LESS,
        writable: true,
      });
    }

    // 面剔除
    if (this.options.enableCullFace) {
      this.renderState.setCullFace({
        enabled: true,
        mode: this.gl.BACK,
      });
    }

    // 默认启用混合
    this.renderState.setBlendMode(BlendMode.NORMAL);
  }

  /**
   * 渲染场景
   */
  render(
    sceneManager: SceneManager,
    camera: Camera,
    currentTime: number,
  ): void {
    const startTime = performance.now();

    // 重置统计
    this.resetStats();

    // 更新纹理（如果启用）
    if (this.options.autoUpdateTextures) {
      this.textureManager.updateVideoTextures();
    }

    // 设置视口
    const viewport = camera.getViewport();
    this.renderState.setViewport(
      viewport.x,
      viewport.y,
      viewport.width,
      viewport.height,
    );

    // 清除画布
    if (this.options.autoClear) {
      this.clear();
    }

    // 获取相机矩阵
    this.tempViewMatrix.copy(camera.getViewMatrix());
    this.tempProjectionMatrix.copy(camera.getProjectionMatrix());
    this.tempViewProjectionMatrix.copy(camera.getViewProjectionMatrix());

    // 获取可见节点
    const visibleNodes = sceneManager.getVisibleNodesAtTime(currentTime);

    // 视锥剔除（如果启用）
    let nodesToRender = visibleNodes;
    if (this.options.enableFrustumCulling) {
      nodesToRender = this.performFrustumCulling(visibleNodes, camera);
    }

    // 批量渲染或逐个渲染
    if (this.options.enableBatching) {
      this.renderBatched(nodesToRender, camera, currentTime);
    } else {
      this.renderNodes(nodesToRender, camera, currentTime);
    }

    // 更新渲染时间统计
    this.stats.renderTime = performance.now() - startTime;
  }

  /**
   * 清除画布
   */
  clear(color = true, depth = true, stencil = false): void {
    const gl = this.gl;
    let mask = 0;

    if (color) mask |= gl.COLOR_BUFFER_BIT;
    if (depth) mask |= gl.DEPTH_BUFFER_BIT;
    if (stencil) mask |= gl.STENCIL_BUFFER_BIT;

    if (mask !== 0) {
      gl.clear(mask);
    }
  }

  /**
   * 视锥剔除
   */
  private performFrustumCulling(
    nodes: RenderNode[],
    camera: Camera,
  ): RenderNode[] {
    // TODO: 实现真正的视锥剔除
    // 目前简单返回所有节点
    // 未来可以使用节点的包围盒和相机的视锥体进行相交测试
    this.stats.nodesCulled = 0;
    return nodes;
  }

  /**
   * 批量渲染节点
   */
  private renderBatched(
    nodes: RenderNode[],
    camera: Camera,
    currentTime: number,
  ): void {
    // 清空批次
    this.batches.clear();

    // 按着色器分组
    for (const node of nodes) {
      const shaderName = node.getShaderName() || "base";
      const shader = this.shaderManager.get(shaderName);

      if (!shader) {
        console.warn(
          `Shader "${shaderName}" not found for node ${node.getId()}`,
        );
        continue;
      }

      const batchKey = shaderName;
      let batch = this.batches.get(batchKey);

      if (!batch) {
        batch = { shader, nodes: [] };
        this.batches.set(batchKey, batch);
      }

      batch.nodes.push(node);
    }

    // 渲染每个批次
    for (const batch of this.batches.values()) {
      this.renderBatch(batch, camera, currentTime);
    }

    this.stats.shaderPrograms = this.batches.size;
  }

  /**
   * 渲染一个批次
   */
  private renderBatch(
    batch: RenderBatch,
    camera: Camera,
    currentTime: number,
  ): void {
    const { shader, nodes } = batch;

    // 使用着色器
    shader.use();

    // 设置通用 uniform（相机矩阵等）
    this.setCommonUniforms(shader, camera);

    // 渲染批次中的所有节点
    for (const node of nodes) {
      this.renderNode(node, shader, currentTime);
    }
  }

  /**
   * 逐个渲染节点（不批量）
   */
  private renderNodes(
    nodes: RenderNode[],
    camera: Camera,
    currentTime: number,
  ): void {
    const shaderSet = new Set<string>();

    for (const node of nodes) {
      const shaderName = node.getShaderName() || "base";
      const shader = this.shaderManager.get(shaderName);

      if (!shader) {
        console.warn(
          `Shader "${shaderName}" not found for node ${node.getId()}`,
        );
        continue;
      }

      shaderSet.add(shaderName);

      // 使用着色器
      shader.use();

      // 设置通用 uniform
      this.setCommonUniforms(shader, camera);

      // 渲染节点
      this.renderNode(node, shader, currentTime);
    }

    this.stats.shaderPrograms = shaderSet.size;
  }

  /**
   * 渲染单个节点
   */
  private renderNode(
    node: RenderNode,
    shader: ShaderProgram,
    currentTime: number,
  ): void {
    // 获取节点的世界变换矩阵
    this.tempModelMatrix.copy(node.getWorldMatrix());

    // 设置节点特定的 uniform
    shader.setUniforms({
      u_modelMatrix: this.tempModelMatrix.elements,
    });

    // 设置透明度
    const opacity = node.getWorldOpacity();
    if (shader.hasUniform("u_opacity")) {
      shader.setUniforms({ u_opacity: opacity });
    }

    // 设置混合模式
    const blendMode = node.getBlendMode();
    this.renderState.setBlendMode(blendMode);

    // 设置自定义 uniform
    const customUniforms = node.getCustomUniforms();
    if (customUniforms && Object.keys(customUniforms).length > 0) {
      shader.setUniforms(customUniforms);
    }

    // 绑定纹理
    const textureId = node.getTextureId();
    if (textureId) {
      const texture = this.textureManager.get(textureId);
      if (texture) {
        texture.bind(0);
        if (shader.hasUniform("u_texture")) {
          shader.setUniforms({ u_texture: 0 });
        }
        this.stats.textures++;
      }
    }

    // 绑定几何体并绘制
    const geometryId = node.getGeometryId();
    if (geometryId) {
      const geometry = this.geometryManager.get(geometryId);
      if (geometry) {
        const posLoc = shader.getAttributeLocation("a_position");
        const texLoc = shader.getAttributeLocation("a_texCoord");
        geometry.bindAttributes(posLoc, texLoc);
        geometry.draw();

        this.stats.drawCalls++;
        this.stats.nodesRendered++;
        this.stats.triangles += 2; // Quad = 2 triangles
      }
    } else {
      // 使用默认几何体（unit quad）
      const unitQuad = this.geometryManager.getUnitQuad();
      const posLoc = shader.getAttributeLocation("a_position");
      const texLoc = shader.getAttributeLocation("a_texCoord");
      unitQuad.bindAttributes(posLoc, texLoc);
      unitQuad.draw();

      this.stats.drawCalls++;
      this.stats.nodesRendered++;
      this.stats.triangles += 2;
    }
  }

  /**
   * 设置通用 uniform（相机相关）
   */
  private setCommonUniforms(shader: ShaderProgram, camera: Camera): void {
    const uniforms: Record<string, any> = {};

    if (shader.hasUniform("u_viewMatrix")) {
      uniforms.u_viewMatrix = this.tempViewMatrix.elements;
    }

    if (shader.hasUniform("u_projectionMatrix")) {
      uniforms.u_projectionMatrix = this.tempProjectionMatrix.elements;
    }

    if (shader.hasUniform("u_viewProjectionMatrix")) {
      uniforms.u_viewProjectionMatrix = this.tempViewProjectionMatrix.elements;
    }

    if (shader.hasUniform("u_cameraPosition")) {
      const camPos = camera.getPosition();
      uniforms.u_cameraPosition = [camPos.x, camPos.y, camPos.z];
    }

    if (Object.keys(uniforms).length > 0) {
      shader.setUniforms(uniforms);
    }
  }

  /**
   * 设置清除颜色
   */
  setClearColor(r: number, g: number, b: number, a: number): void {
    this.options.clearColor = [r, g, b, a];
    this.renderState.setClearColor(r, g, b, a);
  }

  /**
   * 启用/禁用深度测试
   */
  setDepthTest(enabled: boolean): void {
    this.options.enableDepthTest = enabled;
    this.renderState.setDepth({ enabled });
  }

  /**
   * 启用/禁用面剔除
   */
  setCullFace(enabled: boolean): void {
    this.options.enableCullFace = enabled;
    this.renderState.setCullFace({ enabled });
  }

  /**
   * 设置自动清除
   */
  setAutoClear(enabled: boolean): void {
    this.options.autoClear = enabled;
  }

  /**
   * 设置自动更新纹理
   */
  setAutoUpdateTextures(enabled: boolean): void {
    this.options.autoUpdateTextures = enabled;
  }

  /**
   * 启用/禁用批量渲染
   */
  setBatching(enabled: boolean): void {
    this.options.enableBatching = enabled;
  }

  /**
   * 启用/禁用视锥剔除
   */
  setFrustumCulling(enabled: boolean): void {
    this.options.enableFrustumCulling = enabled;
  }

  /**
   * 获取渲染统计信息
   */
  getStats(): Readonly<RenderStats> {
    return { ...this.stats };
  }

  /**
   * 获取渲染状态管理器
   */
  getRenderState(): RenderState {
    return this.renderState;
  }

  /**
   * 获取 WebGL 上下文包装器
   */
  getContextWrapper(): WebGLContextManager {
    return this.contextWrapper;
  }

  /**
   * 获取 WebGL 上下文
   */
  getContext(): WebGLRenderingContext | WebGL2RenderingContext {
    return this.gl;
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats.drawCalls = 0;
    this.stats.nodesRendered = 0;
    this.stats.nodesCulled = 0;
    this.stats.triangles = 0;
    this.stats.textures = 0;
    this.stats.shaderPrograms = 0;
    this.stats.renderTime = 0;
  }

  /**
   * 重置渲染器状态
   */
  reset(): void {
    this.renderState.reset();
    this.batches.clear();
    this.resetStats();
  }

  /**
   * 调整大小（当 canvas 尺寸改变时调用）
   */
  resize(width: number, height: number): void {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.batches.clear();
    this.renderState.dispose();
    this.resetStats();
  }
}
