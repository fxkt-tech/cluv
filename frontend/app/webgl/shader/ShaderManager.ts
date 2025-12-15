/**
 * ShaderManager.ts
 *
 * Centralized manager for shader programs:
 * - Load and cache shader programs
 * - Manage shader lifecycle
 * - Provide shader registry
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import { ShaderProgram, type ShaderProgramConfig } from "./ShaderProgram";

/**
 * Shader definition for registration
 */
export interface ShaderDefinition {
  name: string;
  vertexSource: string;
  fragmentSource: string;
  attributes?: string[];
  uniforms?: string[];
}

/**
 * Shader manager class
 */
export class ShaderManager {
  private shaders = new Map<string, ShaderProgram>();
  private definitions = new Map<string, ShaderDefinition>();

  constructor(private contextWrapper: WebGLContextManager) {}

  /**
   * Register a shader definition
   */
  register(definition: ShaderDefinition): void {
    if (this.definitions.has(definition.name)) {
      console.warn(
        `ShaderManager: Shader "${definition.name}" already registered, overwriting`,
      );
    }
    this.definitions.set(definition.name, definition);
  }

  /**
   * Register multiple shader definitions
   */
  registerAll(definitions: ShaderDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /**
   * Get a shader program by name (compiles if needed)
   */
  get(name: string): ShaderProgram | null {
    // Return cached shader if available
    if (this.shaders.has(name)) {
      return this.shaders.get(name)!;
    }

    // Get definition
    const definition = this.definitions.get(name);
    if (!definition) {
      console.error(`ShaderManager: Shader "${name}" not found in registry`);
      return null;
    }

    // Create and compile shader
    const shader = this.createShader(definition);
    if (!shader) {
      console.error(`ShaderManager: Failed to create shader "${name}"`);
      return null;
    }

    // Cache and return
    this.shaders.set(name, shader);
    return shader;
  }

  /**
   * Create a shader program from a definition
   */
  private createShader(definition: ShaderDefinition): ShaderProgram | null {
    const config: ShaderProgramConfig = {
      vertexSource: definition.vertexSource,
      fragmentSource: definition.fragmentSource,
      attributes: definition.attributes,
      uniforms: definition.uniforms,
    };

    const shader = new ShaderProgram(this.contextWrapper, config);

    if (!shader.compile()) {
      console.error(
        `ShaderManager: Failed to compile shader "${definition.name}":`,
        shader.getError(),
      );
      shader.dispose();
      return null;
    }

    return shader;
  }

  /**
   * Create a shader program directly without registration
   */
  createDirect(config: ShaderProgramConfig): ShaderProgram | null {
    const shader = new ShaderProgram(this.contextWrapper, config);

    if (!shader.compile()) {
      console.error(
        "ShaderManager: Failed to compile direct shader:",
        shader.getError(),
      );
      shader.dispose();
      return null;
    }

    return shader;
  }

  /**
   * Check if a shader is registered
   */
  has(name: string): boolean {
    return this.definitions.has(name);
  }

  /**
   * Check if a shader is loaded (compiled and cached)
   */
  isLoaded(name: string): boolean {
    return this.shaders.has(name);
  }

  /**
   * Get all registered shader names
   */
  getRegisteredShaders(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all loaded shader names
   */
  getLoadedShaders(): string[] {
    return Array.from(this.shaders.keys());
  }

  /**
   * Unload a shader program (remove from cache)
   */
  unload(name: string): void {
    const shader = this.shaders.get(name);
    if (shader) {
      shader.dispose();
      this.shaders.delete(name);
    }
  }

  /**
   * Unregister a shader definition
   */
  unregister(name: string): void {
    this.unload(name);
    this.definitions.delete(name);
  }

  /**
   * Reload a shader (recompile from definition)
   */
  reload(name: string): ShaderProgram | null {
    this.unload(name);
    return this.get(name);
  }

  /**
   * Reload all loaded shaders
   */
  reloadAll(): void {
    const loadedNames = Array.from(this.shaders.keys());
    for (const name of loadedNames) {
      this.reload(name);
    }
  }

  /**
   * Dispose of a specific shader
   */
  dispose(name: string): void {
    this.unload(name);
  }

  /**
   * Dispose of all shaders
   */
  disposeAll(): void {
    for (const shader of this.shaders.values()) {
      shader.dispose();
    }
    this.shaders.clear();
  }

  /**
   * Clear all registrations and cached shaders
   */
  clear(): void {
    this.disposeAll();
    this.definitions.clear();
  }
}
