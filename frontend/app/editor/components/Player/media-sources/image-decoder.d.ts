/**
 * TypeScript declarations for ImageDecoder API
 * This is an experimental API not yet in standard TypeScript lib
 * See: https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder
 */

interface ImageDecoderInit {
  /**
   * The image data to decode
   */
  data: ReadableStream | ArrayBuffer | ArrayBufferView;

  /**
   * The MIME type of the image
   * Examples: 'image/gif', 'image/png', 'image/jpeg', 'image/webp'
   */
  type: string;

  /**
   * Preferred color space
   */
  colorSpaceConversion?: 'none' | 'default';

  /**
   * Desired output size
   */
  desiredWidth?: number;
  desiredHeight?: number;

  /**
   * Whether to prefer animation
   */
  preferAnimation?: boolean;
}

interface ImageDecodeOptions {
  /**
   * The index of the frame to decode
   */
  frameIndex: number;

  /**
   * Whether to complete the frame before resolving
   */
  completeFramesOnly?: boolean;
}

interface ImageDecodeResult {
  /**
   * The decoded image as an ImageBitmap
   */
  image: ImageBitmap;

  /**
   * Whether the image is complete
   */
  complete: boolean;
}

interface ImageTrack {
  /**
   * Whether the track is animated
   */
  animated: boolean;

  /**
   * The number of frames in the track
   */
  frameCount: number;

  /**
   * The number of times to repeat (0 = infinite)
   */
  repetitionCount: number;

  /**
   * Whether the track is selected
   */
  selected: boolean;
}

interface ImageTrackList {
  /**
   * The number of tracks
   */
  length: number;

  /**
   * The index of the selected track
   */
  selectedIndex: number;

  /**
   * The selected track
   */
  selectedTrack: ImageTrack | null;

  /**
   * Get a track by index
   */
  [index: number]: ImageTrack;
}

/**
 * ImageDecoder class
 */
declare class ImageDecoder {
  constructor(init: ImageDecoderInit);

  /**
   * The type of the image
   */
  readonly type: string;

  /**
   * Whether the image is complete
   */
  readonly complete: boolean;

  /**
   * The tracks in the image
   */
  readonly tracks: ImageTrackList;

  /**
   * Decode a frame
   */
  decode(options?: ImageDecodeOptions): Promise<ImageDecodeResult>;

  /**
   * Reset the decoder
   */
  reset(): void;

  /**
   * Close the decoder and release resources
   */
  close(): void;

  /**
   * Check if a type is supported
   */
  static isTypeSupported(type: string): Promise<boolean>;
}

/**
 * Extend ImageBitmap to include duration property (for animated images)
 */
interface ImageBitmap {
  /**
   * The duration of the frame in microseconds (animated images only)
   */
  duration?: number;
}

/**
 * Make ImageDecoder available globally
 */
declare global {
  const ImageDecoder: typeof ImageDecoder | undefined;
}

export {};
