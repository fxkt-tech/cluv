declare module "@tauri-apps/plugin-os" {
  export type Platform =
    | "linux"
    | "macos"
    | "ios"
    | "freebsd"
    | "dragonfly"
    | "netbsd"
    | "openbsd"
    | "solaris"
    | "android"
    | "windows";

  export type OsType = "linux" | "windows" | "macos" | "ios" | "android";

  export type Arch =
    | "x86"
    | "x86_64"
    | "arm"
    | "aarch64"
    | "mips"
    | "mips64"
    | "powerpc"
    | "powerpc64"
    | "riscv64"
    | "s390x"
    | "sparc64";

  export type Family = "unix" | "windows" | "wasm";

  export function eol(): string;
  export function platform(): Platform;
  export function family(): Family;
  export function version(): string;
  export function type(): OsType;
  export function arch(): Arch;
  export function locale(): string | null;
  export function exeExtension(): string;
  export function hostname(): string | null;
}
