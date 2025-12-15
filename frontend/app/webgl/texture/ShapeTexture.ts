/**
 * ShapeTexture.ts
 *
 * Texture class for rendering geometric shapes using canvas as a texture source
 * Supports rectangles, circles, polygons, and custom paths
 */

import { Texture, type TextureConfig } from "./Texture";
import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Shape type enumeration
 */
export enum ShapeType {
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  ELLIPSE = "ellipse",
  POLYGON = "polygon",
  ROUNDED_RECTANGLE = "rounded_rectangle",
  STAR = "star",
  TRIANGLE = "triangle",
}

/**
 * Shape rendering configuration
 */
export interface ShapeRenderConfig {
  type: ShapeType;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number; // For rounded rectangles
  sides?: number; // For polygons and stars
  innerRadius?: number; // For stars
  rotation?: number; // Shape rotation in degrees
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  // For custom polygon points (normalized 0-1)
  points?: Array<{ x: number; y: number }>;
}

/**
 * Default shape rendering configuration
 */
const DEFAULT_SHAPE_CONFIG: Partial<ShapeRenderConfig> = {
  fillColor: "#ffffff",
  strokeColor: "transparent",
  strokeWidth: 0,
  cornerRadius: 0,
  sides: 6,
  innerRadius: 0.5,
  rotation: 0,
  shadowColor: "transparent",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

/**
 * ShapeTexture class for geometric shape rendering
 */
export class ShapeTexture extends Texture {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private shapeConfig: Required<
    Omit<ShapeRenderConfig, "cornerRadius" | "sides" | "innerRadius" | "points">
  > & {
    cornerRadius?: number;
    sides?: number;
    innerRadius?: number;
    points?: Array<{ x: number; y: number }>;
  };
  private needsRedraw = false;

  constructor(
    contextWrapper: WebGLContextManager,
    shapeConfig: ShapeRenderConfig,
    textureConfig: TextureConfig = {},
  ) {
    super(contextWrapper, textureConfig);

    // Create canvas for shape rendering
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("ShapeTexture: Failed to create canvas context");
    }
    this.ctx = ctx;

    // Initialize shape configuration
    this.shapeConfig = {
      ...DEFAULT_SHAPE_CONFIG,
      ...shapeConfig,
    } as typeof this.shapeConfig;

    // Set canvas size
    this.canvas.width = shapeConfig.width;
    this.canvas.height = shapeConfig.height;
    this._width = shapeConfig.width;
    this._height = shapeConfig.height;

    // Create texture and render initial shape
    this.createTexture();
    this.renderShape();
  }

  /**
   * Update shape configuration
   */
  setShapeConfig(config: Partial<ShapeRenderConfig>): void {
    const oldWidth = this.shapeConfig.width;
    const oldHeight = this.shapeConfig.height;

    this.shapeConfig = {
      ...this.shapeConfig,
      ...config,
    };

    // Resize canvas if dimensions changed
    if (
      this.shapeConfig.width !== oldWidth ||
      this.shapeConfig.height !== oldHeight
    ) {
      this.canvas.width = this.shapeConfig.width;
      this.canvas.height = this.shapeConfig.height;
      this._width = this.shapeConfig.width;
      this._height = this.shapeConfig.height;
    }

    this.needsRedraw = true;
    this._needsUpdate = true;
  }

  /**
   * Get current shape configuration
   */
  getShapeConfig(): Readonly<ShapeRenderConfig> {
    return this.shapeConfig;
  }

  /**
   * Render shape to canvas
   */
  private renderShape(): void {
    const config = this.shapeConfig;
    const ctx = this.ctx;
    const width = config.width;
    const height = config.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Apply rotation if specified
    if (config.rotation !== 0) {
      ctx.translate(width / 2, height / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.translate(-width / 2, -height / 2);
    }

    // Configure shadows
    if (config.shadowColor !== "transparent" && config.shadowBlur > 0) {
      ctx.shadowColor = config.shadowColor;
      ctx.shadowBlur = config.shadowBlur;
      ctx.shadowOffsetX = config.shadowOffsetX;
      ctx.shadowOffsetY = config.shadowOffsetY;
    }

    // Begin path
    ctx.beginPath();

    // Draw shape based on type
    switch (config.type) {
      case ShapeType.RECTANGLE:
        this.drawRectangle(ctx, width, height);
        break;
      case ShapeType.ROUNDED_RECTANGLE:
        this.drawRoundedRectangle(
          ctx,
          width,
          height,
          config.cornerRadius ?? 0,
        );
        break;
      case ShapeType.CIRCLE:
        this.drawCircle(ctx, width, height);
        break;
      case ShapeType.ELLIPSE:
        this.drawEllipse(ctx, width, height);
        break;
      case ShapeType.TRIANGLE:
        this.drawPolygon(ctx, width, height, 3);
        break;
      case ShapeType.POLYGON:
        this.drawPolygon(ctx, width, height, config.sides ?? 6);
        break;
      case ShapeType.STAR:
        this.drawStar(
          ctx,
          width,
          height,
          config.sides ?? 5,
          config.innerRadius ?? 0.5,
        );
        break;
      default:
        console.warn(`ShapeTexture: Unknown shape type ${config.type}`);
        this.drawRectangle(ctx, width, height);
    }

    // Fill shape
    if (config.fillColor !== "transparent") {
      ctx.fillStyle = config.fillColor;
      ctx.fill();
    }

    // Stroke shape
    if (config.strokeColor !== "transparent" && config.strokeWidth > 0) {
      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = config.strokeWidth;
      ctx.stroke();
    }

    // Restore context state
    ctx.restore();

    this.needsRedraw = false;
    this._isReady = true;
  }

  /**
   * Draw rectangle
   */
  private drawRectangle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    ctx.rect(0, 0, width, height);
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRectangle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    radius: number,
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.arcTo(width, 0, width, r, r);
    ctx.lineTo(width, height - r);
    ctx.arcTo(width, height, width - r, height, r);
    ctx.lineTo(r, height);
    ctx.arcTo(0, height, 0, height - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
  }

  /**
   * Draw circle
   */
  private drawCircle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  }

  /**
   * Draw ellipse
   */
  private drawEllipse(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  }

  /**
   * Draw regular polygon
   */
  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sides: number,
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2;
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2; // Start from top

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
  }

  /**
   * Draw star
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: number,
    innerRadius: number,
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRad = outerRadius * innerRadius;
    const angleStep = Math.PI / points;
    const startAngle = -Math.PI / 2; // Start from top

    for (let i = 0; i < points * 2; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRad;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
  }

  /**
   * Draw custom polygon from points
   */
  private drawCustomPolygon(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    points: Array<{ x: number; y: number }>,
  ): void {
    if (points.length < 3) {
      console.warn("ShapeTexture: Custom polygon needs at least 3 points");
      return;
    }

    points.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
  }

  /**
   * Update texture with current canvas content
   */
  update(): void {
    if (this.needsRedraw) {
      this.renderShape();
    }

    if (!this._needsUpdate || !this._isReady) {
      return;
    }

    this.bind();

    // Set pixel store parameters
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.config.flipY);
    this.gl.pixelStorei(
      this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      this.config.premultiplyAlpha,
    );

    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    try {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        format,
        format,
        type,
        this.canvas,
      );
    } catch (error) {
      console.error("ShapeTexture: Failed to update texture:", error);
    }

    this.applyParameters();
    this.unbind();

    this._needsUpdate = false;
  }

  /**
   * Get the underlying canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Dispose of texture resources
   */
  dispose(): void {
    super.dispose();
    // Canvas will be garbage collected
  }
}
