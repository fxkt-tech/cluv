// blur.frag.glsl
// Gaussian blur fragment shader

precision mediump float;

varying vec2 v_texCoord;
varying vec2 v_position;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform vec4 u_tintColor;

// Blur parameters
uniform float u_blurRadius;
uniform vec2 u_textureSize; // Texture dimensions in pixels

// Helper function: Gaussian weight
float gaussian(float x, float sigma) {
  return exp(-(x * x) / (2.0 * sigma * sigma)) / (sigma * sqrt(2.0 * 3.14159265359));
}

void main() {
  // If blur radius is 0 or very small, just sample directly
  if (u_blurRadius < 0.5) {
    vec4 texColor = texture2D(u_texture, v_texCoord);
    texColor *= u_tintColor;
    texColor.a *= u_opacity;
    gl_FragColor = texColor;
    return;
  }

  // Calculate texel size
  vec2 texelSize = 1.0 / u_textureSize;

  // Simple box blur for performance
  // In production, you might want to do this in two passes (horizontal + vertical)
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  // Sample radius in pixels
  int radius = int(u_blurRadius);
  float sigma = u_blurRadius / 2.0;

  // Sample surrounding pixels
  for (int x = -8; x <= 8; x++) {
    for (int y = -8; y <= 8; y++) {
      if (abs(float(x)) > u_blurRadius || abs(float(y)) > u_blurRadius) {
        continue;
      }

      vec2 offset = vec2(float(x), float(y)) * texelSize;
      float weight = gaussian(length(vec2(float(x), float(y))), sigma);

      color += texture2D(u_texture, v_texCoord + offset) * weight;
      totalWeight += weight;
    }
  }

  // Normalize
  if (totalWeight > 0.0) {
    color /= totalWeight;
  }

  // Apply tint and opacity
  color *= u_tintColor;
  color.a *= u_opacity;

  gl_FragColor = color;
}
