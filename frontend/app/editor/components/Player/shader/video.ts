/**
 * WebGPU Shader 源码
 */
export const SHADER_SOURCE = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

struct Uniforms {
  posX: f32,
  posY: f32,
  scaleX: f32,
  scaleY: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_external;

@vertex
fn vs_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );

  var uv = array<vec2<f32>, 4>(
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0)
  );

  var output: VertexOutput;
  let p = pos[VertexIndex];
  let scaledPos = vec2<f32>(p.x * uniforms.scaleX, p.y * uniforms.scaleY);
  let finalPos = scaledPos + vec2<f32>(uniforms.posX, uniforms.posY);
  output.position = vec4<f32>(finalPos, 0.0, 1.0);
  output.uv = uv[VertexIndex];
  return output;
}

@fragment
fn fs_main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSampleBaseClampToEdge(myTexture, mySampler, uv);
}
`;
