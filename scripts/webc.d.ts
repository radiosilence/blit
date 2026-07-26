/**
 * WebC ships no types. This declares the surface generate.ts uses rather than a
 * blanket `any`, so a signature that changes under an upgrade fails the build.
 */
declare module "@11ty/webc" {
  export class WebC {
    setInputPath(path: string): void;
    defineComponents(glob: string): void;
    setHelper(name: string, value: unknown): void;
    compile(options?: { data?: object }): Promise<{ html: string }>;
  }
}
