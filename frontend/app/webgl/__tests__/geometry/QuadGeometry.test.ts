/**
 * QuadGeometry.test.ts
 *
 * Unit tests for QuadGeometry class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QuadGeometry } from "../../geometry/QuadGeometry";
import type { WebGLContextManager } from "../../core/WebGLContext";

// Mock WebGL context
const createMockWebGLContext = () => {
  let bufferIdCounter = 0;

  const mockBuffer = () =>
    ({ id: bufferIdCounter++ }) as unknown as WebGLBuffer;

  const gl = {
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLES: 0x0004,
    TRIANGLE_FAN: 0x0006,
    UNSIGNED_SHORT: 0x1403,

    createBuffer: vi.fn(() => mockBuffer()),
    deleteBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(() => {
      // Store buffer data for verification
    }),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawElements: vi.fn(),
    drawArrays: vi.fn(),
  } as unknown as WebGL2RenderingContext;

  return gl;
};

const createMockContextWrapper = (
  gl: WebGL2RenderingContext,
): WebGLContextManager => {
  return {
    getContext: () => gl,
    isWebGL2: () => true,
  } as WebGLContextManager;
};

describe("QuadGeometry", () => {
  let mockGl: WebGL2RenderingContext;
  let mockContextWrapper: WebGLContextManager;

  beforeEach(() => {
    mockGl = createMockWebGLContext();
    mockContextWrapper = createMockContextWrapper(mockGl);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a quad geometry with default configuration", () => {
      new QuadGeometry(mockContextWrapper);

      expect(mockGl.createBuffer).toHaveBeenCalledTimes(3); // position, texCoord, index
      expect(mockGl.bindBuffer).toHaveBeenCalled();
      expect(mockGl.bufferData).toHaveBeenCalledTimes(3);
    });

    it("should create a centered quad by default", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const positions = quad.getPositions();

      // Centered 1x1 quad
      expect(positions[0]).toBe(-0.5); // x0
      expect(positions[1]).toBe(-0.5); // y0
      expect(positions[3]).toBe(0.5); // x1
      expect(positions[4]).toBe(-0.5); // y0
    });

    it("should create a non-centered quad when specified", () => {
      const quad = new QuadGeometry(mockContextWrapper, { centered: false });
      const positions = quad.getPositions();

      // Bottom-left at origin
      expect(positions[0]).toBe(0); // x0
      expect(positions[1]).toBe(0); // y0
      expect(positions[3]).toBe(1); // x1
      expect(positions[4]).toBe(0); // y0
    });

    it("should create quad with custom dimensions", () => {
      const quad = new QuadGeometry(mockContextWrapper, {
        width: 2.0,
        height: 3.0,
        centered: true,
      });
      const positions = quad.getPositions();

      // Centered 2x3 quad
      expect(positions[0]).toBe(-1.0); // x0 = -width/2
      expect(positions[1]).toBe(-1.5); // y0 = -height/2
      expect(positions[3]).toBe(1.0); // x1 = width/2
      expect(positions[7]).toBe(1.5); // y1 = height/2
    });

    it("should generate correct texture coordinates", () => {
      const quad = new QuadGeometry(mockContextWrapper, { flipY: false });
      const texCoords = quad.getTexCoords();

      expect(texCoords).toEqual(
        new Float32Array([
          0.0,
          0.0, // Bottom-left
          1.0,
          0.0, // Bottom-right
          1.0,
          1.0, // Top-right
          0.0,
          1.0, // Top-left
        ]),
      );
    });

    it("should flip texture coordinates when flipY is true", () => {
      const quad = new QuadGeometry(mockContextWrapper, { flipY: true });
      const texCoords = quad.getTexCoords();

      expect(texCoords).toEqual(
        new Float32Array([
          0.0,
          1.0, // Bottom-left
          1.0,
          1.0, // Bottom-right
          1.0,
          0.0, // Top-right
          0.0,
          0.0, // Top-left
        ]),
      );
    });

    it("should generate correct indices for two triangles", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const indices = quad.getIndices();

      expect(indices).toEqual(
        new Uint16Array([
          0,
          1,
          2, // First triangle
          0,
          2,
          3, // Second triangle
        ]),
      );
    });
  });

  describe("bindAttributes", () => {
    it("should bind position and texCoord attributes", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      quad.bindAttributes(0, 1);

      expect(mockGl.bindBuffer).toHaveBeenCalledWith(
        mockGl.ARRAY_BUFFER,
        expect.anything(),
      );
      expect(mockGl.enableVertexAttribArray).toHaveBeenCalledWith(0);
      expect(mockGl.enableVertexAttribArray).toHaveBeenCalledWith(1);
      expect(mockGl.vertexAttribPointer).toHaveBeenCalledTimes(2);
    });

    it("should handle negative attribute locations gracefully", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      quad.bindAttributes(-1, -1);

      // Should not throw
      expect(mockGl.enableVertexAttribArray).not.toHaveBeenCalled();
    });
  });

  describe("draw", () => {
    it("should draw indexed triangles", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      quad.draw();

      expect(mockGl.bindBuffer).toHaveBeenCalledWith(
        mockGl.ELEMENT_ARRAY_BUFFER,
        expect.anything(),
      );
      expect(mockGl.drawElements).toHaveBeenCalledWith(
        mockGl.TRIANGLES,
        6,
        mockGl.UNSIGNED_SHORT,
        0,
      );
    });
  });

  describe("drawArrays", () => {
    it("should draw using drawArrays", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      quad.drawArrays();

      expect(mockGl.drawArrays).toHaveBeenCalledWith(mockGl.TRIANGLE_FAN, 0, 4);
    });
  });

  describe("updateDimensions", () => {
    it("should update quad dimensions", () => {
      const quad = new QuadGeometry(mockContextWrapper, { centered: true });

      // Initial positions
      const initialPositions = quad.getPositions();
      expect(initialPositions[0]).toBe(-0.5);

      // Update dimensions
      quad.updateDimensions(4.0, 6.0);

      // Check new positions
      const newPositions = quad.getPositions();
      expect(newPositions[0]).toBe(-2.0); // -4.0/2
      expect(newPositions[1]).toBe(-3.0); // -6.0/2
      expect(newPositions[3]).toBe(2.0); // 4.0/2
      expect(newPositions[7]).toBe(3.0); // 6.0/2

      // Should have updated the buffer
      expect(mockGl.bufferData).toHaveBeenCalledWith(
        mockGl.ARRAY_BUFFER,
        expect.any(Float32Array),
        mockGl.STATIC_DRAW,
      );
    });
  });

  describe("updateTexCoords", () => {
    it("should update texture coordinates", () => {
      const quad = new QuadGeometry(mockContextWrapper);

      const newTexCoords = new Float32Array([
        0.5, 0.5, 1.0, 0.5, 1.0, 1.0, 0.5, 1.0,
      ]);

      quad.updateTexCoords(newTexCoords);

      const updatedTexCoords = quad.getTexCoords();
      expect(updatedTexCoords).toEqual(newTexCoords);
    });

    it("should reject invalid texture coordinate arrays", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const invalidTexCoords = new Float32Array([0.0, 0.0, 1.0]); // Wrong length
      quad.updateTexCoords(invalidTexCoords);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid texCoords length"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getters", () => {
    it("should return position buffer", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const buffer = quad.getPositionBuffer();
      expect(buffer).not.toBeNull();
    });

    it("should return texCoord buffer", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const buffer = quad.getTexCoordBuffer();
      expect(buffer).not.toBeNull();
    });

    it("should return index buffer", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const buffer = quad.getIndexBuffer();
      expect(buffer).not.toBeNull();
    });

    it("should return vertex count", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      expect(quad.getVertexCount()).toBe(6);
    });
  });

  describe("dispose", () => {
    it("should delete all buffers", () => {
      const quad = new QuadGeometry(mockContextWrapper);

      quad.dispose();

      expect(mockGl.deleteBuffer).toHaveBeenCalledTimes(3);
      expect(quad.getPositionBuffer()).toBeNull();
      expect(quad.getTexCoordBuffer()).toBeNull();
      expect(quad.getIndexBuffer()).toBeNull();
    });
  });

  describe("vertex data", () => {
    it("should have 4 vertices with 3 components each (xyz)", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const positions = quad.getPositions();
      expect(positions.length).toBe(12); // 4 vertices * 3 components
    });

    it("should have 4 vertices with 2 texture coordinates each (uv)", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const texCoords = quad.getTexCoords();
      expect(texCoords.length).toBe(8); // 4 vertices * 2 components
    });

    it("should have z-coordinate of 0 for all vertices", () => {
      const quad = new QuadGeometry(mockContextWrapper);
      const positions = quad.getPositions();

      // Check z-coordinates (every 3rd value starting from index 2)
      for (let i = 2; i < positions.length; i += 3) {
        expect(positions[i]).toBe(0.0);
      }
    });
  });
});
