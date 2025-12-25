/**
 * 媒体源抽象层
 * 统一管理视频、图片、音频等不同类型的媒体资源
 */

/**
 * 纹理类型
 */
export type TextureType = 'external' | '2d';

/**
 * 纹理结果
 */
export interface TextureResult {
  type: TextureType;
  texture: GPUExternalTexture | GPUTexture;
}

/**
 * 媒体类型
 */
export type MediaType = 'video' | 'image' | 'animated-image' | 'audio';

/**
 * 媒体源接口
 * 所有媒体类型都必须实现此接口
 */
export interface IMediaSource {
  /**
   * 唯一标识符
   */
  readonly id: string;

  /**
   * 媒体类型
   */
  readonly type: MediaType;

  /**
   * 媒体本身的固有时长（秒）
   * - 视频：视频时长
   * - 动图：一个循环的时长
   * - 静态图片：Infinity（无固有时长）
   * - 音频：音频时长
   */
  readonly duration: number;

  /**
   * 媒体是否已加载完成
   */
  readonly isLoaded: boolean;

  /**
   * 媒体尺寸
   */
  readonly width: number;
  readonly height: number;

  /**
   * 加载媒体资源
   * @param url 媒体文件路径
   */
  load(url: string): Promise<void>;

  /**
   * 获取指定时间点的渲染纹理
   * @param device WebGPU 设备
   * @param time 当前播放时间（相对于媒体开始的本地时间）
   * @returns 纹理对象，如果无法获取则返回 null
   */
  getTexture(device: GPUDevice, time: number): TextureResult | null;

  /**
   * 播放控制（可选，视频和音频需要）
   */
  play?(): void;
  pause?(): void;
  seek?(time: number): void;

  /**
   * 释放资源
   */
  dispose(): void;
}

/**
 * 媒体源构造器接口
 */
export interface IMediaSourceConstructor {
  new (id: string): IMediaSource;
}

/**
 * 动图帧信息
 */
export interface AnimatedFrameInfo {
  duration: number; // 帧持续时间（秒）
  bitmap: ImageBitmap;
}
