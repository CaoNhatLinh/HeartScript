declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Object3D } from 'three';
  export class GLTFLoader {
    load(url: string, onLoad: (gltf: { scene: Object3D }) => void, onProgress?: unknown, onError?: unknown): void;
  }
}
