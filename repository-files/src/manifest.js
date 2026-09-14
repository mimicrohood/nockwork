import { validatePermissions } from "./permissions.js";

const ID = /^[a-z0-9][a-z0-9._/-]{2,127}$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const ENTRYPOINT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function validateManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("manifest must be an object");
  }
  if (!ID.test(value.id ?? "")) {
    throw new Error("manifest.id must be a namespaced component identifier");
  }
  if (!VERSION.test(value.version ?? "")) {
    throw new Error("manifest.version must use semantic versioning");
  }
  if (!HASH.test(value.codeHash ?? "")) {
    throw new Error("manifest.codeHash must be a 32-byte hex digest");
  }
  if (!ENTRYPOINT.test(value.entrypoint ?? "")) {
    throw new Error("manifest.entrypoint is invalid");
  }
  if (typeof value.artifact !== "string" || value.artifact.length === 0) {
    throw new Error("manifest.artifact is required");
  }

  return Object.freeze({
    schema: 1,
    id: value.id,
    name: String(value.name ?? value.id),
    version: value.version,
    codeHash: value.codeHash.toLowerCase(),
    artifact: value.artifact,
    entrypoint: value.entrypoint,
    permissions: Object.freeze(validatePermissions(value.permissions ?? []))
  });
}
