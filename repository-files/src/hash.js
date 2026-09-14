import { createHash } from "node:crypto";

export function sha256(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return "0x" + createHash("sha256").update(input).digest("hex");
}

export function equalHash(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}
