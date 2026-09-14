import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { equalHash, sha256 } from "./hash.js";
import { validateManifest } from "./manifest.js";

export class ComponentStore {
  constructor(directory) {
    if (!directory) throw new Error("store directory is required");
    this.directory = path.resolve(directory);
  }

  async install(untrustedManifest, bytes) {
    const manifest = validateManifest(untrustedManifest);
    if (!equalHash(sha256(bytes), manifest.codeHash)) {
      throw new Error("Refusing to store modified component bytes");
    }
    const target = this.#path(manifest.id, manifest.version);
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "component.wasm"), bytes, { flag: "wx" })
      .catch(error => {
        if (error.code !== "EEXIST") throw error;
      });
    await writeFile(
      path.join(target, "manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n"
    );
    return manifest;
  }

  async read(componentName, version) {
    const target = this.#path(componentName, version);
    const [manifestText, bytes] = await Promise.all([
      readFile(path.join(target, "manifest.json"), "utf8"),
      readFile(path.join(target, "component.wasm"))
    ]);
    const manifest = validateManifest(JSON.parse(manifestText));
    if (!equalHash(sha256(bytes), manifest.codeHash)) {
      throw new Error("Stored component failed integrity verification");
    }
    return { manifest, bytes: new Uint8Array(bytes) };
  }

  async list() {
    await mkdir(this.directory, { recursive: true });
    const entries = await readdir(this.directory, { withFileTypes: true });
    const manifests = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const text = await readFile(
          path.join(this.directory, entry.name, "manifest.json"),
          "utf8"
        );
        manifests.push(validateManifest(JSON.parse(text)));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    return manifests.sort((a, b) => a.id.localeCompare(b.id));
  }

  async remove(componentName, version) {
    await rm(this.#path(componentName, version), { recursive: true, force: true });
  }

  #path(componentName, version) {
    const key = createHash("sha256")
      .update(componentName + "@" + version)
      .digest("hex");
    return path.join(this.directory, key);
  }
}
