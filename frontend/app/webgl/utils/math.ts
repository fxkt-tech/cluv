/**
 * Math Utilities
 *
 * 提供 WebGL 所需的数学运算工具，包括矩阵和向量运算
 */

/**
 * 4x4 矩阵工具类
 * 使用列优先（Column-major）顺序存储，与 WebGL 一致
 */
export class Mat4 {
  /**
   * 创建单位矩阵
   */
  static identity(): Float32Array {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * 矩阵乘法 (a * b)
   * @param a 左矩阵
   * @param b 右矩阵
   * @returns 结果矩阵
   */
  static multiply(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(16);

    const a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    const a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
    const a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
    const a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

    const b00 = b[0],
      b01 = b[1],
      b02 = b[2],
      b03 = b[3];
    const b10 = b[4],
      b11 = b[5],
      b12 = b[6],
      b13 = b[7];
    const b20 = b[8],
      b21 = b[9],
      b22 = b[10],
      b23 = b[11];
    const b30 = b[12],
      b31 = b[13],
      b32 = b[14],
      b33 = b[15];

    result[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    result[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    result[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    result[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    result[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    result[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    result[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    result[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    result[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    result[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    result[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    result[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    result[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    result[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    result[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    result[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

    return result;
  }

  /**
   * 创建平移矩阵
   * @param x X 轴平移量
   * @param y Y 轴平移量
   * @param z Z 轴平移量
   * @returns 平移矩阵
   */
  static translate(x: number, y: number, z: number): Float32Array {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  }

  /**
   * 创建缩放矩阵
   * @param x X 轴缩放
   * @param y Y 轴缩放
   * @param z Z 轴缩放
   * @returns 缩放矩阵
   */
  static scale(x: number, y: number, z: number): Float32Array {
    return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
  }

  /**
   * 创建绕 Z 轴旋转矩阵
   * @param angle 旋转角度（弧度）
   * @returns 旋转矩阵
   */
  static rotateZ(angle: number): Float32Array {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * 创建绕 X 轴旋转矩阵
   * @param angle 旋转角度（弧度）
   * @returns 旋转矩阵
   */
  static rotateX(angle: number): Float32Array {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  /**
   * 创建绕 Y 轴旋转矩阵
   * @param angle 旋转角度（弧度）
   * @returns 旋转矩阵
   */
  static rotateY(angle: number): Float32Array {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  /**
   * 创建正交投影矩阵
   * @param left 左边界
   * @param right 右边界
   * @param bottom 下边界
   * @param top 上边界
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @returns 正交投影矩阵
   */
  static ortho(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
  ): Float32Array {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    return new Float32Array([
      -2 * lr,
      0,
      0,
      0,
      0,
      -2 * bt,
      0,
      0,
      0,
      0,
      2 * nf,
      0,
      (left + right) * lr,
      (top + bottom) * bt,
      (far + near) * nf,
      1,
    ]);
  }

  /**
   * 创建透视投影矩阵
   * @param fov 视场角（弧度）
   * @param aspect 宽高比
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @returns 透视投影矩阵
   */
  static perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number,
  ): Float32Array {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0,
    ]);
  }

  /**
   * 矩阵求逆
   * @param m 输入矩阵
   * @returns 逆矩阵，如果不可逆则返回 null
   */
  static invert(m: Float32Array): Float32Array | null {
    const a00 = m[0],
      a01 = m[1],
      a02 = m[2],
      a03 = m[3];
    const a10 = m[4],
      a11 = m[5],
      a12 = m[6],
      a13 = m[7];
    const a20 = m[8],
      a21 = m[9],
      a22 = m[10],
      a23 = m[11];
    const a30 = m[12],
      a31 = m[13],
      a32 = m[14],
      a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det =
      b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }

    det = 1.0 / det;

    const result = new Float32Array(16);

    result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return result;
  }

  /**
   * 矩阵转置
   * @param m 输入矩阵
   * @returns 转置矩阵
   */
  static transpose(m: Float32Array): Float32Array {
    return new Float32Array([
      m[0],
      m[4],
      m[8],
      m[12],
      m[1],
      m[5],
      m[9],
      m[13],
      m[2],
      m[6],
      m[10],
      m[14],
      m[3],
      m[7],
      m[11],
      m[15],
    ]);
  }

  /**
   * 从变换参数创建模型矩阵
   * @param position 位置 {x, y, z}
   * @param rotation 旋转角度（弧度） {x, y, z}
   * @param scale 缩放 {x, y, z}
   * @returns 模型矩阵
   */
  static fromTransform(
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    scale: { x: number; y: number; z: number },
  ): Float32Array {
    let matrix = Mat4.identity();

    // 应用变换：先缩放，再旋转，最后平移 (TRS)
    if (scale.x !== 1 || scale.y !== 1 || scale.z !== 1) {
      matrix = Mat4.multiply(matrix, Mat4.scale(scale.x, scale.y, scale.z));
    }

    if (rotation.x !== 0) {
      matrix = Mat4.multiply(matrix, Mat4.rotateX(rotation.x));
    }
    if (rotation.y !== 0) {
      matrix = Mat4.multiply(matrix, Mat4.rotateY(rotation.y));
    }
    if (rotation.z !== 0) {
      matrix = Mat4.multiply(matrix, Mat4.rotateZ(rotation.z));
    }

    if (position.x !== 0 || position.y !== 0 || position.z !== 0) {
      matrix = Mat4.multiply(
        matrix,
        Mat4.translate(position.x, position.y, position.z),
      );
    }

    return matrix;
  }

  /**
   * 复制矩阵
   * @param m 输入矩阵
   * @returns 复制的矩阵
   */
  static clone(m: Float32Array): Float32Array {
    return new Float32Array(m);
  }
}

/**
 * 3D 向量工具类
 */
export class Vec3 {
  /**
   * 创建向量
   * @param x X 分量
   * @param y Y 分量
   * @param z Z 分量
   * @returns 向量
   */
  static create(x: number, y: number, z: number): Float32Array {
    return new Float32Array([x, y, z]);
  }

  /**
   * 向量归一化
   * @param v 输入向量
   * @returns 归一化后的向量
   */
  static normalize(v: Float32Array): Float32Array {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const len = Math.sqrt(x * x + y * y + z * z);

    if (len > 0) {
      return new Float32Array([x / len, y / len, z / len]);
    }

    return new Float32Array([0, 0, 0]);
  }

  /**
   * 向量点乘
   * @param a 向量 a
   * @param b 向量 b
   * @returns 点积
   */
  static dot(a: Float32Array, b: Float32Array): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * 向量叉乘
   * @param a 向量 a
   * @param b 向量 b
   * @returns 叉积向量
   */
  static cross(a: Float32Array, b: Float32Array): Float32Array {
    const ax = a[0],
      ay = a[1],
      az = a[2];
    const bx = b[0],
      by = b[1],
      bz = b[2];

    return new Float32Array([
      ay * bz - az * by,
      az * bx - ax * bz,
      ax * by - ay * bx,
    ]);
  }

  /**
   * 向量加法
   * @param a 向量 a
   * @param b 向量 b
   * @returns a + b
   */
  static add(a: Float32Array, b: Float32Array): Float32Array {
    return new Float32Array([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
  }

  /**
   * 向量减法
   * @param a 向量 a
   * @param b 向量 b
   * @returns a - b
   */
  static subtract(a: Float32Array, b: Float32Array): Float32Array {
    return new Float32Array([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
  }

  /**
   * 向量标量乘法
   * @param v 向量
   * @param s 标量
   * @returns v * s
   */
  static scale(v: Float32Array, s: number): Float32Array {
    return new Float32Array([v[0] * s, v[1] * s, v[2] * s]);
  }

  /**
   * 计算向量长度
   * @param v 向量
   * @returns 长度
   */
  static magnitude(v: Float32Array): number {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * 计算两向量间距离
   * @param a 向量 a
   * @param b 向量 b
   * @returns 距离
   */
  static distance(a: Float32Array, b: Float32Array): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 向量线性插值
   * @param a 起始向量
   * @param b 结束向量
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
  static lerp(a: Float32Array, b: Float32Array, t: number): Float32Array {
    return new Float32Array([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }

  /**
   * 复制向量
   * @param v 输入向量
   * @returns 复制的向量
   */
  static clone(v: Float32Array): Float32Array {
    return new Float32Array(v);
  }
}

/**
 * 工具函数
 */

/**
 * 角度转弧度
 * @param degrees 角度
 * @returns 弧度
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 弧度转角度
 * @param radians 弧度
 * @returns 角度
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * 限制数值在指定范围内
 * @param value 输入值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 线性插值
 * @param a 起始值
 * @param b 结束值
 * @param t 插值参数 (0-1)
 * @returns 插值结果
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 判断两个数是否近似相等
 * @param a 数值 a
 * @param b 数值 b
 * @param epsilon 误差范围
 * @returns 是否近似相等
 */
export function nearlyEqual(a: number, b: number, epsilon = 0.000001): boolean {
  return Math.abs(a - b) < epsilon;
}
