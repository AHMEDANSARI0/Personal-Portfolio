import type { ThreeElements } from "@react-three/fiber";

/**
 * Ensure R3F's element types are visible to every TSX file even when a
 * module only uses JSX intrinsics (<mesh/>…) without importing the package.
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
