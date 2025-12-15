/**
 * Object-Oriented Math Utilities
 *
 * Wrapper classes for Mat4 and Vec3 to provide OOP interface
 * Built on top of the functional math utilities
 */

import * as MathUtils from "./math";

/**
 * 3D Vector class
 */
export class Vec3 {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Set vector components
   */
  set(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Clone this vector
   */
  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  /**
   * Copy from another vector
   */
  copy(other: Vec3): void {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;
  }

  /**
   * Add another vector
   */
  add(other: Vec3): Vec3 {
    return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  /**
   * Subtract another vector
   */
  subtract(other: Vec3): Vec3 {
    return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  /**
   * Multiply by scalar
   */
  scale(scalar: number): Vec3 {
    return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /**
   * Get vector length
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /**
   * Get squared length (faster, avoids sqrt)
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Normalize vector (make length = 1)
   */
  normalize(): Vec3 {
    const len = this.length();
    if (len === 0) return new Vec3(0, 0, 0);
    return this.scale(1 / len);
  }

  /**
   * Dot product with another vector
   */
  dot(other: Vec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * Cross product with another vector
   */
  cross(other: Vec3): Vec3 {
    return new Vec3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  /**
   * Linear interpolation to another vector
   */
  lerp(other: Vec3, t: number): Vec3 {
    return new Vec3(
      this.x + (other.x - this.x) * t,
      this.y + (other.y - this.y) * t,
      this.z + (other.z - this.z) * t,
    );
  }

  /**
   * Convert to array
   */
  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  /**
   * Convert to Float32Array
   */
  toFloat32Array(): Float32Array {
    return new Float32Array([this.x, this.y, this.z]);
  }

  /**
   * Static: Add two vectors
   */
  static add(a: Vec3, b: Vec3): Vec3 {
    return a.add(b);
  }

  /**
   * Static: Subtract two vectors
   */
  static subtract(a: Vec3, b: Vec3): Vec3 {
    return a.subtract(b);
  }

  /**
   * Static: Distance between two vectors
   */
  static distance(a: Vec3, b: Vec3): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Static: Create from array
   */
  static fromArray(arr: number[]): Vec3 {
    return new Vec3(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0);
  }
}

/**
 * 4x4 Matrix class
 */
export class Mat4 {
  public elements: Float32Array;

  constructor(elements?: Float32Array) {
    this.elements = elements ?? MathUtils.Mat4.identity();
  }

  /**
   * Clone this matrix
   */
  clone(): Mat4 {
    return new Mat4(new Float32Array(this.elements));
  }

  /**
   * Copy from another matrix
   */
  copy(other: Mat4): void {
    this.elements.set(other.elements);
  }

  /**
   * Multiply with another matrix
   */
  multiply(other: Mat4): Mat4 {
    return new Mat4(MathUtils.Mat4.multiply(this.elements, other.elements));
  }

  /**
   * Multiply with a vec4
   */
  multiplyVec4(vec: Float32Array): Float32Array {
    const m = this.elements;
    const x = vec[0],
      y = vec[1],
      z = vec[2],
      w = vec[3];

    return new Float32Array([
      m[0] * x + m[4] * y + m[8] * z + m[12] * w,
      m[1] * x + m[5] * y + m[9] * z + m[13] * w,
      m[2] * x + m[6] * y + m[10] * z + m[14] * w,
      m[3] * x + m[7] * y + m[11] * z + m[15] * w,
    ]);
  }

  /**
   * Get inverse matrix
   */
  inverse(): Mat4 {
    const inv = MathUtils.Mat4.invert(this.elements);
    if (!inv) {
      console.warn("Mat4: Matrix is not invertible, returning identity");
      return Mat4.identity();
    }
    return new Mat4(inv);
  }

  /**
   * Get transpose matrix
   */
  transpose(): Mat4 {
    return new Mat4(MathUtils.Mat4.transpose(this.elements));
  }

  /**
   * Static: Create identity matrix
   */
  static identity(): Mat4 {
    return new Mat4(MathUtils.Mat4.identity());
  }

  /**
   * Static: Create translation matrix
   */
  static translation(x: number, y: number, z: number): Mat4 {
    return new Mat4(MathUtils.Mat4.translate(x, y, z));
  }

  /**
   * Static: Create scaling matrix
   */
  static scaling(x: number, y: number, z: number): Mat4 {
    return new Mat4(MathUtils.Mat4.scale(x, y, z));
  }

  /**
   * Static: Create rotation matrix around X axis
   */
  static rotationX(angleInDegrees: number): Mat4 {
    const radians = (angleInDegrees * Math.PI) / 180;
    return new Mat4(MathUtils.Mat4.rotateX(radians));
  }

  /**
   * Static: Create rotation matrix around Y axis
   */
  static rotationY(angleInDegrees: number): Mat4 {
    const radians = (angleInDegrees * Math.PI) / 180;
    return new Mat4(MathUtils.Mat4.rotateY(radians));
  }

  /**
   * Static: Create rotation matrix around Z axis
   */
  static rotationZ(angleInDegrees: number): Mat4 {
    const radians = (angleInDegrees * Math.PI) / 180;
    return new Mat4(MathUtils.Mat4.rotateZ(radians));
  }

  /**
   * Static: Create orthographic projection matrix
   */
  static orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Mat4 {
    return new Mat4(MathUtils.Mat4.ortho(left, right, bottom, top, near, far));
  }

  /**
   * Static: Create perspective projection matrix
   */
  static perspective(
    fovInDegrees: number,
    aspect: number,
    near: number,
    far: number,
  ): Mat4 {
    return new Mat4(
      MathUtils.Mat4.perspective(fovInDegrees, aspect, near, far),
    );
  }

  /**
   * Static: Create look-at view matrix
   */
  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    // Calculate forward, right, and up vectors
    const forward = Vec3.subtract(target, eye).normalize();
    const right = forward.cross(up).normalize();
    const newUp = right.cross(forward).normalize();

    // Build look-at matrix
    const m = new Float32Array(16);

    // Right vector
    m[0] = right.x;
    m[1] = newUp.x;
    m[2] = -forward.x;
    m[3] = 0;

    // Up vector
    m[4] = right.y;
    m[5] = newUp.y;
    m[6] = -forward.y;
    m[7] = 0;

    // Forward vector
    m[8] = right.z;
    m[9] = newUp.z;
    m[10] = -forward.z;
    m[11] = 0;

    // Translation
    m[12] = -right.dot(eye);
    m[13] = -newUp.dot(eye);
    m[14] = forward.dot(eye);
    m[15] = 1;

    return new Mat4(m);
  }

  /**
   * Static: Multiply multiple matrices
   */
  static multiply(...matrices: Mat4[]): Mat4 {
    if (matrices.length === 0) return Mat4.identity();
    if (matrices.length === 1) return matrices[0].clone();

    let result = matrices[0].clone();
    for (let i = 1; i < matrices.length; i++) {
      result = result.multiply(matrices[i]);
    }
    return result;
  }

  /**
   * Convert to array
   */
  toArray(): number[] {
    return Array.from(this.elements);
  }

  /**
   * Static: Create from array
   */
  static fromArray(arr: number[]): Mat4 {
    return new Mat4(new Float32Array(arr));
  }
}
