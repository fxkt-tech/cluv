/**
 * ShapeTexture.test.ts
 *
 * Unit tests for ShapeTexture class
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShapeTexture, ShapeType } from "./ShapeTexture";
import type { WebGLContextManager } from "../core/WebGLContext";
import type { ShapeRenderConfig } from "./ShapeTexture";

// Mock WebGL context
const createMockWebGLContext = () => ({
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texSubImage2D: vi.fn(),
  texParameteri: vi.fn(),
  pixelStorei: vi.fn(),
  deleteTexture: vi.fn(),
  activeTexture: vi.fn(),
  generateMipmap: vi.fn(),
  TEXTURE_2D: 3553,
  RGBA: 6408,
  RGB: 6407,
  UNSIGNED_BYTE: 5121,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  LINEAR: 9729,
  NEAREST: 9728,
  CLAMP_TO_EDGE: 33071,
  REPEAT: 10497,
  UNPACK_FLIP_Y_WEBGL: 37440,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
  TEXTURE0: 33984,
});

describe("ShapeTexture", () => {
  let mockContextManager: WebGLContextManager;
  let mockGL: any;

  beforeEach(() => {
    mockGL = createMockWebGLContext();

    mockContextManager = {
      getContext: vi.fn(() => mockGL),
      isWebGL2: vi.fn(() => false),
      getExtension: vi.fn(() => null),
      getMaxAnisotropy: vi.fn(() => 1),
    } as any;
  });

  describe("Constructor", () => {
    it("should create a rectangle shape with default config", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);

      expect(texture).toBeDefined();
      expect(texture.isReady).toBe(true);
      expect(texture.width).toBe(200);
      expect(texture.height).toBe(100);
    });

    it("should create a circle shape", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
        fillColor: "#ff0000",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);

      expect(texture).toBeDefined();
      expect(texture.getShapeConfig().type).toBe(ShapeType.CIRCLE);
      expect(texture.getShapeConfig().fillColor).toBe("#ff0000");
    });

    it("should create canvas with correct dimensions", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 300,
        height: 150,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      const canvas = texture.getCanvas();

      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(150);
    });
  });

  describe("Rectangle Shape", () => {
    it("should render a basic rectangle", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
        fillColor: "#0000ff",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });

    it("should render a rectangle with stroke", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
        fillColor: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 5,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().strokeWidth).toBe(5);
    });
  });

  describe("Rounded Rectangle Shape", () => {
    it("should render a rounded rectangle", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.ROUNDED_RECTANGLE,
        width: 200,
        height: 100,
        cornerRadius: 20,
        fillColor: "#00ff00",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().cornerRadius).toBe(20);
    });

    it("should clamp corner radius to max allowed", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.ROUNDED_RECTANGLE,
        width: 100,
        height: 50,
        cornerRadius: 100, // Larger than half of smallest dimension
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Circle Shape", () => {
    it("should render a circle", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
        fillColor: "#ff00ff",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });

    it("should handle non-square dimensions for circle", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 300,
        height: 200,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Ellipse Shape", () => {
    it("should render an ellipse", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.ELLIPSE,
        width: 300,
        height: 150,
        fillColor: "#ffff00",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Triangle Shape", () => {
    it("should render a triangle", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.TRIANGLE,
        width: 200,
        height: 200,
        fillColor: "#00ffff",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Polygon Shape", () => {
    it("should render a hexagon (6 sides)", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.POLYGON,
        width: 200,
        height: 200,
        sides: 6,
        fillColor: "#ff8800",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().sides).toBe(6);
    });

    it("should render an octagon (8 sides)", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.POLYGON,
        width: 200,
        height: 200,
        sides: 8,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().sides).toBe(8);
    });

    it("should handle 3-sided polygon (triangle)", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.POLYGON,
        width: 150,
        height: 150,
        sides: 3,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Star Shape", () => {
    it("should render a 5-point star", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.STAR,
        width: 200,
        height: 200,
        sides: 5,
        innerRadius: 0.5,
        fillColor: "#ffdd00",
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().sides).toBe(5);
      expect(texture.getShapeConfig().innerRadius).toBe(0.5);
    });

    it("should render a 6-point star", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.STAR,
        width: 200,
        height: 200,
        sides: 6,
        innerRadius: 0.4,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().sides).toBe(6);
    });

    it("should handle different inner radius values", () => {
      const radiusValues = [0.3, 0.5, 0.7];

      for (const radius of radiusValues) {
        const shapeConfig: ShapeRenderConfig = {
          type: ShapeType.STAR,
          width: 200,
          height: 200,
          sides: 5,
          innerRadius: radius,
        };

        const texture = new ShapeTexture(mockContextManager, shapeConfig);
        expect(texture.getShapeConfig().innerRadius).toBe(radius);
      }
    });
  });

  describe("setShapeConfig", () => {
    it("should update shape configuration", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);

      texture.setShapeConfig({
        fillColor: "#ff0000",
        strokeColor: "#000000",
        strokeWidth: 3,
      });

      const config = texture.getShapeConfig();
      expect(config.fillColor).toBe("#ff0000");
      expect(config.strokeColor).toBe("#000000");
      expect(config.strokeWidth).toBe(3);
    });

    it("should resize canvas when dimensions change", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);

      texture.setShapeConfig({
        width: 300,
        height: 300,
      });

      expect(texture.width).toBe(300);
      expect(texture.height).toBe(300);
      expect(texture.getCanvas().width).toBe(300);
      expect(texture.getCanvas().height).toBe(300);
    });

    it("should mark texture for update", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      texture.setNeedsUpdate(false);

      texture.setShapeConfig({ fillColor: "#00ff00" });

      expect(texture.needsUpdate()).toBe(true);
    });
  });

  describe("Rotation", () => {
    it("should support shape rotation", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
        rotation: 45,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().rotation).toBe(45);
    });

    it("should handle different rotation angles", () => {
      const angles = [0, 45, 90, 180, 270, 360];

      for (const angle of angles) {
        const shapeConfig: ShapeRenderConfig = {
          type: ShapeType.TRIANGLE,
          width: 150,
          height: 150,
          rotation: angle,
        };

        const texture = new ShapeTexture(mockContextManager, shapeConfig);
        expect(texture.getShapeConfig().rotation).toBe(angle);
      }
    });
  });

  describe("Shadow Effects", () => {
    it("should support shadow rendering", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
        shadowColor: "rgba(0,0,0,0.5)",
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      const config = texture.getShapeConfig();
      expect(config.shadowColor).toBe("rgba(0,0,0,0.5)");
      expect(config.shadowBlur).toBe(10);
      expect(config.shadowOffsetX).toBe(5);
      expect(config.shadowOffsetY).toBe(5);
    });
  });

  describe("update", () => {
    it("should update texture when needsUpdate is true", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      mockGL.texImage2D.mockClear();

      texture.setShapeConfig({ fillColor: "#ff0000" });
      texture.update();

      expect(mockGL.texImage2D).toHaveBeenCalled();
    });

    it("should not update when needsUpdate is false", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      mockGL.texImage2D.mockClear();

      texture.setNeedsUpdate(false);
      texture.update();

      expect(mockGL.texImage2D).not.toHaveBeenCalled();
    });
  });

  describe("Canvas access", () => {
    it("should provide access to underlying canvas", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      const canvas = texture.getCanvas();

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe("dispose", () => {
    it("should dispose texture resources", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.STAR,
        width: 200,
        height: 200,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      texture.dispose();

      expect(mockGL.deleteTexture).toHaveBeenCalled();
      expect(texture.isReady).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle very small dimensions", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 10,
        height: 10,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.width).toBe(10);
      expect(texture.height).toBe(10);
    });

    it("should handle very large dimensions", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 4096,
        height: 4096,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.width).toBe(4096);
      expect(texture.height).toBe(4096);
    });

    it("should handle zero stroke width", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
        strokeWidth: 0,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });

    it("should handle transparent fill", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.CIRCLE,
        width: 200,
        height: 200,
        fillColor: "transparent",
        strokeColor: "#000000",
        strokeWidth: 3,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().fillColor).toBe("transparent");
    });

    it("should handle polygon with many sides", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.POLYGON,
        width: 200,
        height: 200,
        sides: 20,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.isReady).toBe(true);
    });
  });

  describe("Multiple shape types in sequence", () => {
    it("should support changing shape type", () => {
      const shapeConfig: ShapeRenderConfig = {
        type: ShapeType.RECTANGLE,
        width: 200,
        height: 100,
      };

      const texture = new ShapeTexture(mockContextManager, shapeConfig);
      expect(texture.getShapeConfig().type).toBe(ShapeType.RECTANGLE);

      texture.setShapeConfig({ type: ShapeType.CIRCLE });
      expect(texture.getShapeConfig().type).toBe(ShapeType.CIRCLE);
    });
  });
});
