/**
 * Camera.ts
 *
 * Camera system for 2D/3D projection and view management:
 * - Orthographic and perspective projection
 * - View matrix calculation
 * - Camera positioning and targeting
 * - Viewport management
 */

import { Mat4, Vec3 } from "../utils/math-oop";
import type { CameraConfig } from "../../types/scene";

/**
 * Camera projection type
 */
export enum ProjectionType {
  ORTHOGRAPHIC = "orthographic",
  PERSPECTIVE = "perspective",
}

/**
 * Viewport configuration
 */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Camera class for handling view and projection matrices
 */
export class Camera {
  // Camera position and orientation
  private position: Vec3;
  private target: Vec3;
  private up: Vec3;

  // Projection parameters
  private projectionType: ProjectionType;
  private fov: number; // Field of view in degrees (for perspective)
  private near: number;
  private far: number;
  private aspect: number;

  // Orthographic bounds
  private left: number = -1;
  private right: number = 1;
  private bottom: number = -1;
  private top: number = 1;

  // Matrices
  private viewMatrix: Mat4;
  private projectionMatrix: Mat4;
  private viewProjectionMatrix: Mat4;
  private isDirty: boolean = true;

  // Viewport
  private viewport: Viewport;

  /**
   * Creates a new Camera
   * @param config Camera configuration
   * @param viewport Viewport dimensions
   */
  constructor(config: Partial<CameraConfig> = {}, viewport?: Viewport) {
    // Initialize position and target
    this.position = new Vec3(
      config.position?.x ?? 0,
      config.position?.y ?? 0,
      config.position?.z ?? 10,
    );

    this.target = new Vec3(
      config.target?.x ?? 0,
      config.target?.y ?? 0,
      config.target?.z ?? 0,
    );

    this.up = new Vec3(0, 1, 0);

    // Initialize projection parameters
    this.projectionType = config.orthographic
      ? ProjectionType.ORTHOGRAPHIC
      : ProjectionType.PERSPECTIVE;
    this.fov = config.fov ?? 45;
    this.near = config.near ?? 0.1;
    this.far = config.far ?? 1000;

    // Initialize viewport
    this.viewport = viewport ?? { x: 0, y: 0, width: 800, height: 600 };
    this.aspect = this.viewport.width / this.viewport.height;

    // Initialize matrices
    this.viewMatrix = Mat4.identity();
    this.projectionMatrix = Mat4.identity();
    this.viewProjectionMatrix = Mat4.identity();

    this.updateMatrices();
  }

  /**
   * Set camera position
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.isDirty = true;
  }

  /**
   * Get camera position
   */
  getPosition(): Vec3 {
    return this.position.clone();
  }

  /**
   * Set camera target (look-at point)
   */
  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
    this.isDirty = true;
  }

  /**
   * Get camera target
   */
  getTarget(): Vec3 {
    return this.target.clone();
  }

  /**
   * Set up vector
   */
  setUp(x: number, y: number, z: number): void {
    this.up.set(x, y, z);
    this.isDirty = true;
  }

  /**
   * Move camera by offset
   */
  translate(dx: number, dy: number, dz: number): void {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
    this.isDirty = true;
  }

  /**
   * Set projection type
   */
  setProjectionType(type: ProjectionType): void {
    if (this.projectionType !== type) {
      this.projectionType = type;
      this.isDirty = true;
    }
  }

  /**
   * Get projection type
   */
  getProjectionType(): ProjectionType {
    return this.projectionType;
  }

  /**
   * Set field of view (for perspective projection)
   * @param fov Field of view in degrees
   */
  setFov(fov: number): void {
    this.fov = fov;
    this.isDirty = true;
  }

  /**
   * Get field of view
   */
  getFov(): number {
    return this.fov;
  }

  /**
   * Set near and far clipping planes
   */
  setClippingPlanes(near: number, far: number): void {
    this.near = near;
    this.far = far;
    this.isDirty = true;
  }

  /**
   * Set orthographic bounds
   */
  setOrthographicBounds(
    left: number,
    right: number,
    bottom: number,
    top: number,
  ): void {
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.isDirty = true;
  }

  /**
   * Set orthographic bounds from dimensions
   * Centers the camera on (0, 0) with given width and height
   */
  setOrthographicSize(width: number, height: number): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    this.setOrthographicBounds(-halfWidth, halfWidth, -halfHeight, halfHeight);
  }

  /**
   * Update viewport and aspect ratio
   */
  setViewport(viewport: Viewport): void;
  setViewport(x: number, y: number, width: number, height: number): void;
  setViewport(
    xOrViewport: number | Viewport,
    y?: number,
    width?: number,
    height?: number,
  ): void {
    if (typeof xOrViewport === "object") {
      this.viewport = xOrViewport;
    } else {
      this.viewport = {
        x: xOrViewport,
        y: y!,
        width: width!,
        height: height!,
      };
    }
    this.aspect = this.viewport.width / this.viewport.height;
    this.isDirty = true;
  }

  /**
   * Get viewport
   */
  getViewport(): Viewport {
    return { ...this.viewport };
  }

  /**
   * Get aspect ratio
   */
  getAspectRatio(): number {
    return this.aspect;
  }

  /**
   * Update all matrices if dirty
   */
  updateMatrices(): void {
    if (!this.isDirty) return;

    // Update view matrix (look-at)
    this.viewMatrix = Mat4.lookAt(this.position, this.target, this.up);

    // Update projection matrix
    if (this.projectionType === ProjectionType.PERSPECTIVE) {
      this.projectionMatrix = Mat4.perspective(
        this.fov,
        this.aspect,
        this.near,
        this.far,
      );
    } else {
      this.projectionMatrix = Mat4.orthographic(
        this.left,
        this.right,
        this.bottom,
        this.top,
        this.near,
        this.far,
      );
    }

    // Update combined matrix
    this.viewProjectionMatrix = Mat4.multiply(
      this.projectionMatrix,
      this.viewMatrix,
    );

    this.isDirty = false;
  }

  /**
   * Get view matrix
   */
  getViewMatrix(): Mat4 {
    this.updateMatrices();
    return this.viewMatrix.clone();
  }

  /**
   * Get projection matrix
   */
  getProjectionMatrix(): Mat4 {
    this.updateMatrices();
    return this.projectionMatrix.clone();
  }

  /**
   * Get combined view-projection matrix
   */
  getViewProjectionMatrix(): Mat4 {
    this.updateMatrices();
    return this.viewProjectionMatrix.clone();
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param screenX Screen X coordinate
   * @param screenY Screen Y coordinate
   * @param depth Depth value (0 = near plane, 1 = far plane)
   */
  screenToWorld(screenX: number, screenY: number, depth: number = 0): Vec3 {
    this.updateMatrices();

    // Convert screen to NDC (Normalized Device Coordinates)
    const ndcX = (screenX / this.viewport.width) * 2 - 1;
    const ndcY = 1 - (screenY / this.viewport.height) * 2; // Flip Y
    const ndcZ = depth * 2 - 1; // Map [0,1] to [-1,1]

    // Create NDC point
    const ndcPoint = new Float32Array([ndcX, ndcY, ndcZ, 1.0]);

    // Get inverse view-projection matrix
    const invViewProj = this.viewProjectionMatrix.inverse();

    // Transform NDC to world space
    const worldPoint = invViewProj.multiplyVec4(ndcPoint);

    // Perspective divide
    const w = worldPoint[3];
    return new Vec3(worldPoint[0] / w, worldPoint[1] / w, worldPoint[2] / w);
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number, worldZ: number): Vec3 {
    this.updateMatrices();

    // Transform world to clip space
    const worldPoint = new Float32Array([worldX, worldY, worldZ, 1.0]);
    const clipPoint = this.viewProjectionMatrix.multiplyVec4(worldPoint);

    // Perspective divide
    const w = clipPoint[3];
    const ndcX = clipPoint[0] / w;
    const ndcY = clipPoint[1] / w;
    const ndcZ = clipPoint[2] / w;

    // Convert NDC to screen coordinates
    const screenX = ((ndcX + 1) / 2) * this.viewport.width;
    const screenY = ((1 - ndcY) / 2) * this.viewport.height;
    const screenZ = (ndcZ + 1) / 2; // Map [-1,1] to [0,1]

    return new Vec3(screenX, screenY, screenZ);
  }

  /**
   * Zoom camera (for orthographic projection)
   * @param factor Zoom factor (> 1 = zoom in, < 1 = zoom out)
   */
  zoom(factor: number): void {
    if (this.projectionType === ProjectionType.ORTHOGRAPHIC) {
      const width = (this.right - this.left) / factor;
      const height = (this.top - this.bottom) / factor;
      this.setOrthographicSize(width, height);
    } else {
      // For perspective, move camera closer/farther
      const direction = Vec3.subtract(this.target, this.position).normalize();
      const distance = Vec3.distance(this.position, this.target);
      const newDistance = distance / factor;
      const offset = direction.scale(distance - newDistance);
      this.position = Vec3.add(this.position, offset);
      this.isDirty = true;
    }
  }

  /**
   * Pan camera in screen space
   */
  pan(deltaX: number, deltaY: number): void {
    // Calculate right and up vectors from view matrix
    const right = new Vec3(
      this.viewMatrix.elements[0],
      this.viewMatrix.elements[4],
      this.viewMatrix.elements[8],
    );
    const up = new Vec3(
      this.viewMatrix.elements[1],
      this.viewMatrix.elements[5],
      this.viewMatrix.elements[9],
    );

    // Calculate pan amount based on projection
    let panX: number, panY: number;
    if (this.projectionType === ProjectionType.ORTHOGRAPHIC) {
      const orthoWidth = this.right - this.left;
      const orthoHeight = this.top - this.bottom;
      panX = (deltaX / this.viewport.width) * orthoWidth;
      panY = (deltaY / this.viewport.height) * orthoHeight;
    } else {
      const distance = Vec3.distance(this.position, this.target);
      const tanFov = Math.tan((this.fov * Math.PI) / 360); // Half FOV in radians
      const worldHeight = 2 * distance * tanFov;
      const worldWidth = worldHeight * this.aspect;
      panX = (deltaX / this.viewport.width) * worldWidth;
      panY = (deltaY / this.viewport.height) * worldHeight;
    }

    // Apply pan to position and target
    const offset = Vec3.add(right.scale(panX), up.scale(panY));
    this.position = Vec3.add(this.position, offset);
    this.target = Vec3.add(this.target, offset);
    this.isDirty = true;
  }

  /**
   * Reset camera to default state
   */
  reset(): void {
    this.position.set(0, 0, 10);
    this.target.set(0, 0, 0);
    this.up.set(0, 1, 0);
    this.isDirty = true;
  }

  /**
   * Clone this camera
   */
  clone(): Camera {
    const config: CameraConfig = {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      target: {
        x: this.target.x,
        y: this.target.y,
        z: this.target.z,
      },
      fov: this.fov,
      near: this.near,
      far: this.far,
      orthographic: this.projectionType === ProjectionType.ORTHOGRAPHIC,
    };

    const camera = new Camera(config, { ...this.viewport });
    if (this.projectionType === ProjectionType.ORTHOGRAPHIC) {
      camera.setOrthographicBounds(
        this.left,
        this.right,
        this.bottom,
        this.top,
      );
    }
    return camera;
  }

  /**
   * Serialize camera to config
   */
  toConfig(): CameraConfig {
    return {
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      target: {
        x: this.target.x,
        y: this.target.y,
        z: this.target.z,
      },
      fov: this.fov,
      near: this.near,
      far: this.far,
      orthographic: this.projectionType === ProjectionType.ORTHOGRAPHIC,
    };
  }

  /**
   * Create camera from config
   */
  static fromConfig(config: CameraConfig, viewport?: Viewport): Camera {
    return new Camera(config, viewport);
  }

  /**
   * Create a 2D orthographic camera
   */
  static create2D(width: number, height: number): Camera {
    const camera = new Camera(
      {
        position: { x: 0, y: 0, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        orthographic: true,
        near: -100,
        far: 100,
      },
      { x: 0, y: 0, width, height },
    );
    camera.setOrthographicSize(width, height);
    return camera;
  }

  /**
   * Create a 3D perspective camera
   */
  static create3D(width: number, height: number, fov: number = 45): Camera {
    return new Camera(
      {
        position: { x: 0, y: 5, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        orthographic: false,
        fov,
        near: 0.1,
        far: 1000,
      },
      { x: 0, y: 0, width, height },
    );
  }
}
