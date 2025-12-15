/**
 * ShaderProgram.ts
 *
 * WebGL shader program wrapper that manages:
 * - Shader compilation and linking
 * - Uniform and attribute locations
 * - Program binding and state
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import { createShader, createProgram } from "../utils/webgl-utils";

/**
 * Uniform value types supported by WebGL
 */
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | Int32Array
  | boolean;

/**
 * Uniform setter function type
 */
export type UniformSetter = (value: UniformValue) => void;

/**
 * Shader program configuration
 */
export interface ShaderProgramConfig {
  vertexSource: string;
  fragmentSource: string;
  attributes?: string[];
  uniforms?: string[];
}

/**
 * Shader program wrapper class
 */
export class ShaderProgram {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;

  // Cached locations
  private attributeLocations = new Map<string, number>();
  private uniformLocations = new Map<string, WebGLUniformLocation | null>();
  private uniformSetters = new Map<string, UniformSetter>();

  private isCompiled = false;
  private lastError: string | null = null;

  constructor(
    private contextWrapper: WebGLContextManager,
    private config: ShaderProgramConfig,
  ) {
    const context = contextWrapper.getContext();
    if (!context) {
      throw new Error("ShaderProgram: WebGL context is not available");
    }
    this.gl = context;
  }

  /**
   * Compile and link the shader program
   */
  compile(): boolean {
    if (this.isCompiled) {
      console.warn("ShaderProgram: Already compiled");
      return true;
    }

    try {
      // Create vertex shader
      this.vertexShader = createShader(
        this.gl,
        this.gl.VERTEX_SHADER,
        this.config.vertexSource,
      );
      if (!this.vertexShader) {
        this.lastError = "Failed to create vertex shader";
        return false;
      }

      // Create fragment shader
      this.fragmentShader = createShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.config.fragmentSource,
      );
      if (!this.fragmentShader) {
        this.lastError = "Failed to create fragment shader";
        this.cleanup();
        return false;
      }

      // Create program
      this.program = createProgram(
        this.gl,
        this.vertexShader,
        this.fragmentShader,
      );
      if (!this.program) {
        this.lastError = "Failed to create shader program";
        this.cleanup();
        return false;
      }

      // Cache attribute locations
      if (this.config.attributes) {
        for (const attrName of this.config.attributes) {
          const location = this.gl.getAttribLocation(this.program, attrName);
          if (location >= 0) {
            this.attributeLocations.set(attrName, location);
          } else {
            console.warn(`ShaderProgram: Attribute "${attrName}" not found`);
          }
        }
      }

      // Cache uniform locations and setters
      if (this.config.uniforms) {
        for (const uniformName of this.config.uniforms) {
          const location = this.gl.getUniformLocation(
            this.program,
            uniformName,
          );
          this.uniformLocations.set(uniformName, location);

          if (location) {
            this.uniformSetters.set(
              uniformName,
              this.createUniformSetter(uniformName, location),
            );
          } else {
            console.warn(`ShaderProgram: Uniform "${uniformName}" not found`);
          }
        }
      }

      this.isCompiled = true;
      this.lastError = null;
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "Unknown error";
      console.error("ShaderProgram: Compilation failed:", this.lastError);
      this.cleanup();
      return false;
    }
  }

  /**
   * Use this shader program for rendering
   */
  use(): void {
    if (!this.isCompiled || !this.program) {
      throw new Error("ShaderProgram: Cannot use program before compilation");
    }
    this.gl.useProgram(this.program);
  }

  /**
   * Get attribute location by name
   */
  getAttributeLocation(name: string): number {
    const location = this.attributeLocations.get(name);
    if (location === undefined) {
      if (!this.program) {
        return -1;
      }
      const loc = this.gl.getAttribLocation(this.program, name);
      this.attributeLocations.set(name, loc);
      return loc;
    }
    return location;
  }

  /**
   * Get uniform location by name
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    const location = this.uniformLocations.get(name);
    if (location === undefined) {
      if (!this.program) {
        return null;
      }
      const loc = this.gl.getUniformLocation(this.program, name);
      this.uniformLocations.set(name, loc);
      return loc;
    }
    return location;
  }

  /**
   * Set uniform value
   */
  setUniform(name: string, value: UniformValue): void {
    const setter = this.uniformSetters.get(name);
    if (setter) {
      setter(value);
    } else {
      // Fallback: create setter on-the-fly
      const location = this.getUniformLocation(name);
      if (location) {
        const newSetter = this.createUniformSetter(name, location);
        this.uniformSetters.set(name, newSetter);
        newSetter(value);
      } else {
        console.warn(`ShaderProgram: Uniform "${name}" not found`);
      }
    }
  }

  /**
   * Set multiple uniforms at once
   */
  setUniforms(uniforms: Record<string, UniformValue>): void {
    for (const [name, value] of Object.entries(uniforms)) {
      this.setUniform(name, value);
    }
  }

  /**
   * Enable vertex attribute array
   */
  enableAttribute(name: string): void {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.enableVertexAttribArray(location);
    }
  }

  /**
   * Disable vertex attribute array
   */
  disableAttribute(name: string): void {
    const location = this.getAttributeLocation(name);
    if (location >= 0) {
      this.gl.disableVertexAttribArray(location);
    }
  }

  /**
   * Get the underlying WebGL program
   */
  getProgram(): WebGLProgram | null {
    return this.program;
  }

  /**
   * Check if program is compiled
   */
  isReady(): boolean {
    return this.isCompiled && this.program !== null;
  }

  /**
   * Get last error message
   */
  getError(): string | null {
    return this.lastError;
  }

  /**
   * Check if uniform exists
   */
  hasUniform(name: string): boolean {
    return this.uniformLocations.has(name);
  }

  /**
   * Dispose of shader resources
   */
  dispose(): void {
    this.cleanup();
    this.attributeLocations.clear();
    this.uniformLocations.clear();
    this.uniformSetters.clear();
    this.isCompiled = false;
  }

  /**
   * Create a uniform setter function based on the uniform type
   */
  private createUniformSetter(
    name: string,
    location: WebGLUniformLocation,
  ): UniformSetter {
    // Query uniform info to determine type
    if (!this.program) {
      return () => {};
    }

    // Find uniform index
    const numUniforms = this.gl.getProgramParameter(
      this.program,
      this.gl.ACTIVE_UNIFORMS,
    );
    let uniformInfo: WebGLActiveInfo | null = null;

    for (let i = 0; i < numUniforms; i++) {
      const info = this.gl.getActiveUniform(this.program, i);
      if (info && info.name === name) {
        uniformInfo = info;
        break;
      }
    }

    if (!uniformInfo) {
      console.warn(`ShaderProgram: Could not find uniform info for "${name}"`);
      return () => {};
    }

    const gl = this.gl;
    const type = uniformInfo.type;

    // Return appropriate setter based on type
    switch (type) {
      case gl.FLOAT:
        return (value: UniformValue) => {
          gl.uniform1f(location, value as number);
        };
      case gl.FLOAT_VEC2:
        return (value: UniformValue) => {
          const v = value as number[] | Float32Array;
          gl.uniform2fv(location, v);
        };
      case gl.FLOAT_VEC3:
        return (value: UniformValue) => {
          const v = value as number[] | Float32Array;
          gl.uniform3fv(location, v);
        };
      case gl.FLOAT_VEC4:
        return (value: UniformValue) => {
          const v = value as number[] | Float32Array;
          gl.uniform4fv(location, v);
        };
      case gl.INT:
      case gl.BOOL:
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
        return (value: UniformValue) => {
          gl.uniform1i(location, value as number);
        };
      case gl.INT_VEC2:
      case gl.BOOL_VEC2:
        return (value: UniformValue) => {
          const v = value as number[] | Int32Array;
          gl.uniform2iv(location, v);
        };
      case gl.INT_VEC3:
      case gl.BOOL_VEC3:
        return (value: UniformValue) => {
          const v = value as number[] | Int32Array;
          gl.uniform3iv(location, v);
        };
      case gl.INT_VEC4:
      case gl.BOOL_VEC4:
        return (value: UniformValue) => {
          const v = value as number[] | Int32Array;
          gl.uniform4iv(location, v);
        };
      case gl.FLOAT_MAT2:
        return (value: UniformValue) => {
          gl.uniformMatrix2fv(location, false, value as Float32Array);
        };
      case gl.FLOAT_MAT3:
        return (value: UniformValue) => {
          gl.uniformMatrix3fv(location, false, value as Float32Array);
        };
      case gl.FLOAT_MAT4:
        return (value: UniformValue) => {
          gl.uniformMatrix4fv(location, false, value as Float32Array);
        };
      default:
        console.warn(
          `ShaderProgram: Unknown uniform type ${type} for "${name}"`,
        );
        return () => {};
    }
  }

  /**
   * Clean up shader and program resources
   */
  private cleanup(): void {
    if (this.vertexShader) {
      this.gl.deleteShader(this.vertexShader);
      this.vertexShader = null;
    }
    if (this.fragmentShader) {
      this.gl.deleteShader(this.fragmentShader);
      this.fragmentShader = null;
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }
}
