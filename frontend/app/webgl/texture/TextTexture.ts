/**
 * TextTexture.ts
 *
 * Texture class for rendering text using canvas as a texture source
 * Supports multiple fonts, styles, colors, alignment, and text wrapping
 */

import { Texture, type TextureConfig } from "./Texture";
import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Text alignment options
 */
export enum TextAlign {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
}

/**
 * Text baseline options
 */
export enum TextBaseline {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
  ALPHABETIC = "alphabetic",
  HANGING = "hanging",
}

/**
 * Text rendering configuration
 */
export interface TextRenderConfig {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: TextAlign;
  textBaseline?: TextBaseline;
  lineHeight?: number;
  padding?: number;
  maxWidth?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/**
 * Default text rendering configuration
 */
const DEFAULT_TEXT_CONFIG: Required<Omit<TextRenderConfig, "text">> = {
  fontFamily: "Arial, sans-serif",
  fontSize: 32,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#ffffff",
  backgroundColor: "transparent",
  textAlign: TextAlign.LEFT,
  textBaseline: TextBaseline.TOP,
  lineHeight: 1.2,
  padding: 10,
  maxWidth: 0, // 0 means no wrapping
  strokeColor: "transparent",
  strokeWidth: 0,
  shadowColor: "transparent",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

/**
 * TextTexture class for text rendering
 */
export class TextTexture extends Texture {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textConfig: Required<TextRenderConfig>;
  private needsRedraw = false;

  constructor(
    contextWrapper: WebGLContextManager,
    textConfig: TextRenderConfig,
    textureConfig: TextureConfig = {},
  ) {
    super(contextWrapper, textureConfig);

    // Create canvas for text rendering
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("TextTexture: Failed to create canvas context");
    }
    this.ctx = ctx;

    // Initialize text configuration
    this.textConfig = {
      ...DEFAULT_TEXT_CONFIG,
      ...textConfig,
    };

    // Create texture and render initial text
    this.createTexture();
    this.renderText();
  }

  /**
   * Update text content
   */
  setText(text: string): void {
    if (this.textConfig.text !== text) {
      this.textConfig.text = text;
      this.needsRedraw = true;
      this._needsUpdate = true;
    }
  }

  /**
   * Update text configuration
   */
  setTextConfig(config: Partial<TextRenderConfig>): void {
    this.textConfig = {
      ...this.textConfig,
      ...config,
    };
    this.needsRedraw = true;
    this._needsUpdate = true;
  }

  /**
   * Get current text
   */
  getText(): string {
    return this.textConfig.text;
  }

  /**
   * Get text configuration
   */
  getTextConfig(): Readonly<TextRenderConfig> {
    return this.textConfig;
  }

  /**
   * Render text to canvas
   */
  private renderText(): void {
    const config = this.textConfig;

    // Calculate text metrics and required canvas size
    this.ctx.font = this.getFontString();
    const lines = this.wrapText(config.text, config.maxWidth);
    const lineHeight = config.fontSize * config.lineHeight;
    const textWidth = this.calculateTextWidth(lines);
    const textHeight = lines.length * lineHeight;

    // Set canvas size with padding
    const canvasWidth = Math.ceil(textWidth + config.padding * 2);
    const canvasHeight = Math.ceil(textHeight + config.padding * 2);

    // Resize canvas if needed
    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this._width = canvasWidth;
      this._height = canvasHeight;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background if specified
    if (config.backgroundColor !== "transparent") {
      this.ctx.fillStyle = config.backgroundColor;
      this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Configure text rendering
    this.ctx.font = this.getFontString();
    this.ctx.fillStyle = config.color;
    this.ctx.textBaseline = config.textBaseline;

    // Configure shadows if specified
    if (config.shadowColor !== "transparent" && config.shadowBlur > 0) {
      this.ctx.shadowColor = config.shadowColor;
      this.ctx.shadowBlur = config.shadowBlur;
      this.ctx.shadowOffsetX = config.shadowOffsetX;
      this.ctx.shadowOffsetY = config.shadowOffsetY;
    }

    // Draw each line
    lines.forEach((line, index) => {
      const x = this.getTextX(line, config.textAlign, config.padding, canvasWidth);
      const y = config.padding + index * lineHeight + config.fontSize;

      // Draw stroke if specified
      if (config.strokeColor !== "transparent" && config.strokeWidth > 0) {
        this.ctx.strokeStyle = config.strokeColor;
        this.ctx.lineWidth = config.strokeWidth;
        this.ctx.strokeText(line, x, y);
      }

      // Draw filled text
      this.ctx.fillText(line, x, y);
    });

    this.needsRedraw = false;
    this._isReady = true;
  }

  /**
   * Get font string for canvas context
   */
  private getFontString(): string {
    const { fontStyle, fontWeight, fontSize, fontFamily } = this.textConfig;
    return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  /**
   * Wrap text into lines based on maxWidth
   */
  private wrapText(text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) {
      // No wrapping, split by newlines only
      return text.split("\n");
    }

    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === "") {
        lines.push("");
        continue;
      }

      const words = paragraph.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = this.ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * Calculate the maximum width of all lines
   */
  private calculateTextWidth(lines: string[]): number {
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = this.ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }
    return maxWidth;
  }

  /**
   * Get X coordinate for text based on alignment
   */
  private getTextX(
    line: string,
    align: TextAlign,
    padding: number,
    canvasWidth: number,
  ): number {
    switch (align) {
      case TextAlign.LEFT:
        return padding;
      case TextAlign.CENTER: {
        const metrics = this.ctx.measureText(line);
        return (canvasWidth - metrics.width) / 2;
      }
      case TextAlign.RIGHT: {
        const metrics = this.ctx.measureText(line);
        return canvasWidth - metrics.width - padding;
      }
      default:
        return padding;
    }
  }

  /**
   * Update texture with current canvas content
   */
  update(): void {
    if (this.needsRedraw) {
      this.renderText();
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
      console.error("TextTexture: Failed to update texture:", error);
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
   * Measure text dimensions without rendering
   */
  measureText(text: string): { width: number; height: number } {
    this.ctx.font = this.getFontString();
    const lines = this.wrapText(text, this.textConfig.maxWidth);
    const lineHeight = this.textConfig.fontSize * this.textConfig.lineHeight;
    const width = this.calculateTextWidth(lines) + this.textConfig.padding * 2;
    const height = lines.length * lineHeight + this.textConfig.padding * 2;

    return { width, height };
  }

  /**
   * Dispose of texture resources
   */
  dispose(): void {
    super.dispose();
    // Canvas will be garbage collected
  }
}
