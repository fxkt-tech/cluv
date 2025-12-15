/**
 * QuadGeometry.ts
 *
 * Quad geometry for 2D rendering
 * Provides vertex data for a textured 2D quad
 */

import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Vertex attribute data
 */
export interface VertexAttribute {
  buffer: WebGLBuffer | null;
  data: Float32Array;
  size: number; // Components per vertex (e.g., 3 for vec3)
  normalized: boolean;
  stride: number;
  offset: number;
}

/**
 * Quad geometry configuration
 */
export interface QuadGeometryConfig {
  width?: number;
  height?: number;
  centered?: boolean; // If true, quad is centered at origin
  flipY?: boolean; // Flip texture coordinates vertically
}

/**
 * Default quad configuration
 */
const DEFAULT_CONFIG: Required<QuadGeometryConfig> = {
  width: 1.0,
  height: 1.0,
  centered: true,
  flipY: false,
};

/**
 * QuadGeometry class for 2D quad rendering
 */
export class QuadGeometry {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private config: Required<QuadGeometryConfig>;

  // Vertex buffers
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;

  // Vertex data
  private positions: Float32Array;
  private texCoords: Float32Array;
  private indices: Uint16Array;

  private vertexCount = 6; // Two triangles

  constructor(
    private contextWrapper: WebGLContextManager,
    config: QuadGeometryConfig = {},
  ) {
    const context = contextWrapper.getContext();
    if (!context) {
      throw new Error("QuadGeometry: WebGL context is not available");
    }
    this.gl = context;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Generate vertex data
    this.positions = this.generatePositions();
    this.texCoords = this.generateTexCoords();
    this.indices = this.generateIndices();

    // Create buffers
    this.createBuffers();
  }

  /**
   * Generate position data for the quad
   */
  private generatePositions(): Float32Array {
    const { width, height, centered } = this.config;

    let x0: number, y0: number, x1: number, y1: number;

    if (centered) {
      // Centered at origin
      x0 = -width / 2;
      y0 = -height / 2;
      x1 = width / 2;
      y1 = height / 2;
    } else {
      // Bottom-left at origin
      x0 = 0;
      y0 = 0;
      x1 = width;
      y1 = height;
    }

    // Four vertices (x, y, z)
    return new Float32Array([
      x0,
      y0,
      0.0, // Bottom-left
      x1,
      y0,
      0.0, // Bottom-right
      x1,
      y1,
      0.0, // Top-right
      x0,
      y1,
      0.0, // Top-left
    ]);
  }

  /**
   * Generate texture coordinate data
   */
  private generateTexCoords(): Float32Array {
    const { flipY } = this.config;

    if (flipY) {
      // Flipped Y (OpenGL style)
      return new Float32Array([
        0.0,
        1.0, // Bottom-left
        1.0,
        1.0, // Bottom-right
        1.0,
        0.0, // Top-right
        0.0,
        0.0, // Top-left
      ]);
    } else {
      // Normal (screen space)
      return new Float32Array([
        0.0,
        0.0, // Bottom-left
        1.0,
        0.0, // Bottom-right
        1.0,
        1.0, // Top-right
        0.0,
        1.0, // Top-left
      ]);
    }
  }

  /**
   * Generate index data for two triangles
   */
  private generateIndices(): Uint16Array {
    return new Uint16Array([
      0,
      1,
      2, // First triangle
      0,
      2,
      3, // Second triangle
    ]);
  }

  /**
   * Create WebGL buffers
   */
  private createBuffers(): void {
    const gl = this.gl;

    // Position buffer
    this.positionBuffer = gl.createBuffer();
    if (!this.positionBuffer) {
      console.error("QuadGeometry: Failed to create position buffer");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    // Texture coordinate buffer
    this.texCoordBuffer = gl.createBuffer();
    if (!this.texCoordBuffer) {
      console.error("QuadGeometry: Failed to create texCoord buffer");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texCoords, gl.STATIC_DRAW);

    // Index buffer
    this.indexBuffer = gl.createBuffer();
    if (!this.indexBuffer) {
      console.error("QuadGeometry: Failed to create index buffer");
      return;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    // Unbind
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * Bind vertex attributes to shader program
   */
  bindAttributes(positionLocation: number, texCoordLocation: number): void {
    const gl = this.gl;

    // Bind position attribute
    if (positionLocation >= 0 && this.positionBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    }

    // Bind texture coordinate attribute
    if (texCoordLocation >= 0 && this.texCoordBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    }
  }

  /**
   * Draw the quad
   */
  draw(): void {
    const gl = this.gl;

    if (!this.indexBuffer) {
      console.error("QuadGeometry: Index buffer not initialized");
      return;
    }

    // Bind index buffer and draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);
  }

  /**
   * Draw without indices (using drawArrays)
   */
  drawArrays(): void {
    const gl = this.gl;
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  /**
   * Get position buffer
   */
  getPositionBuffer(): WebGLBuffer | null {
    return this.positionBuffer;
  }

  /**
   * Get texture coordinate buffer
   */
  getTexCoordBuffer(): WebGLBuffer | null {
    return this.texCoordBuffer;
  }

  /**
   * Get index buffer
   */
  getIndexBuffer(): WebGLBuffer | null {
    return this.indexBuffer;
  }

  /**
   * Get position data
   */
  getPositions(): Float32Array {
    return this.positions;
  }

  /**
   * Get texture coordinate data
   */
  getTexCoords(): Float32Array {
    return this.texCoords;
  }

  /**
   * Get index data
   */
  getIndices(): Uint16Array {
    return this.indices;
  }

  /**
   * Get vertex count
   */
  getVertexCount(): number {
    return this.vertexCount;
  }

  /**
   * Update quad dimensions
   */
  updateDimensions(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    // Regenerate positions
    this.positions = this.generatePositions();

    // Update position buffer
    if (this.positionBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        this.positions,
        this.gl.STATIC_DRAW,
      );
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
  }

  /**
   * Update texture coordinates
   */
  updateTexCoords(texCoords: Float32Array): void {
    if (texCoords.length !== 8) {
      console.error(
        "QuadGeometry: Invalid texCoords length, expected 8 floats",
      );
      return;
    }

    this.texCoords = texCoords;

    // Update texture coordinate buffer
    if (this.texCoordBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        this.texCoords,
        this.gl.STATIC_DRAW,
      );
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
  }

  /**
   * Dispose of geometry resources
   */
  dispose(): void {
    const gl = this.gl;

    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }

    if (this.texCoordBuffer) {
      gl.deleteBuffer(this.texCoordBuffer);
      this.texCoordBuffer = null;
    }

    if (this.indexBuffer) {
      gl.deleteBuffer(this.indexBuffer);
      this.indexBuffer = null;
    }
  }
}
