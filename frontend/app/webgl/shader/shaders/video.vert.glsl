// video.vert.glsl
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
