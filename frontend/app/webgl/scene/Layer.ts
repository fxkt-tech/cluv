/**
 * Layer.ts
 *
 * Layer system for organizing render nodes:
 * - Z-order management (layer ordering)
 * - Visibility control for groups of nodes
 * - Opacity inheritance
 * - Node collection management
 */

import type { RenderNode } from "./RenderNode";
import type { LayerData } from "../../types/scene";

/**
 * Layer configuration
 */
export interface LayerConfig {
  id?: string;
  name?: string;
  order?: number;
  visible?: boolean;
  opacity?: number;
  locked?: boolean;
  trackId?: string;
}

/**
 * Layer class for organizing render nodes
 */
export class Layer {
  // Identification
  private id: string;
  private name: string;
  private trackId: string;

  // Ordering
  private order: number;

  // Visibility
  private visible: boolean = true;
  private opacity: number = 1.0;
  private locked: boolean = false;

  // Nodes
  private nodes: RenderNode[] = [];

  /**
   * Create a new Layer
   */
  constructor(config: LayerConfig = {}) {
    this.id = config.id ?? this.generateId();
    this.name = config.name ?? `Layer ${this.id}`;
    this.trackId = config.trackId ?? "";
    this.order = config.order ?? 0;
    this.visible = config.visible ?? true;
    this.opacity = config.opacity ?? 1.0;
    this.locked = config.locked ?? false;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get layer ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Set layer name
   */
  setName(name: string): void {
    this.name = name;
  }

  /**
   * Get layer name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set track ID
   */
  setTrackId(trackId: string): void {
    this.trackId = trackId;
  }

  /**
   * Get track ID
   */
  getTrackId(): string {
    return this.trackId;
  }

  /**
   * Set layer order (z-index)
   */
  setOrder(order: number): void {
    this.order = order;
  }

  /**
   * Get layer order
   */
  getOrder(): number {
    return this.order;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Get visibility
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Set opacity
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Get opacity
   */
  getOpacity(): number {
    return this.opacity;
  }

  /**
   * Set locked state
   */
  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  /**
   * Get locked state
   */
  isLocked(): boolean {
    return this.locked;
  }

  // ========== Node Management ==========

  /**
   * Add a render node to this layer
   */
  addNode(node: RenderNode): void {
    if (!this.nodes.includes(node)) {
      this.nodes.push(node);
    }
  }

  /**
   * Remove a render node from this layer
   */
  removeNode(node: RenderNode): void {
    const index = this.nodes.indexOf(node);
    if (index !== -1) {
      this.nodes.splice(index, 1);
    }
  }

  /**
   * Remove node by ID
   */
  removeNodeById(nodeId: string): boolean {
    const index = this.nodes.findIndex((n) => n.getId() === nodeId);
    if (index !== -1) {
      this.nodes.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all nodes in this layer
   */
  getNodes(): RenderNode[] {
    return [...this.nodes];
  }

  /**
   * Get visible nodes in this layer
   */
  getVisibleNodes(): RenderNode[] {
    if (!this.visible) return [];
    return this.nodes.filter((node) => node.isVisible());
  }

  /**
   * Get nodes active at a specific time
   */
  getNodesAtTime(time: number): RenderNode[] {
    return this.nodes.filter((node) => node.isActiveAt(time));
  }

  /**
   * Get visible nodes at a specific time
   */
  getVisibleNodesAtTime(time: number): RenderNode[] {
    if (!this.visible) return [];
    return this.nodes.filter(
      (node) => node.isVisible() && node.isActiveAt(time),
    );
  }

  /**
   * Find node by ID
   */
  findNodeById(nodeId: string): RenderNode | null {
    return this.nodes.find((n) => n.getId() === nodeId) ?? null;
  }

  /**
   * Check if layer contains node
   */
  hasNode(node: RenderNode): boolean {
    return this.nodes.includes(node);
  }

  /**
   * Get node count
   */
  getNodeCount(): number {
    return this.nodes.length;
  }

  /**
   * Get visible node count
   */
  getVisibleNodeCount(): number {
    if (!this.visible) return 0;
    return this.nodes.filter((node) => node.isVisible()).length;
  }

  /**
   * Clear all nodes
   */
  clear(): void {
    this.nodes = [];
  }

  /**
   * Sort nodes by a custom comparator
   */
  sortNodes(compareFn: (a: RenderNode, b: RenderNode) => number): void {
    this.nodes.sort(compareFn);
  }

  /**
   * Sort nodes by z-position
   */
  sortByZ(): void {
    this.sortNodes((a, b) => {
      const posA = a.getPosition();
      const posB = b.getPosition();
      return posA.z - posB.z;
    });
  }

  // ========== Batch Operations ==========

  /**
   * Update all node world matrices
   */
  updateNodeMatrices(): void {
    for (const node of this.nodes) {
      node.updateWorldMatrix();
    }
  }

  /**
   * Set visibility for all nodes
   */
  setNodesVisible(visible: boolean): void {
    for (const node of this.nodes) {
      node.setVisible(visible);
    }
  }

  /**
   * Set opacity for all nodes
   */
  setNodesOpacity(opacity: number): void {
    for (const node of this.nodes) {
      node.setOpacity(opacity);
    }
  }

  // ========== Serialization ==========

  /**
   * Convert to LayerData
   */
  toData(): LayerData {
    return {
      id: this.id,
      trackId: this.trackId,
      order: this.order,
      visible: this.visible,
      opacity: this.opacity,
      name: this.name,
      locked: this.locked,
    };
  }

  /**
   * Create layer from LayerData
   */
  static fromData(data: LayerData): Layer {
    return new Layer({
      id: data.id,
      name: data.name,
      trackId: data.trackId,
      order: data.order,
      visible: data.visible,
      opacity: data.opacity,
      locked: data.locked,
    });
  }

  /**
   * Clone this layer (without nodes)
   */
  clone(): Layer {
    return new Layer({
      name: `${this.name} (Copy)`,
      trackId: this.trackId,
      order: this.order,
      visible: this.visible,
      opacity: this.opacity,
      locked: this.locked,
    });
  }

  /**
   * Clone this layer with all nodes
   */
  cloneWithNodes(): Layer {
    const layer = this.clone();
    for (const node of this.nodes) {
      layer.addNode(node.clone());
    }
    return layer;
  }

  /**
   * Dispose layer and all nodes
   */
  dispose(): void {
    // Dispose all nodes
    for (const node of [...this.nodes]) {
      node.dispose();
    }
    this.nodes = [];
  }
}
