/**
 * RenderNode.ts
 *
 * Render node for scene graph objects:
 * - Transform management (position, rotation, scale)
 * - Hierarchy support (parent-child relationships)
 * - Visibility and opacity
 * - Bounding box calculation
 * - Resource binding (textures, geometry)
 */

import { Mat4, Vec3 } from "../utils/math-oop";
import type { RenderNodeData, Transform, BoundingBox } from "../../types/scene";
import type { Texture } from "../texture/Texture";
import type { QuadGeometry } from "../geometry/QuadGeometry";
import { EffectManager } from "../effects/EffectManager";

/**
 * Blend mode enumeration
 */
export enum BlendMode {
  NORMAL = "normal",
  ADD = "add",
  MULTIPLY = "multiply",
  SCREEN = "screen",
  OVERLAY = "overlay",
}

/**
 * Node type enumeration
 */
export enum NodeType {
  VIDEO = "video",
  IMAGE = "image",
  TEXT = "text",
  SHAPE = "shape",
}

/**
 * Anchor point preset
 */
export enum AnchorPreset {
  TOP_LEFT = "topLeft",
  TOP_CENTER = "topCenter",
  TOP_RIGHT = "topRight",
  CENTER_LEFT = "centerLeft",
  CENTER = "center",
  CENTER_RIGHT = "centerRight",
  BOTTOM_LEFT = "bottomLeft",
  BOTTOM_CENTER = "bottomCenter",
  BOTTOM_RIGHT = "bottomRight",
}

/**
 * Render node configuration
 */
export interface RenderNodeConfig {
  id?: string;
  type?: NodeType;
  visible?: boolean;
  position?: { x: number; y: number; z?: number };
  rotation?: number; // degrees
  scale?: { x: number; y: number };
  opacity?: number;
  blendMode?: BlendMode;
  anchor?: { x: number; y: number };
}

/**
 * RenderNode class representing a drawable object in the scene
 */
export class RenderNode {
  // Identification
  private id: string;
  private type: NodeType;

  // Hierarchy
  private parent: RenderNode | null = null;
  private children: RenderNode[] = [];

  // Visibility
  private visible: boolean = true;
  private opacity: number = 1.0;
  private blendMode: BlendMode = BlendMode.NORMAL;

  // Transform
  private position: Vec3;
  private rotation: number = 0; // Z-axis rotation in degrees
  private scale: Vec3;
  private anchor: { x: number; y: number } = { x: 0.5, y: 0.5 };

  // Matrices
  private localMatrix: Mat4;
  private worldMatrix: Mat4;
  private isDirty: boolean = true;

  // Resources
  private texture: Texture | null = null;
  private geometry: QuadGeometry | null = null;
  private textureId: string = "";
  private geometryId: string = "";

  // Shader
  private shaderName: string = "";
  private customUniforms: Record<string, any> = {};

  // Timing (for video/animation)
  private startTime: number = 0;
  private duration: number = 0;
  private trimStart: number = 0;
  private trimEnd: number = 0;

  // Size
  private width: number = 0;
  private height: number = 0;

  // Resource source
  private resourceSrc: string = "";

  // Effects
  private effectManager: EffectManager;

  /**
   * Create a new RenderNode
   */
  constructor(config: RenderNodeConfig = {}) {
    this.id = config.id ?? this.generateId();
    this.type = config.type ?? NodeType.IMAGE;
    this.visible = config.visible ?? true;
    this.opacity = config.opacity ?? 1.0;
    this.blendMode = config.blendMode ?? BlendMode.NORMAL;

    // Initialize transform
    this.position = new Vec3(
      config.position?.x ?? 0,
      config.position?.y ?? 0,
      config.position?.z ?? 0,
    );
    this.rotation = config.rotation ?? 0;
    this.scale = new Vec3(config.scale?.x ?? 1, config.scale?.y ?? 1, 1);

    if (config.anchor) {
      this.anchor = { ...config.anchor };
    }

    // Initialize matrices
    this.localMatrix = Mat4.identity();
    this.worldMatrix = Mat4.identity();

    // Initialize effect manager
    this.effectManager = new EffectManager();

    this.updateLocalMatrix();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get node ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get node type
   */
  getType(): NodeType {
    return this.type;
  }

  /**
   * Set node type
   */
  setType(type: NodeType): void {
    this.type = type;
  }

  // ========== Hierarchy ==========

  /**
   * Add child node
   */
  addChild(child: RenderNode): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    this.children.push(child);
    child.parent = this;
    child.markDirty();
  }

  /**
   * Remove child node
   */
  removeChild(child: RenderNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      child.markDirty();
    }
  }

  /**
   * Remove this node from parent
   */
  removeFromParent(): void {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  /**
   * Get parent node
   */
  getParent(): RenderNode | null {
    return this.parent;
  }

  /**
   * Get children
   */
  getChildren(): RenderNode[] {
    return [...this.children];
  }

  /**
   * Get all descendants (recursive)
   */
  getDescendants(): RenderNode[] {
    const descendants: RenderNode[] = [];
    const traverse = (node: RenderNode) => {
      for (const child of node.children) {
        descendants.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return descendants;
  }

  // ========== Visibility ==========

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Get visibility
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Check if node is visible in hierarchy
   */
  isVisibleInHierarchy(): boolean {
    if (!this.visible) return false;
    let node: RenderNode | null = this.parent;
    while (node) {
      if (!node.visible) return false;
      node = node.parent;
    }
    return true;
  }

  /**
   * Set opacity
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Get opacity
   */
  getOpacity(): number {
    return this.opacity;
  }

  /**
   * Get world opacity (including parents)
   */
  getWorldOpacity(): number {
    let opacity = this.opacity;
    let node: RenderNode | null = this.parent;
    while (node) {
      opacity *= node.opacity;
      node = node.parent;
    }
    return opacity;
  }

  /**
   * Set blend mode
   */
  setBlendMode(mode: BlendMode): void {
    this.blendMode = mode;
  }

  /**
   * Get blend mode
   */
  getBlendMode(): BlendMode {
    return this.blendMode;
  }

  // ========== Transform ==========

  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number = 0): void {
    this.position.set(x, y, z);
    this.markDirty();
  }

  /**
   * Get position
   */
  getPosition(): Vec3 {
    return this.position.clone();
  }

  /**
   * Translate (add to position)
   */
  translate(dx: number, dy: number, dz: number = 0): void {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
    this.markDirty();
  }

  /**
   * Set rotation (in degrees)
   */
  setRotation(degrees: number): void {
    this.rotation = degrees;
    this.markDirty();
  }

  /**
   * Get rotation (in degrees)
   */
  getRotation(): number {
    return this.rotation;
  }

  /**
   * Rotate (add to rotation)
   */
  rotate(degrees: number): void {
    this.rotation += degrees;
    this.markDirty();
  }

  /**
   * Set scale
   */
  setScale(x: number, y: number): void {
    this.scale.set(x, y, 1);
    this.markDirty();
  }

  /**
   * Get scale
   */
  getScale(): { x: number; y: number } {
    return { x: this.scale.x, y: this.scale.y };
  }

  /**
   * Set uniform scale
   */
  setUniformScale(scale: number): void {
    this.setScale(scale, scale);
  }

  /**
   * Set anchor point (0-1 range, where 0.5,0.5 is center)
   */
  setAnchor(x: number, y: number): void {
    this.anchor = { x, y };
    this.markDirty();
  }

  /**
   * Set anchor from preset
   */
  setAnchorPreset(preset: AnchorPreset): void {
    const anchors: Record<AnchorPreset, { x: number; y: number }> = {
      [AnchorPreset.TOP_LEFT]: { x: 0, y: 0 },
      [AnchorPreset.TOP_CENTER]: { x: 0.5, y: 0 },
      [AnchorPreset.TOP_RIGHT]: { x: 1, y: 0 },
      [AnchorPreset.CENTER_LEFT]: { x: 0, y: 0.5 },
      [AnchorPreset.CENTER]: { x: 0.5, y: 0.5 },
      [AnchorPreset.CENTER_RIGHT]: { x: 1, y: 0.5 },
      [AnchorPreset.BOTTOM_LEFT]: { x: 0, y: 1 },
      [AnchorPreset.BOTTOM_CENTER]: { x: 0.5, y: 1 },
      [AnchorPreset.BOTTOM_RIGHT]: { x: 1, y: 1 },
    };
    this.anchor = anchors[preset];
    this.markDirty();
  }

  /**
   * Get anchor point
   */
  getAnchor(): { x: number; y: number } {
    return { ...this.anchor };
  }

  /**
   * Get transform as object
   */
  getTransform(): Transform {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: { z: this.rotation },
      scale: { x: this.scale.x, y: this.scale.y },
    };
  }

  /**
   * Set transform from object
   */
  setTransform(transform: Partial<Transform>): void {
    if (transform.position) {
      this.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z ?? 0,
      );
    }
    if (transform.rotation) {
      this.rotation = transform.rotation.z;
    }
    if (transform.scale) {
      this.scale.set(transform.scale.x, transform.scale.y, 1);
    }
    this.markDirty();
  }

  /**
   * Mark matrices as dirty
   */
  private markDirty(): void {
    this.isDirty = true;
    // Mark all children as dirty too
    for (const child of this.children) {
      child.markDirty();
    }
  }

  /**
   * Update local transformation matrix
   */
  private updateLocalMatrix(): void {
    // Start with identity
    this.localMatrix = Mat4.identity();

    // Apply anchor offset (translate to anchor point)
    const anchorOffsetX = -this.width * (this.anchor.x - 0.5);
    const anchorOffsetY = -this.height * (this.anchor.y - 0.5);

    // Build transformation matrix: T * R * S * AnchorOffset
    this.localMatrix = Mat4.multiply(
      Mat4.translation(this.position.x, this.position.y, this.position.z),
      Mat4.multiply(
        Mat4.rotationZ(this.rotation),
        Mat4.multiply(
          Mat4.scaling(this.scale.x, this.scale.y, 1),
          Mat4.translation(anchorOffsetX, anchorOffsetY, 0),
        ),
      ),
    );
  }

  /**
   * Update world transformation matrix
   */
  updateWorldMatrix(parentWorldMatrix?: Mat4): void {
    if (this.isDirty) {
      this.updateLocalMatrix();
    }

    if (parentWorldMatrix) {
      this.worldMatrix = Mat4.multiply(parentWorldMatrix, this.localMatrix);
    } else {
      this.worldMatrix = this.localMatrix.clone();
    }

    this.isDirty = false;

    // Update children
    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }

  /**
   * Get local matrix
   */
  getLocalMatrix(): Mat4 {
    if (this.isDirty) {
      this.updateLocalMatrix();
    }
    return this.localMatrix.clone();
  }

  /**
   * Get world matrix
   */
  getWorldMatrix(): Mat4 {
    return this.worldMatrix.clone();
  }

  // ========== Resources ==========

  /**
   * Set texture
   */
  setTexture(texture: Texture | null): void {
    this.texture = texture;
    if (texture && this.width === 0 && this.height === 0) {
      // Auto-size from texture
      this.width = texture.width;
      this.height = texture.height;
      this.markDirty();
    }
  }

  /**
   * Get texture
   */
  getTexture(): Texture | null {
    return this.texture;
  }

  /**
   * Set geometry
   */
  setGeometry(geometry: QuadGeometry | null): void {
    this.geometry = geometry;
  }

  /**
   * Get geometry
   */
  getGeometry(): QuadGeometry | null {
    return this.geometry;
  }

  /**
   * Set resource source
   */
  setResourceSrc(src: string): void {
    this.resourceSrc = src;
  }

  /**
   * Get resource source
   */
  getResourceSrc(): string {
    return this.resourceSrc;
  }

  /**
   * Get texture ID
   */
  getTextureId(): string {
    return this.textureId;
  }

  /**
   * Set texture ID
   */
  setTextureId(id: string): void {
    this.textureId = id;
  }

  /**
   * Get geometry ID
   */
  getGeometryId(): string {
    return this.geometryId;
  }

  /**
   * Set geometry ID
   */
  setGeometryId(id: string): void {
    this.geometryId = id;
  }

  /**
   * Get shader name
   */
  getShaderName(): string {
    return this.shaderName;
  }

  /**
   * Set shader name
   */
  setShaderName(name: string): void {
    this.shaderName = name;
  }

  /**
   * Get custom uniforms
   */
  getCustomUniforms(): Record<string, any> {
    return { ...this.customUniforms };
  }

  /**
   * Set custom uniforms
   */
  setCustomUniforms(uniforms: Record<string, any>): void {
    this.customUniforms = { ...uniforms };
  }

  /**
   * Set a single custom uniform
   */
  setCustomUniform(name: string, value: any): void {
    this.customUniforms[name] = value;
  }

  /**
   * Get the effect manager
   */
  getEffectManager(): EffectManager {
    return this.effectManager;
  }

  /**
   * Apply all effects to this node's uniforms
   * This merges effect uniforms with existing custom uniforms
   */
  applyEffects(): void {
    const effectUniforms = this.effectManager.getAllUniforms();
    this.customUniforms = { ...this.customUniforms, ...effectUniforms };

    // Update shader if effects require a custom shader
    const requiredShader = this.effectManager.getRequiredShader();
    if (requiredShader) {
      this.shaderName = requiredShader;
    }
  }

  // ========== Size ==========

  /**
   * Set size
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.markDirty();
  }

  /**
   * Get size
   */
  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get bounding box in local space
   */
  getLocalBoundingBox(): BoundingBox {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    return {
      minX: -halfWidth,
      minY: -halfHeight,
      maxX: halfWidth,
      maxY: halfHeight,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Get bounding box in world space
   */
  getWorldBoundingBox(): BoundingBox {
    const corners = [
      new Vec3(-this.width / 2, -this.height / 2, 0),
      new Vec3(this.width / 2, -this.height / 2, 0),
      new Vec3(this.width / 2, this.height / 2, 0),
      new Vec3(-this.width / 2, this.height / 2, 0),
    ];

    // Transform corners to world space
    const transformedCorners = corners.map((corner) => {
      const point = new Float32Array([corner.x, corner.y, corner.z, 1.0]);
      const transformed = this.worldMatrix.multiplyVec4(point);
      return new Vec3(transformed[0], transformed[1], transformed[2]);
    });

    // Find min/max
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const corner of transformedCorners) {
      minX = Math.min(minX, corner.x);
      minY = Math.min(minY, corner.y);
      maxX = Math.max(maxX, corner.x);
      maxY = Math.max(maxY, corner.y);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // ========== Timing ==========

  /**
   * Set timing information
   */
  setTiming(startTime: number, duration: number): void {
    this.startTime = startTime;
    this.duration = duration;
  }

  /**
   * Set trim (for video clips)
   */
  setTrim(trimStart: number, trimEnd: number): void {
    this.trimStart = trimStart;
    this.trimEnd = trimEnd;
  }

  /**
   * Check if node is active at given time
   */
  isActiveAt(time: number): boolean {
    return time >= this.startTime && time < this.startTime + this.duration;
  }

  /**
   * Get local time (within the clip)
   */
  getLocalTime(globalTime: number): number {
    return globalTime - this.startTime + this.trimStart;
  }

  // ========== Serialization ==========

  /**
   * Convert to RenderNodeData
   */
  toData(): RenderNodeData {
    return {
      clipId: this.id,
      type: this.type,
      startTime: this.startTime,
      duration: this.duration,
      trimStart: this.trimStart,
      trimEnd: this.trimEnd,
      position: {
        x: this.position.x,
        y: this.position.y,
      },
      scale: this.scale.x, // Assuming uniform scale for compatibility
      rotation: this.rotation,
      opacity: this.opacity,
      resourceSrc: this.resourceSrc,
      anchor: { ...this.anchor },
      size: {
        width: this.width,
        height: this.height,
      },
      blendMode: this.blendMode,
    };
  }

  /**
   * Create from RenderNodeData
   */
  static fromData(data: RenderNodeData): RenderNode {
    const node = new RenderNode({
      id: data.clipId,
      type: data.type as NodeType,
      visible: true,
      position: { x: data.position.x, y: data.position.y, z: 0 },
      rotation: data.rotation,
      scale: { x: data.scale, y: data.scale },
      opacity: data.opacity,
      blendMode: (data.blendMode as BlendMode) ?? BlendMode.NORMAL,
      anchor: data.anchor,
    });

    node.setResourceSrc(data.resourceSrc);
    node.setTiming(data.startTime, data.duration);
    node.setTrim(data.trimStart, data.trimEnd);

    if (data.size) {
      node.setSize(data.size.width, data.size.height);
    }

    return node;
  }

  /**
   * Clone this node (without children)
   */
  clone(): RenderNode {
    const node = new RenderNode({
      type: this.type,
      visible: this.visible,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      rotation: this.rotation,
      scale: { x: this.scale.x, y: this.scale.y },
      opacity: this.opacity,
      blendMode: this.blendMode,
      anchor: { ...this.anchor },
    });

    node.setSize(this.width, this.height);
    node.setResourceSrc(this.resourceSrc);
    node.setTiming(this.startTime, this.duration);
    node.setTrim(this.trimStart, this.trimEnd);
    node.setTextureId(this.textureId);
    node.setGeometryId(this.geometryId);
    node.setShaderName(this.shaderName);
    node.setCustomUniforms(this.customUniforms);

    // Clone effect manager
    node.effectManager = this.effectManager.clone();

    return node;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Remove from parent
    this.removeFromParent();

    // Dispose children
    for (const child of [...this.children]) {
      child.dispose();
    }

    // Clear references
    this.texture = null;
    this.geometry = null;
    this.children = [];
  }
}
