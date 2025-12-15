/**
 * SceneBuilder.ts
 *
 * Converts Timeline data to WebGL Scene representation:
 * - Walks timeline tracks and clips
 * - Determines clip visibility at current time
 * - Creates RenderNode instances for visible clips
 * - Maps tracks to scene layers
 * - Sets up transforms, textures, and timing
 */

import type { Track, Clip } from "../../editor/types/timeline";
import type { SceneManager } from "../scene/SceneManager";
import type { Layer } from "../scene/Layer";
import { RenderNode, NodeType } from "../scene/RenderNode";
import { TextTexture } from "../texture/TextTexture";
import type { ShapeTexture } from "../texture/ShapeTexture";
import type { ResourceLoader } from "./ResourceLoader";
import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Scene build configuration
 */
export interface SceneBuildConfig {
  /** Canvas width for coordinate mapping */
  canvasWidth: number;
  /** Canvas height for coordinate mapping */
  canvasHeight: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Scene build result
 */
export interface SceneBuildResult {
  /** Number of tracks processed */
  trackCount: number;
  /** Number of clips processed */
  clipCount: number;
  /** Number of visible clips */
  visibleClipCount: number;
  /** Number of layers created/updated */
  layerCount: number;
  /** Number of nodes created */
  nodeCount: number;
  /** Errors encountered during build */
  errors: string[];
}

/**
 * SceneBuilder class for converting timeline to scene
 */
export class SceneBuilder {
  private sceneManager: SceneManager;
  private resourceLoader: ResourceLoader;
  private contextManager: WebGLContextManager;
  private config: Required<SceneBuildConfig>;

  // Track -> Layer mapping
  private trackLayerMap: Map<string, Layer> = new Map();

  // Clip -> Node mapping (for reuse and updates)
  private clipNodeMap: Map<string, RenderNode> = new Map();

  // Texture cache for text and shape clips (clipId -> texture)
  private textTextureCache: Map<string, TextTexture> = new Map();
  private shapeTextureCache: Map<string, ShapeTexture> = new Map();

  /**
   * Create a new SceneBuilder
   */
  constructor(
    sceneManager: SceneManager,
    resourceLoader: ResourceLoader,
    contextManager: WebGLContextManager,
    config: SceneBuildConfig,
  ) {
    this.sceneManager = sceneManager;
    this.resourceLoader = resourceLoader;
    this.contextManager = contextManager;
    this.config = {
      canvasWidth: config.canvasWidth,
      canvasHeight: config.canvasHeight,
      debug: config.debug ?? false,
    };
  }

  /**
   * Build scene from timeline tracks at given time
   */
  buildScene(tracks: Track[], currentTime: number): SceneBuildResult {
    const result: SceneBuildResult = {
      trackCount: 0,
      clipCount: 0,
      visibleClipCount: 0,
      layerCount: 0,
      nodeCount: 0,
      errors: [],
    };

    if (this.config.debug) {
      console.log(
        `SceneBuilder: Building scene for time ${currentTime}s with ${tracks.length} tracks`,
      );
    }

    // Track active clips to remove old nodes
    const activeClipIds = new Set<string>();

    // Process each track
    for (const track of tracks) {
      result.trackCount++;

      // Skip invisible tracks
      if (!track.visible) {
        if (this.config.debug) {
          console.log(`SceneBuilder: Skipping invisible track ${track.id}`);
        }
        continue;
      }

      // Get or create layer for this track
      let layer = this.trackLayerMap.get(track.id);
      if (!layer) {
        layer = this.createLayerForTrack(track);
        this.trackLayerMap.set(track.id, layer);
        result.layerCount++;
      } else {
        // Update layer properties
        this.updateLayerFromTrack(layer, track);
      }

      // Process clips in this track
      for (const clip of track.clips) {
        result.clipCount++;
        activeClipIds.add(clip.id);

        // Check if clip is visible at current time
        const clipEndTime = clip.startTime + clip.duration;
        const isVisible =
          currentTime >= clip.startTime && currentTime < clipEndTime;

        if (!isVisible) {
          // Remove node if it exists
          this.removeNodeForClip(clip.id, layer);
          continue;
        }

        result.visibleClipCount++;

        // Create or update node for this clip
        try {
          const node = this.createOrUpdateNodeForClip(clip, currentTime);
          if (node) {
            // Ensure node is in the layer
            this.ensureNodeInLayer(node, layer);
            result.nodeCount++;
          }
        } catch (error) {
          const errorMsg = `Failed to create node for clip ${clip.id}: ${error}`;
          result.errors.push(errorMsg);
          if (this.config.debug) {
            console.error(errorMsg);
          }
        }
      }
    }

    // Clean up nodes for clips that no longer exist
    this.cleanupOrphanedNodes(activeClipIds);

    if (this.config.debug) {
      console.log("SceneBuilder: Build complete", result);
    }

    return result;
  }

  /**
   * Create a layer for a track
   */
  private createLayerForTrack(track: Track): Layer {
    const layer = this.sceneManager.createLayer({
      name: track.name,
      order: track.order,
      visible: track.visible,
      opacity: 1.0,
      locked: track.locked,
      trackId: track.id,
    });

    if (this.config.debug) {
      console.log(
        `SceneBuilder: Created layer ${layer.getId()} for track ${track.id}`,
      );
    }

    return layer;
  }

  /**
   * Update layer properties from track
   */
  private updateLayerFromTrack(layer: Layer, track: Track): void {
    layer.setName(track.name);
    layer.setOrder(track.order);
    layer.setVisible(track.visible);
    layer.setLocked(track.locked);
  }

  /**
   * Create or update a RenderNode for a clip
   */
  private createOrUpdateNodeForClip(
    clip: Clip,
    currentTime: number,
  ): RenderNode | null {
    // Map clip type to node type
    const nodeType = this.getNodeTypeForClip(clip);
    if (!nodeType) {
      if (this.config.debug) {
        console.log(
          `SceneBuilder: Unsupported clip type ${clip.type} for clip ${clip.id}`,
        );
      }
      return null;
    }

    // Check if we already have a node for this clip
    let node = this.clipNodeMap.get(clip.id);

    if (node) {
      // Update existing node
      this.updateNodeFromClip(node, clip, currentTime);
      return node;
    }

    // Create new node
    node = new RenderNode({
      id: clip.id,
      type: nodeType,
      visible: true,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      opacity: 1.0,
    });

    // Configure node from clip
    this.updateNodeFromClip(node, clip, currentTime);

    // Store in map
    this.clipNodeMap.set(clip.id, node);

    if (this.config.debug) {
      console.log(
        `SceneBuilder: Created node for clip ${clip.id} (type: ${clip.type})`,
      );
    }

    return node;
  }

  /**
   * Get node type for a clip
   */
  private getNodeTypeForClip(clip: Clip): NodeType | null {
    switch (clip.type) {
      case "video":
        return NodeType.VIDEO;
      case "image":
        return NodeType.IMAGE;
      case "text":
        return NodeType.TEXT;
      case "audio":
        // Audio clips don't have visual representation
        return null;
      default:
        return null;
    }
  }

  /**
   * Update a RenderNode from clip data
   */
  private updateNodeFromClip(
    node: RenderNode,
    clip: Clip,
    currentTime: number,
  ): void {
    // Set transform (common for all types)
    const position = this.clipPositionToWorld(clip.position, clip.scale);
    node.setPosition(position.x, position.y, 0);
    node.setRotation(clip.rotation);
    node.setScale(clip.scale, clip.scale);
    node.setOpacity(clip.opacity);

    // Set timing
    node.setTiming(clip.startTime, clip.duration);
    node.setTrim(clip.trimStart, clip.trimEnd);

    // Set resource source if available
    if (clip.resourceSrc) {
      node.setResourceSrc(clip.resourceSrc);
    }

    // Handle clip-type-specific setup
    switch (clip.type) {
      case "video":
        this.updateVideoNode(node, clip, currentTime);
        break;
      case "image":
        this.updateImageNode(node, clip);
        break;
      case "text":
        this.updateTextNode(node, clip);
        break;
      default:
        if (this.config.debug) {
          console.warn(`SceneBuilder: Unsupported clip type ${clip.type}`);
        }
    }
  }

  /**
   * Update a video node
   */
  private updateVideoNode(
    node: RenderNode,
    clip: Clip,
    currentTime: number,
  ): void {
    node.setShaderName("video");

    // Try to get texture from resource loader
    if (clip.resourceSrc) {
      const texture = this.resourceLoader.getTexture(clip.resourceSrc);
      if (texture) {
        node.setTexture(texture);
        node.setTextureId(clip.resourceSrc);
        node.setSize(texture.width, texture.height);

        // Set custom uniforms for video playback
        const localTime = currentTime - clip.startTime;
        node.setCustomUniforms({
          u_clipTime: localTime,
          u_trimStart: clip.trimStart,
          u_trimEnd: clip.trimEnd,
          u_clipDuration: clip.duration,
        });

        if (this.config.debug) {
          console.log(
            `SceneBuilder: Updated video node ${clip.id}, localTime=${localTime}`,
          );
        }
      } else {
        if (this.config.debug) {
          console.warn(
            `SceneBuilder: Video texture not available for clip ${clip.id}`,
          );
        }
      }
    }
  }

  /**
   * Update an image node
   */
  private updateImageNode(node: RenderNode, clip: Clip): void {
    node.setShaderName("image");

    // For images, we can use ImageTexture from resourceSrc
    // In a full implementation, ResourceLoader should support loading images too
    // For now, we'll log a warning
    if (clip.resourceSrc) {
      if (this.config.debug) {
        console.log(
          `SceneBuilder: Image node ${clip.id} needs ImageTexture from ${clip.resourceSrc}`,
        );
      }
      // TODO: Load ImageTexture via ResourceLoader or TextureManager
      // For now, create a placeholder
      node.setCustomUniforms({
        u_clipTime: 0,
      });
    }
  }

  /**
   * Update a text node
   */
  private updateTextNode(node: RenderNode, clip: Clip): void {
    node.setShaderName("text");

    // Get or create TextTexture for this clip
    let textTexture = this.textTextureCache.get(clip.id);

    // For now, use placeholder text from clip name
    // In a real implementation, clip would have text content properties
    const textContent = (clip as any).textContent || clip.name || "Text";
    const textConfig = (clip as any).textConfig || {
      fontSize: 48,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
    };

    if (!textTexture) {
      // Create new TextTexture
      textTexture = new TextTexture(this.contextManager, {
        text: textContent,
        ...textConfig,
      });
      this.textTextureCache.set(clip.id, textTexture);

      if (this.config.debug) {
        console.log(`SceneBuilder: Created TextTexture for clip ${clip.id}`);
      }
    } else {
      // Update existing texture if text changed
      if (textTexture.getText() !== textContent) {
        textTexture.setText(textContent);
      }
    }

    // Update texture
    textTexture.update();

    // Set texture on node
    node.setTexture(textTexture);
    node.setTextureId(`text_${clip.id}`);
    node.setSize(textTexture.width, textTexture.height);

    node.setCustomUniforms({
      u_clipTime: 0,
    });
  }

  /**
   * Convert clip position to world coordinates
   */
  private clipPositionToWorld(
    position: { x: number; y: number },
    _scale: number,
  ): { x: number; y: number } {
    // Clip position is in normalized coordinates (0-1)
    // Convert to canvas pixel coordinates centered at origin
    const x = (position.x - 0.5) * this.config.canvasWidth;
    const y = (0.5 - position.y) * this.config.canvasHeight; // Flip Y axis

    return { x, y };
  }

  /**
   * Ensure a node is in the specified layer
   */
  private ensureNodeInLayer(node: RenderNode, layer: Layer): void {
    const nodeId = node.getId();

    // Check if node is already in this layer
    const nodesInLayer = layer.getNodes();
    const isInLayer = nodesInLayer.some((n) => n.getId() === nodeId);

    if (!isInLayer) {
      // Remove from all other layers first
      const allLayers = this.sceneManager.getLayers();
      for (const otherLayer of allLayers) {
        if (otherLayer.getId() !== layer.getId()) {
          otherLayer.removeNodeById(nodeId);
        }
      }

      // Add to target layer
      layer.addNode(node);

      if (this.config.debug) {
        console.log(
          `SceneBuilder: Added node ${nodeId} to layer ${layer.getId()}`,
        );
      }
    }
  }

  /**
   * Remove node for a clip from a layer
   */
  private removeNodeForClip(clipId: string, layer: Layer): void {
    const node = this.clipNodeMap.get(clipId);
    if (node) {
      layer.removeNodeById(clipId);

      if (this.config.debug) {
        console.log(
          `SceneBuilder: Removed node ${clipId} from layer ${layer.getId()}`,
        );
      }
    }
  }

  /**
   * Clean up nodes for clips that no longer exist
   */
  private cleanupOrphanedNodes(activeClipIds: Set<string>): void {
    const orphanedIds: string[] = [];

    for (const [clipId, node] of this.clipNodeMap.entries()) {
      if (!activeClipIds.has(clipId)) {
        orphanedIds.push(clipId);
      }
    }

    for (const clipId of orphanedIds) {
      const _node = this.clipNodeMap.get(clipId);
      if (_node) {
        // Remove from all layers
        const allLayers = this.sceneManager.getLayers();
        for (const layer of allLayers) {
          layer.removeNodeById(clipId);
        }

        // Dispose node
        _node.dispose();

        // Remove from map
        this.clipNodeMap.delete(clipId);

        if (this.config.debug) {
          console.log(`SceneBuilder: Cleaned up orphaned node ${clipId}`);
        }
      }
    }
  }

  /**
   * Clear all scene content
   */
  clear(): void {
    // Remove all nodes
    for (const [clipId, node] of this.clipNodeMap.entries()) {
      node.dispose();
    }
    this.clipNodeMap.clear();

    // Dispose cached textures
    for (const [_clipId, texture] of this.textTextureCache.entries()) {
      texture.dispose();
    }
    this.textTextureCache.clear();

    for (const [_clipId, texture] of this.shapeTextureCache.entries()) {
      texture.dispose();
    }
    this.shapeTextureCache.clear();

    // Clear layer map
    this.trackLayerMap.clear();

    // Clear scene manager
    this.sceneManager.clear();

    if (this.config.debug) {
      console.log("SceneBuilder: Cleared all scene content");
    }
  }

  /**
   * Get layer for a track ID
   */
  getLayerForTrack(trackId: string): Layer | undefined {
    return this.trackLayerMap.get(trackId);
  }

  /**
   * Get node for a clip ID
   */
  getNodeForClip(clipId: string): RenderNode | undefined {
    return this.clipNodeMap.get(clipId);
  }

  /**
   * Get all active clip IDs
   */
  getActiveClipIds(): string[] {
    return Array.from(this.clipNodeMap.keys());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      trackLayerCount: this.trackLayerMap.size,
      clipNodeCount: this.clipNodeMap.size,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SceneBuildConfig>): void {
    if (config.canvasWidth !== undefined) {
      this.config.canvasWidth = config.canvasWidth;
    }
    if (config.canvasHeight !== undefined) {
      this.config.canvasHeight = config.canvasHeight;
    }
    if (config.debug !== undefined) {
      this.config.debug = config.debug;
    }
  }

  /**
   * Dispose the scene builder
   */
  dispose(): void {
    this.clear();

    if (this.config.debug) {
      console.log("SceneBuilder: Disposed");
    }
  }

  /**
   * Get cached texture for a clip (for debugging/testing)
   */
  getCachedTexture(clipId: string): TextTexture | ShapeTexture | null {
    return (
      this.textTextureCache.get(clipId) ||
      this.shapeTextureCache.get(clipId) ||
      null
    );
  }
}
