// base.frag.glsl
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
