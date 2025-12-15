/**
 * SceneManager.ts
 *
 * Scene management system:
 * - Layer management (creation, removal, ordering)
 * - Node management (add, remove, find)
 * - Scene graph traversal
 * - Visibility culling
 * - Scene serialization/deserialization
 * - Event system for scene changes
 */

import { Camera } from "./Camera";
import { Layer } from "./Layer";
import { RenderNode } from "./RenderNode";
import type {
  SceneConfig,
  SceneEvent,
  SceneEventType,
  SceneStats,
  PickResult,
  SceneSerializedData,
  LayerData,
  RenderNodeData,
} from "../../types/scene";

/**
 * Event callback type
 */
type EventCallback = (event: SceneEvent) => void;

/**
 * Scene manager configuration
 */
export interface SceneManagerConfig extends SceneConfig {
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * SceneManager class for managing the scene graph
 */
export class SceneManager {
  // Scene configuration
  private config: Required<SceneManagerConfig>;

  // Camera
  private camera: Camera;

  // Layers
  private layers: Map<string, Layer> = new Map();
  private layerOrder: string[] = []; // Ordered list of layer IDs

  // Node registry (for quick lookup)
  private nodeRegistry: Map<string, RenderNode> = new Map();

  // Event system
  private eventListeners: Map<SceneEventType, Set<EventCallback>> = new Map();

  // Stats
  private stats: SceneStats = {
    layerCount: 0,
    nodeCount: 0,
    visibleNodeCount: 0,
    textureCount: 0,
    activeTextureCount: 0,
  };

  // Current time (for animation)
  private currentTime: number = 0;

  /**
   * Create a new SceneManager
   */
  constructor(config: SceneManagerConfig) {
    this.config = {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor ?? "#000000",
      frameRate: config.frameRate ?? 30,
      debug: config.debug ?? false,
    };

    // Create default camera
    this.camera = Camera.create2D(this.config.width, this.config.height);

    if (this.config.debug) {
      console.log("SceneManager created:", this.config);
    }
  }

  // ========== Configuration ==========

  /**
   * Get scene configuration
   */
  getConfig(): SceneConfig {
    return {
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      frameRate: this.config.frameRate,
    };
  }

  /**
   * Update scene dimensions
   */
  setDimensions(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.camera.setViewport(0, 0, width, height);
    this.camera.setOrthographicSize(width, height);
  }

  /**
   * Get scene dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string): void {
    this.config.backgroundColor = color;
  }

  /**
   * Get background color
   */
  getBackgroundColor(): string {
    return this.config.backgroundColor;
  }

  // ========== Camera ==========

  /**
   * Get camera
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Set camera
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  // ========== Layer Management ==========

  /**
   * Create and add a new layer
   */
  createLayer(config?: Partial<LayerData>): Layer {
    const layer = new Layer({
      name: config?.name,
      order: config?.order ?? this.layers.size,
      visible: config?.visible ?? true,
      opacity: config?.opacity ?? 1.0,
      locked: config?.locked ?? false,
      trackId: config?.trackId,
    });

    this.addLayer(layer);
    return layer;
  }

  /**
   * Add an existing layer
   */
  addLayer(layer: Layer): void {
    const id = layer.getId();
    if (this.layers.has(id)) {
      console.warn(`SceneManager: Layer "${id}" already exists`);
      return;
    }

    this.layers.set(id, layer);
    this.layerOrder.push(id);
    this.sortLayers();

    this.stats.layerCount = this.layers.size;
    this.emit("layerAdded", { layerId: id });

    if (this.config.debug) {
      console.log("Layer added:", id);
    }
  }

  /**
   * Remove layer by ID
   */
  removeLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    // Remove all nodes from the layer
    const nodes = layer.getNodes();
    for (const node of nodes) {
      this.unregisterNode(node);
    }

    // Remove layer
    this.layers.delete(layerId);
    const index = this.layerOrder.indexOf(layerId);
    if (index !== -1) {
      this.layerOrder.splice(index, 1);
    }

    this.stats.layerCount = this.layers.size;
    this.emit("layerRemoved", { layerId });

    if (this.config.debug) {
      console.log("Layer removed:", layerId);
    }

    return true;
  }

  /**
   * Get layer by ID
   */
  getLayer(layerId: string): Layer | null {
    return this.layers.get(layerId) ?? null;
  }

  /**
   * Get all layers
   */
  getLayers(): Layer[] {
    return this.layerOrder.map((id) => this.layers.get(id)!);
  }

  /**
   * Get visible layers
   */
  getVisibleLayers(): Layer[] {
    return this.getLayers().filter((layer) => layer.isVisible());
  }

  /**
   * Get layer count
   */
  getLayerCount(): number {
    return this.layers.size;
  }

  /**
   * Reorder layers
   */
  reorderLayers(layerIds: string[]): void {
    // Validate that all IDs exist
    for (const id of layerIds) {
      if (!this.layers.has(id)) {
        console.error(`SceneManager: Cannot reorder, layer "${id}" not found`);
        return;
      }
    }

    this.layerOrder = layerIds;
    this.sortLayers();
    this.emit("layerReordered", {});
  }

  /**
   * Sort layers by order property
   */
  private sortLayers(): void {
    this.layerOrder.sort((a, b) => {
      const layerA = this.layers.get(a)!;
      const layerB = this.layers.get(b)!;
      return layerA.getOrder() - layerB.getOrder();
    });
  }

  /**
   * Move layer up in order
   */
  moveLayerUp(layerId: string): boolean {
    const index = this.layerOrder.indexOf(layerId);
    if (index <= 0) return false;

    [this.layerOrder[index - 1], this.layerOrder[index]] = [
      this.layerOrder[index],
      this.layerOrder[index - 1],
    ];

    this.emit("layerReordered", {});
    return true;
  }

  /**
   * Move layer down in order
   */
  moveLayerDown(layerId: string): boolean {
    const index = this.layerOrder.indexOf(layerId);
    if (index < 0 || index >= this.layerOrder.length - 1) return false;

    [this.layerOrder[index], this.layerOrder[index + 1]] = [
      this.layerOrder[index + 1],
      this.layerOrder[index],
    ];

    this.emit("layerReordered", {});
    return true;
  }

  // ========== Node Management ==========

  /**
   * Add node to a layer
   */
  addNode(node: RenderNode, layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) {
      console.error(`SceneManager: Layer "${layerId}" not found`);
      return false;
    }

    layer.addNode(node);
    this.registerNode(node);

    this.emit("nodeAdded", { nodeId: node.getId(), layerId });

    if (this.config.debug) {
      console.log("Node added:", node.getId(), "to layer:", layerId);
    }

    return true;
  }

  /**
   * Remove node from scene
   */
  removeNode(nodeId: string): boolean {
    const node = this.nodeRegistry.get(nodeId);
    if (!node) return false;

    // Find and remove from layer
    for (const layer of Array.from(this.layers.values())) {
      if (layer.removeNodeById(nodeId)) {
        this.unregisterNode(node);
        this.emit("nodeRemoved", { nodeId });

        if (this.config.debug) {
          console.log("Node removed:", nodeId);
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Register node in registry
   */
  private registerNode(node: RenderNode): void {
    this.nodeRegistry.set(node.getId(), node);
    this.stats.nodeCount = this.nodeRegistry.size;

    // Register children recursively
    for (const child of node.getChildren()) {
      this.registerNode(child);
    }
  }

  /**
   * Unregister node from registry
   */
  private unregisterNode(node: RenderNode): void {
    this.nodeRegistry.delete(node.getId());
    this.stats.nodeCount = this.nodeRegistry.size;

    // Unregister children recursively
    for (const child of node.getChildren()) {
      this.unregisterNode(child);
    }
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): RenderNode | null {
    return this.nodeRegistry.get(nodeId) ?? null;
  }

  /**
   * Get all nodes
   */
  getAllNodes(): RenderNode[] {
    return Array.from(this.nodeRegistry.values());
  }

  /**
   * Get all visible nodes
   */
  getVisibleNodes(): RenderNode[] {
    const visible: RenderNode[] = [];
    for (const layer of this.getVisibleLayers()) {
      visible.push(...layer.getVisibleNodes());
    }
    this.stats.visibleNodeCount = visible.length;
    return visible;
  }

  /**
   * Get nodes at specific time
   */
  getNodesAtTime(time: number): RenderNode[] {
    const nodes: RenderNode[] = [];
    for (const layer of this.getVisibleLayers()) {
      nodes.push(...layer.getNodesAtTime(time));
    }
    return nodes;
  }

  /**
   * Get visible nodes at specific time
   */
  getVisibleNodesAtTime(time: number): RenderNode[] {
    const nodes: RenderNode[] = [];
    for (const layer of this.getVisibleLayers()) {
      nodes.push(...layer.getVisibleNodesAtTime(time));
    }
    this.stats.visibleNodeCount = nodes.length;
    return nodes;
  }

  /**
   * Find nodes by type
   */
  findNodesByType(type: string): RenderNode[] {
    return Array.from(this.nodeRegistry.values()).filter(
      (node) => node.getType() === type,
    );
  }

  /**
   * Find layer containing node
   */
  findLayerByNode(nodeId: string): Layer | null {
    for (const layer of Array.from(this.layers.values())) {
      if (layer.findNodeById(nodeId)) {
        return layer;
      }
    }
    return null;
  }

  // ========== Time Management ==========

  /**
   * Set current time
   */
  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  // ========== Scene Traversal ==========

  /**
   * Update all node world matrices
   */
  updateSceneGraph(): void {
    for (const layer of this.getVisibleLayers()) {
      layer.updateNodeMatrices();
    }
  }

  /**
   * Traverse scene and execute callback on each node
   */
  traverse(callback: (node: RenderNode, layer: Layer) => void): void {
    for (const layer of this.getLayers()) {
      for (const node of layer.getNodes()) {
        callback(node, layer);
        this.traverseNode(node, callback, layer);
      }
    }
  }

  /**
   * Traverse node hierarchy
   */
  private traverseNode(
    node: RenderNode,
    callback: (node: RenderNode, layer: Layer) => void,
    layer: Layer,
  ): void {
    for (const child of node.getChildren()) {
      callback(child, layer);
      this.traverseNode(child, callback, layer);
    }
  }

  // ========== Picking ==========

  /**
   * Pick node at screen coordinates
   */
  pick(screenX: number, screenY: number): PickResult {
    // Convert screen to world coordinates
    const worldPos = this.camera.screenToWorld(screenX, screenY, 0);

    // Check nodes from top layer to bottom
    const layers = this.getVisibleLayers().reverse();

    for (const layer of layers) {
      const nodes = layer.getVisibleNodesAtTime(this.currentTime);

      // Check nodes in reverse order (top to bottom)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const bbox = node.getWorldBoundingBox();

        // Check if point is inside bounding box
        if (
          worldPos.x >= bbox.minX &&
          worldPos.x <= bbox.maxX &&
          worldPos.y >= bbox.minY &&
          worldPos.y <= bbox.maxY
        ) {
          return {
            hit: true,
            nodeId: node.getId(),
            layerId: layer.getId(),
            point: { x: worldPos.x, y: worldPos.y },
            distance: 0,
          };
        }
      }
    }

    return { hit: false };
  }

  /**
   * Pick multiple nodes at screen coordinates
   */
  pickAll(screenX: number, screenY: number): PickResult[] {
    const worldPos = this.camera.screenToWorld(screenX, screenY, 0);
    const results: PickResult[] = [];

    for (const layer of this.getVisibleLayers()) {
      const nodes = layer.getVisibleNodesAtTime(this.currentTime);

      for (const node of nodes) {
        const bbox = node.getWorldBoundingBox();

        if (
          worldPos.x >= bbox.minX &&
          worldPos.x <= bbox.maxX &&
          worldPos.y >= bbox.minY &&
          worldPos.y <= bbox.maxY
        ) {
          results.push({
            hit: true,
            nodeId: node.getId(),
            layerId: layer.getId(),
            point: { x: worldPos.x, y: worldPos.y },
            distance: 0,
          });
        }
      }
    }

    return results;
  }

  // ========== Statistics ==========

  /**
   * Get scene statistics
   */
  getStats(): SceneStats {
    return { ...this.stats };
  }

  /**
   * Update statistics
   */
  updateStats(): void {
    this.stats.layerCount = this.layers.size;
    this.stats.nodeCount = this.nodeRegistry.size;

    // Count visible nodes
    let visibleCount = 0;
    for (const layer of this.getVisibleLayers()) {
      visibleCount += layer.getVisibleNodeCount();
    }
    this.stats.visibleNodeCount = visibleCount;

    // Count textures (would need texture manager integration)
    // This is a placeholder
    this.stats.textureCount = 0;
    this.stats.activeTextureCount = 0;
  }

  // ========== Event System ==========

  /**
   * Register event listener
   */
  on(event: SceneEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: SceneEventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(
    type: SceneEventType,
    data: Partial<Omit<SceneEvent, "type" | "timestamp">>,
  ): void {
    const event: SceneEvent = {
      type,
      timestamp: Date.now(),
      ...data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }

    if (this.config.debug) {
      console.log("Scene event:", event);
    }
  }

  // ========== Serialization ==========

  /**
   * Serialize scene to JSON
   */
  serialize(): SceneSerializedData {
    const layers: LayerData[] = [];
    const nodes: RenderNodeData[] = [];

    // Serialize layers
    for (const layer of this.getLayers()) {
      layers.push(layer.toData());

      // Serialize nodes in layer
      for (const node of layer.getNodes()) {
        nodes.push(node.toData());
      }
    }

    return {
      config: this.getConfig(),
      layers,
      nodes,
      camera: this.camera.toConfig(),
      version: "1.0.0",
    };
  }

  /**
   * Deserialize scene from JSON
   */
  deserialize(data: SceneSerializedData): void {
    // Clear existing scene
    this.clear();

    // Update config
    this.config.width = data.config.width;
    this.config.height = data.config.height;
    this.config.backgroundColor = data.config.backgroundColor ?? "#000000";
    this.config.frameRate = data.config.frameRate ?? 30;

    // Restore camera
    if (data.camera) {
      this.camera = Camera.fromConfig(data.camera, this.camera.getViewport());
    }

    // Restore layers
    const layerMap = new Map<string, Layer>();
    for (const layerData of data.layers) {
      const layer = Layer.fromData(layerData);
      this.addLayer(layer);
      layerMap.set(layer.getId(), layer);
    }

    // Restore nodes
    for (const nodeData of data.nodes) {
      const node = RenderNode.fromData(nodeData);

      // Find the layer for this node (we need to track this in serialization)
      // For now, add to first layer or create a default layer
      if (this.layers.size > 0) {
        const firstLayer = this.getLayers()[0];
        this.addNode(node, firstLayer.getId());
      }
    }

    if (this.config.debug) {
      console.log("Scene deserialized:", data);
    }
  }

  /**
   * Export scene to JSON string
   */
  export(): string {
    return JSON.stringify(this.serialize(), null, 2);
  }

  /**
   * Import scene from JSON string
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json) as SceneSerializedData;
      this.deserialize(data);
    } catch (error) {
      console.error("SceneManager: Failed to import scene:", error);
      throw error;
    }
  }

  // ========== Utilities ==========

  /**
   * Clear all layers and nodes
   */
  clear(): void {
    // Dispose all layers
    for (const layer of Array.from(this.layers.values())) {
      layer.dispose();
    }

    this.layers.clear();
    this.layerOrder = [];
    this.nodeRegistry.clear();

    this.stats.layerCount = 0;
    this.stats.nodeCount = 0;
    this.stats.visibleNodeCount = 0;

    if (this.config.debug) {
      console.log("Scene cleared");
    }
  }

  /**
   * Dispose scene manager
   */
  dispose(): void {
    this.clear();
    this.eventListeners.clear();

    if (this.config.debug) {
      console.log("SceneManager disposed");
    }
  }
}
