/**
 * Shader module exports
 *
 * Provides shader management and built-in shader definitions
 */

export {
  ShaderProgram,
  type ShaderProgramConfig,
  type UniformValue,
  type UniformSetter,
} from "./ShaderProgram";
export { ShaderManager, type ShaderDefinition } from "./ShaderManager";

/**
 * Built-in shader source code
 */

// Base vertex shader
const BASE_VERTEX_SHADER = `// base.vert.glsl
// Basic vertex shader for 2D quad rendering

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

varying vec2 v_texCoord;

void main() {
  // Transform vertex position
  gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);

  // Pass texture coordinates to fragment shader
  v_texCoord = a_texCoord;
}
`;

// Base fragment shader
const BASE_FRAGMENT_SHADER = `// base.frag.glsl
// Basic fragment shader for textured 2D rendering

precision mediump float;

varying vec2 v_texCoord;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform vec4 u_tintColor;

void main() {
  // Sample texture
  vec4 texColor = texture2D(u_texture, v_texCoord);

  // Apply tint color (multiply)
  texColor *= u_tintColor;

  // Apply opacity
  texColor.a *= u_opacity;

  gl_FragColor = texColor;
}
`;

// Video vertex shader
const VIDEO_VERTEX_SHADER = `// video.vert.glsl
// Vertex shader for video texture rendering with advanced transforms

attribute vec3 a_position;
attribute vec2 a_texCoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

// Video-specific transforms
uniform mat3 u_texCoordMatrix;  // For video texture coordinate transformation
uniform vec2 u_texCoordOffset;   // Texture coordinate offset
uniform vec2 u_texCoordScale;    // Texture coordinate scale

varying vec2 v_texCoord;
varying vec2 v_position;

void main() {
  // Transform vertex position
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  vec4 viewPosition = u_viewMatrix * worldPosition;
  gl_Position = u_projectionMatrix * viewPosition;

  // Apply texture coordinate transformations
  // First apply matrix transform (for rotation, flip, etc.)
  vec3 transformedCoord = u_texCoordMatrix * vec3(a_texCoord, 1.0);

  // Then apply scale and offset
  vec2 finalTexCoord = transformedCoord.xy * u_texCoordScale + u_texCoordOffset;

  v_texCoord = finalTexCoord;
  v_position = a_position.xy;
}
`;

// Video fragment shader
const VIDEO_FRAGMENT_SHADER = `// video.frag.glsl
// Fragment shader for video texture rendering with color adjustments and effects

precision mediump float;

varying vec2 v_texCoord;
varying vec2 v_position;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform vec4 u_tintColor;

// Trim support (for video trimming)
uniform float u_trimStart;    // Trim start time in seconds
uniform float u_trimEnd;      // Trim end time in seconds
uniform float u_clipTime;     // Current time within the clip (0 to clip duration)
uniform float u_clipDuration; // Total duration of the clip

// Color adjustments
uniform float u_brightness;  // -1.0 to 1.0
uniform float u_contrast;    // 0.0 to 2.0 (1.0 = normal)
uniform float u_saturation;  // 0.0 to 2.0 (1.0 = normal)
uniform float u_hue;         // -180.0 to 180.0 degrees

// Chroma key (green screen)
uniform bool u_useChromaKey;
uniform vec3 u_chromaKeyColor;
uniform float u_chromaKeyThreshold;
uniform float u_chromaKeySmoothness;

// Helper: RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Helper: HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Helper: Apply brightness adjustment
vec3 applyBrightness(vec3 color, float brightness) {
  return color + brightness;
}

// Helper: Apply contrast adjustment
vec3 applyContrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

// Helper: Apply saturation adjustment
vec3 applySaturation(vec3 color, float saturation) {
  vec3 hsv = rgb2hsv(color);
  hsv.y *= saturation;
  return hsv2rgb(hsv);
}

// Helper: Apply hue shift
vec3 applyHue(vec3 color, float hueShift) {
  vec3 hsv = rgb2hsv(color);
  hsv.x += hueShift / 360.0;
  hsv.x = fract(hsv.x); // Wrap around
  return hsv2rgb(hsv);
}

// Helper: Chroma key (green screen removal)
float chromaKey(vec3 color, vec3 keyColor, float threshold, float smoothness) {
  float dist = distance(color, keyColor);
  return smoothstep(threshold, threshold + smoothness, dist);
}

void main() {
  // Calculate the actual video time based on trim and clip time
  // If trim is used, we need to sample the video at (trimStart + clipTime)
  // normalized to the trimmed range
  float trimmedDuration = u_trimEnd - u_trimStart;
  float videoProgress = 0.0;

  if (trimmedDuration > 0.0) {
    // Normalized progress through the clip (0.0 to 1.0)
    videoProgress = clamp(u_clipTime / u_clipDuration, 0.0, 1.0);

    // Map to the trimmed region of the video
    // Note: The actual video time sampling is handled by updating the video element's
    // currentTime in the application layer. This shader just ensures proper UV mapping.
  }

  // Sample texture with original UV coordinates
  // The video texture itself should already be at the correct frame
  // based on trim timing managed by the application
  vec4 texColor = texture2D(u_texture, v_texCoord);

  // Early exit for fully transparent pixels
  if (texColor.a < 0.001) {
    discard;
  }

  vec3 color = texColor.rgb;

  // Apply color adjustments
  color = applyBrightness(color, u_brightness);
  color = applyContrast(color, u_contrast);
  color = applySaturation(color, u_saturation);

  if (abs(u_hue) > 0.1) {
    color = applyHue(color, u_hue);
  }

  // Clamp color values
  color = clamp(color, 0.0, 1.0);

  // Apply tint color (multiply)
  color *= u_tintColor.rgb;

  // Apply chroma key if enabled
  float alpha = texColor.a;
  if (u_useChromaKey) {
    float keyAlpha = chromaKey(color, u_chromaKeyColor, u_chromaKeyThreshold, u_chromaKeySmoothness);
    alpha *= keyAlpha;
  }

  // Apply opacity
  alpha *= u_opacity * u_tintColor.a;

  // Output final color
  gl_FragColor = vec4(color, alpha);
}
`;

/**
 * Built-in shader definitions
 */
export const BUILTIN_SHADERS = {
  BASE: {
    name: "base",
    vertexSource: BASE_VERTEX_SHADER,
    fragmentSource: BASE_FRAGMENT_SHADER,
    attributes: ["a_position", "a_texCoord"],
    uniforms: [
      "u_modelMatrix",
      "u_viewMatrix",
      "u_projectionMatrix",
      "u_texture",
      "u_opacity",
      "u_tintColor",
    ],
  },
  VIDEO: {
    name: "video",
    vertexSource: VIDEO_VERTEX_SHADER,
    fragmentSource: VIDEO_FRAGMENT_SHADER,
    attributes: ["a_position", "a_texCoord"],
    uniforms: [
      "u_modelMatrix",
      "u_viewMatrix",
      "u_projectionMatrix",
      "u_texture",
      "u_opacity",
      "u_tintColor",
      "u_texCoordMatrix",
      "u_texCoordOffset",
      "u_texCoordScale",
      "u_trimStart",
      "u_trimEnd",
      "u_clipTime",
      "u_clipDuration",
      "u_brightness",
      "u_contrast",
      "u_saturation",
      "u_hue",
      "u_useChromaKey",
      "u_chromaKeyColor",
      "u_chromaKeyThreshold",
      "u_chromaKeySmoothness",
    ],
  },
} as const;

/**
 * Shader source strings for direct usage
 */
export const SHADER_SOURCES = {
  BASE_VERTEX: BASE_VERTEX_SHADER,
  BASE_FRAGMENT: BASE_FRAGMENT_SHADER,
  VIDEO_VERTEX: VIDEO_VERTEX_SHADER,
  VIDEO_FRAGMENT: VIDEO_FRAGMENT_SHADER,
} as const;
