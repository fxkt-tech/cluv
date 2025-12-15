// base.vert.glsl
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
