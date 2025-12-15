/**
 * TextTexture.test.ts
 *
 * Unit tests for TextTexture class
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TextTexture, TextAlign, TextBaseline } from "./TextTexture";
import type { WebGLContextManager } from "../core/WebGLContext";
import type { TextRenderConfig } from "./TextTexture";

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

describe("TextTexture", () => {
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
    it("should create a text texture with default config", () => {
      const textConfig: TextRenderConfig = {
        text: "Hello World",
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      expect(texture).toBeDefined();
      expect(texture.getText()).toBe("Hello World");
      expect(texture.isReady).toBe(true);
      expect(texture.width).toBeGreaterThan(0);
      expect(texture.height).toBeGreaterThan(0);
    });

    it("should create a text texture with custom config", () => {
      const textConfig: TextRenderConfig = {
        text: "Custom Text",
        fontSize: 48,
        fontFamily: "Courier New",
        color: "#ff0000",
        backgroundColor: "#000000",
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      expect(texture).toBeDefined();
      expect(texture.getText()).toBe("Custom Text");
      expect(texture.getTextConfig().fontSize).toBe(48);
      expect(texture.getTextConfig().fontFamily).toBe("Courier New");
      expect(texture.getTextConfig().color).toBe("#ff0000");
      expect(texture.getTextConfig().backgroundColor).toBe("#000000");
    });

    it("should create canvas and rendering context", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      const canvas = texture.getCanvas();

      expect(canvas).toBeDefined();
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });
  });

  describe("setText", () => {
    it("should update text content", () => {
      const textConfig: TextRenderConfig = {
        text: "Original",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getText()).toBe("Original");

      texture.setText("Updated");
      expect(texture.getText()).toBe("Updated");
    });

    it("should mark texture for update when text changes", () => {
      const textConfig: TextRenderConfig = {
        text: "Original",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      texture.setText("Updated");

      expect(texture.needsUpdate()).toBe(true);
    });

    it("should not mark for update if text is the same", () => {
      const textConfig: TextRenderConfig = {
        text: "Same",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      texture.setNeedsUpdate(false);
      texture.setText("Same");

      expect(texture.needsUpdate()).toBe(false);
    });
  });

  describe("setTextConfig", () => {
    it("should update text configuration", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
        fontSize: 32,
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      texture.setTextConfig({
        fontSize: 48,
        color: "#00ff00",
      });

      const config = texture.getTextConfig();
      expect(config.fontSize).toBe(48);
      expect(config.color).toBe("#00ff00");
    });

    it("should mark texture for update", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      texture.setNeedsUpdate(false);

      texture.setTextConfig({ fontSize: 64 });

      expect(texture.needsUpdate()).toBe(true);
    });
  });

  describe("Text Alignment", () => {
    it("should support left alignment", () => {
      const textConfig: TextRenderConfig = {
        text: "Left Aligned",
        textAlign: TextAlign.LEFT,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().textAlign).toBe(TextAlign.LEFT);
    });

    it("should support center alignment", () => {
      const textConfig: TextRenderConfig = {
        text: "Center Aligned",
        textAlign: TextAlign.CENTER,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().textAlign).toBe(TextAlign.CENTER);
    });

    it("should support right alignment", () => {
      const textConfig: TextRenderConfig = {
        text: "Right Aligned",
        textAlign: TextAlign.RIGHT,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().textAlign).toBe(TextAlign.RIGHT);
    });
  });

  describe("Text Baseline", () => {
    it("should support different baseline values", () => {
      const baselines = [
        TextBaseline.TOP,
        TextBaseline.MIDDLE,
        TextBaseline.BOTTOM,
        TextBaseline.ALPHABETIC,
        TextBaseline.HANGING,
      ];

      for (const baseline of baselines) {
        const textConfig: TextRenderConfig = {
          text: "Test",
          textBaseline: baseline,
        };

        const texture = new TextTexture(mockContextManager, textConfig);
        expect(texture.getTextConfig().textBaseline).toBe(baseline);
      }
    });
  });

  describe("Text Wrapping", () => {
    it("should wrap text when maxWidth is set", () => {
      const textConfig: TextRenderConfig = {
        text: "This is a long line of text that should wrap",
        maxWidth: 200,
        fontSize: 16,
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      // Height should be greater when text wraps
      expect(texture.height).toBeGreaterThan(30);
    });

    it("should not wrap text when maxWidth is 0", () => {
      const textConfig: TextRenderConfig = {
        text: "This is a long line of text that should not wrap",
        maxWidth: 0,
        fontSize: 16,
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      // Should be single line height
      expect(texture.height).toBeLessThan(50);
    });

    it("should handle newlines in text", () => {
      const textConfig: TextRenderConfig = {
        text: "Line 1\nLine 2\nLine 3",
        fontSize: 16,
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      // Height should accommodate 3 lines
      expect(texture.height).toBeGreaterThan(50);
    });
  });

  describe("Styling", () => {
    it("should support font weight", () => {
      const textConfig: TextRenderConfig = {
        text: "Bold Text",
        fontWeight: "bold",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().fontWeight).toBe("bold");
    });

    it("should support font style", () => {
      const textConfig: TextRenderConfig = {
        text: "Italic Text",
        fontStyle: "italic",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().fontStyle).toBe("italic");
    });

    it("should support stroke", () => {
      const textConfig: TextRenderConfig = {
        text: "Stroked Text",
        strokeColor: "#000000",
        strokeWidth: 2,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getTextConfig().strokeColor).toBe("#000000");
      expect(texture.getTextConfig().strokeWidth).toBe(2);
    });

    it("should support shadow", () => {
      const textConfig: TextRenderConfig = {
        text: "Shadow Text",
        shadowColor: "rgba(0,0,0,0.5)",
        shadowBlur: 5,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      const config = texture.getTextConfig();
      expect(config.shadowColor).toBe("rgba(0,0,0,0.5)");
      expect(config.shadowBlur).toBe(5);
      expect(config.shadowOffsetX).toBe(2);
      expect(config.shadowOffsetY).toBe(2);
    });

    it("should support padding", () => {
      const textConfig: TextRenderConfig = {
        text: "Padded",
        fontSize: 32,
        padding: 20,
      };

      const texture = new TextTexture(mockContextManager, textConfig);

      // Canvas should be larger than text due to padding
      expect(texture.width).toBeGreaterThan(100);
      expect(texture.height).toBeGreaterThan(52); // 32 + 2*20
    });
  });

  describe("measureText", () => {
    it("should measure text dimensions", () => {
      const textConfig: TextRenderConfig = {
        text: "Measure Me",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      const dimensions = texture.measureText("Measure Me");

      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });

    it("should measure wrapped text", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
        maxWidth: 100,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      const dimensions = texture.measureText("This is a long text that will wrap");

      expect(dimensions.height).toBeGreaterThan(dimensions.width);
    });
  });

  describe("update", () => {
    it("should update texture when needsUpdate is true", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      mockGL.texImage2D.mockClear();

      texture.setText("Updated");
      texture.update();

      expect(mockGL.texImage2D).toHaveBeenCalled();
    });

    it("should not update when needsUpdate is false", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      mockGL.texImage2D.mockClear();

      texture.setNeedsUpdate(false);
      texture.update();

      expect(mockGL.texImage2D).not.toHaveBeenCalled();
    });
  });

  describe("Canvas access", () => {
    it("should provide access to underlying canvas", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      const canvas = texture.getCanvas();

      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe("dispose", () => {
    it("should dispose texture resources", () => {
      const textConfig: TextRenderConfig = {
        text: "Test",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      texture.dispose();

      expect(mockGL.deleteTexture).toHaveBeenCalled();
      expect(texture.isReady).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty text", () => {
      const textConfig: TextRenderConfig = {
        text: "",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getText()).toBe("");
      expect(texture.isReady).toBe(true);
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(1000);
      const textConfig: TextRenderConfig = {
        text: longText,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getText()).toBe(longText);
    });

    it("should handle special characters", () => {
      const textConfig: TextRenderConfig = {
        text: "Special: !@#$%^&*()_+{}[]|\\:;\"'<>,.?/~`",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getText()).toContain("Special");
    });

    it("should handle unicode characters", () => {
      const textConfig: TextRenderConfig = {
        text: "Unicode: 你好 🌍 مرحبا",
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.getText()).toContain("Unicode");
    });

    it("should handle very small font size", () => {
      const textConfig: TextRenderConfig = {
        text: "Tiny",
        fontSize: 8,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.width).toBeGreaterThan(0);
      expect(texture.height).toBeGreaterThan(0);
    });

    it("should handle very large font size", () => {
      const textConfig: TextRenderConfig = {
        text: "Huge",
        fontSize: 200,
      };

      const texture = new TextTexture(mockContextManager, textConfig);
      expect(texture.width).toBeGreaterThan(0);
      expect(texture.height).toBeGreaterThan(0);
    });
  });
});
