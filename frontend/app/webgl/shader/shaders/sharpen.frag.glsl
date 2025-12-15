// sharpen.frag.glsl
// Sharpen fragment shader using convolution kernel

precision mediump float;

varying vec2 v_texCoord;
varying vec2 v_position;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform vec4 u_tintColor;

// Sharpen parameters
uniform float u_sharpenAmount;
uniform vec2 u_textureSize; // Texture dimensions in pixels

void main() {
  // If sharpen amount is 0 or very small, just sample directly
  if (u_sharpenAmount < 0.01) {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    texColor *= u_tintColor;
    texColor.a *= u_opacity;
    gl_FragColor = texColor;
    return;
  }

  // Calculate texel size
  vec2 texelSize = 1.0 / u_textureSize;

  // Sample the 3x3 kernel
  vec4 center = texture2D(u_texture, v_texCoord);
  vec4 top = texture2D(u_texture, v_texCoord + vec2(0.0, texelSize.y));
  vec4 bottom = texture2D(u_texture, v_texCoord - vec2(0.0, texelSize.y));
  vec4 left = texture2D(u_texture, v_texCoord - vec2(texelSize.x, 0.0));
  vec4 right = texture2D(u_texture, v_texCoord + vec2(texelSize.x, 0.0));

  // Sharpen kernel (approximation)
  // Center weight increases with amount
  float centerWeight = 1.0 + 4.0 * u_sharpenAmount;
  float edgeWeight = -u_sharpenAmount;

  vec4 color = center * centerWeight +
               (top + bottom + left + right) * edgeWeight;

  // Clamp to valid range
  color = clamp(color, 0.0, 1.0);

  // Apply tint and opacity
  color *= u_tintColor;
  color.a = center.a * u_opacity; // Preserve original alpha structure

  gl_FragColor = color;
}
