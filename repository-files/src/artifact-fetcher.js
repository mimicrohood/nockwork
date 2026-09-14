import { equalHash, sha256 } from "./hash.js";
import { validateManifest } from "./manifest.js";

export class ArtifactFetcher {
  constructor({
    fetcher = globalThis.fetch,
    ipfsGateway = "https://ipfs.io/ipfs/",
    maxBytes = 16 * 1024 * 1024,
    timeoutMs = 15_000
  } = {}) {
    if (typeof fetcher !== "function") throw new Error("fetch is unavailable");
    this.fetcher = fetcher;
    this.ipfsGateway = ipfsGateway.endsWith("/") ? ipfsGateway : ipfsGateway + "/";
    this.maxBytes = maxBytes;
    this.timeoutMs = timeoutMs;
  }

  async download(untrustedManifest) {
    const manifest = validateManifest(untrustedManifest);
    const url = this.#resolve(manifest.artifact);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetcher(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Artifact download failed: " + response.status);
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > this.maxBytes) throw new Error("Artifact exceeds size limit");
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > this.maxBytes) throw new Error("Artifact exceeds size limit");
      if (!equalHash(sha256(bytes), manifest.codeHash)) {
        throw new Error("Downloaded artifact does not match its manifest");
      }
      return bytes;
    } finally {
      clearTimeout(timer);
    }
  }

  #resolve(uri) {
    if (uri.startsWith("ipfs://")) {
      return this.ipfsGateway + uri.slice("ipfs://".length);
    }
    const url = new URL(uri);
    if (!["https:", "http:"].includes(url.protocol)) {
      throw new Error("Unsupported artifact protocol: " + url.protocol);
    }
    return url.href;
  }
}
