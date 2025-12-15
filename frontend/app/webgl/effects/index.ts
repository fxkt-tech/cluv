/**
 * Effects module
 * Visual effects system for WebGL rendering
 */

export {
  Effect,
  EffectType,
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  BlurEffect,
  SharpenEffect,
  VignetteEffect,
  CustomEffect,
} from "./Effect";

export type {
  EffectConfig,
  ColorAdjustmentConfig,
  ChromaKeyConfig,
  BlurConfig,
  SharpenConfig,
  VignetteConfig,
  CustomEffectConfig,
  AnyEffectConfig,
} from "./Effect";

export { EffectManager } from "./EffectManager";
