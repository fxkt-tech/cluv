/**
 * Math Utilities Tests
 *
 * 测试数学工具函数的正确性
 */

import {
  Mat4,
  Vec3,
  degToRad,
  radToDeg,
  clamp,
  lerp,
  nearlyEqual,
} from "../utils/math";

describe("Mat4", () => {
  describe("identity", () => {
    it("should create an identity matrix", () => {
      const mat = Mat4.identity();
      expect(mat).toEqual(
        new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      );
    });
  });

  describe("multiply", () => {
    it("should multiply two matrices correctly", () => {
      const a = Mat4.identity();
      const b = Mat4.identity();
      const result = Mat4.multiply(a, b);
      expect(result).toEqual(Mat4.identity());
    });

    it("should apply transformations in order", () => {
      const translate = Mat4.translate(10, 20, 0);
      const scale = Mat4.scale(2, 2, 1);
      const result = Mat4.multiply(translate, scale);

      // 结果矩阵应该包含平移和缩放
      expect(result).toBeDefined();
      expect(result.length).toBe(16);
    });
  });

  describe("translate", () => {
    it("should create a translation matrix", () => {
      const mat = Mat4.translate(10, 20, 30);
      expect(mat[12]).toBe(10);
      expect(mat[13]).toBe(20);
      expect(mat[14]).toBe(30);
    });
  });

  describe("scale", () => {
    it("should create a scale matrix", () => {
      const mat = Mat4.scale(2, 3, 4);
      expect(mat[0]).toBe(2);
      expect(mat[5]).toBe(3);
      expect(mat[10]).toBe(4);
    });
  });

  describe("rotateZ", () => {
    it("should create a rotation matrix around Z axis", () => {
      const angle = Math.PI / 2; // 90 degrees
      const mat = Mat4.rotateZ(angle);

      // 检查旋转矩阵的基本结构
      expect(mat[0]).toBeCloseTo(0, 5); // cos(90°) ≈ 0
      expect(mat[1]).toBeCloseTo(1, 5); // sin(90°) ≈ 1
      expect(mat[4]).toBeCloseTo(-1, 5); // -sin(90°) ≈ -1
      expect(mat[5]).toBeCloseTo(0, 5); // cos(90°) ≈ 0
    });
  });

  describe("ortho", () => {
    it("should create an orthographic projection matrix", () => {
      const mat = Mat4.ortho(0, 800, 0, 600, -1, 1);
      expect(mat).toBeDefined();
      expect(mat.length).toBe(16);
    });
  });

  describe("perspective", () => {
    it("should create a perspective projection matrix", () => {
      const fov = Math.PI / 4; // 45 degrees
      const aspect = 16 / 9;
      const near = 0.1;
      const far = 1000;
      const mat = Mat4.perspective(fov, aspect, near, far);

      expect(mat).toBeDefined();
      expect(mat.length).toBe(16);
    });
  });

  describe("invert", () => {
    it("should invert an identity matrix to itself", () => {
      const mat = Mat4.identity();
      const inverted = Mat4.invert(mat);

      expect(inverted).not.toBeNull();
      if (inverted) {
        for (let i = 0; i < 16; i++) {
          expect(inverted[i]).toBeCloseTo(mat[i], 5);
        }
      }
    });

    it("should return null for non-invertible matrix", () => {
      const mat = new Float32Array(16); // All zeros
      const inverted = Mat4.invert(mat);
      expect(inverted).toBeNull();
    });
  });

  describe("transpose", () => {
    it("should transpose a matrix", () => {
      const mat = new Float32Array([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
      ]);
      const transposed = Mat4.transpose(mat);

      expect(transposed[0]).toBe(1);
      expect(transposed[1]).toBe(5);
      expect(transposed[2]).toBe(9);
      expect(transposed[4]).toBe(2);
    });
  });

  describe("fromTransform", () => {
    it("should create a matrix from transform parameters", () => {
      const position = { x: 10, y: 20, z: 0 };
      const rotation = { x: 0, y: 0, z: 0 };
      const scale = { x: 1, y: 1, z: 1 };

      const mat = Mat4.fromTransform(position, rotation, scale);
      expect(mat).toBeDefined();
      expect(mat.length).toBe(16);
    });
  });

  describe("clone", () => {
    it("should create a copy of the matrix", () => {
      const original = Mat4.identity();
      const cloned = Mat4.clone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original); // Different instances
    });
  });
});

describe("Vec3", () => {
  describe("create", () => {
    it("should create a vector", () => {
      const vec = Vec3.create(1, 2, 3);
      expect(vec).toEqual(new Float32Array([1, 2, 3]));
    });
  });

  describe("normalize", () => {
    it("should normalize a vector", () => {
      const vec = Vec3.create(3, 4, 0);
      const normalized = Vec3.normalize(vec);

      expect(normalized[0]).toBeCloseTo(0.6, 5);
      expect(normalized[1]).toBeCloseTo(0.8, 5);
      expect(normalized[2]).toBeCloseTo(0, 5);
    });

    it("should return zero vector for zero input", () => {
      const vec = Vec3.create(0, 0, 0);
      const normalized = Vec3.normalize(vec);

      expect(normalized).toEqual(new Float32Array([0, 0, 0]));
    });
  });

  describe("dot", () => {
    it("should calculate dot product", () => {
      const a = Vec3.create(1, 2, 3);
      const b = Vec3.create(4, 5, 6);
      const result = Vec3.dot(a, b);

      expect(result).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    it("should return zero for perpendicular vectors", () => {
      const a = Vec3.create(1, 0, 0);
      const b = Vec3.create(0, 1, 0);
      const result = Vec3.dot(a, b);

      expect(result).toBe(0);
    });
  });

  describe("cross", () => {
    it("should calculate cross product", () => {
      const a = Vec3.create(1, 0, 0);
      const b = Vec3.create(0, 1, 0);
      const result = Vec3.cross(a, b);

      expect(result[0]).toBeCloseTo(0, 5);
      expect(result[1]).toBeCloseTo(0, 5);
      expect(result[2]).toBeCloseTo(1, 5);
    });
  });

  describe("add", () => {
    it("should add two vectors", () => {
      const a = Vec3.create(1, 2, 3);
      const b = Vec3.create(4, 5, 6);
      const result = Vec3.add(a, b);

      expect(result).toEqual(new Float32Array([5, 7, 9]));
    });
  });

  describe("subtract", () => {
    it("should subtract two vectors", () => {
      const a = Vec3.create(5, 7, 9);
      const b = Vec3.create(1, 2, 3);
      const result = Vec3.subtract(a, b);

      expect(result).toEqual(new Float32Array([4, 5, 6]));
    });
  });

  describe("scale", () => {
    it("should scale a vector", () => {
      const vec = Vec3.create(1, 2, 3);
      const result = Vec3.scale(vec, 2);

      expect(result).toEqual(new Float32Array([2, 4, 6]));
    });
  });

  describe("magnitude", () => {
    it("should calculate vector magnitude", () => {
      const vec = Vec3.create(3, 4, 0);
      const magnitude = Vec3.magnitude(vec);

      expect(magnitude).toBe(5);
    });
  });

  describe("distance", () => {
    it("should calculate distance between two vectors", () => {
      const a = Vec3.create(0, 0, 0);
      const b = Vec3.create(3, 4, 0);
      const distance = Vec3.distance(a, b);

      expect(distance).toBe(5);
    });
  });

  describe("lerp", () => {
    it("should interpolate between two vectors", () => {
      const a = Vec3.create(0, 0, 0);
      const b = Vec3.create(10, 10, 10);

      const result1 = Vec3.lerp(a, b, 0);
      expect(result1).toEqual(new Float32Array([0, 0, 0]));

      const result2 = Vec3.lerp(a, b, 0.5);
      expect(result2).toEqual(new Float32Array([5, 5, 5]));

      const result3 = Vec3.lerp(a, b, 1);
      expect(result3).toEqual(new Float32Array([10, 10, 10]));
    });
  });

  describe("clone", () => {
    it("should create a copy of the vector", () => {
      const original = Vec3.create(1, 2, 3);
      const cloned = Vec3.clone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });
});

describe("Utility Functions", () => {
  describe("degToRad", () => {
    it("should convert degrees to radians", () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 5);
      expect(degToRad(180)).toBeCloseTo(Math.PI, 5);
      expect(degToRad(360)).toBeCloseTo(Math.PI * 2, 5);
    });
  });

  describe("radToDeg", () => {
    it("should convert radians to degrees", () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 5);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 5);
      expect(radToDeg(Math.PI * 2)).toBeCloseTo(360, 5);
    });
  });

  describe("clamp", () => {
    it("should clamp values within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("lerp", () => {
    it("should interpolate between two values", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(10, 20, 0.5)).toBe(15);
    });
  });

  describe("nearlyEqual", () => {
    it("should check if numbers are nearly equal", () => {
      expect(nearlyEqual(1.0, 1.0)).toBe(true);
      expect(nearlyEqual(1.0, 1.0000001)).toBe(true);
      expect(nearlyEqual(1.0, 1.1)).toBe(false);
      expect(nearlyEqual(1.0, 1.001, 0.01)).toBe(true);
    });
  });
});
