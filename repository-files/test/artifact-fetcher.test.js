import assert from "node:assert/strict";
import test from "node:test";
import { ArtifactFetcher } from "../src/artifact-fetcher.js";
import { sha256 } from "../src/hash.js";

const bytes = Uint8Array.from([0, 97, 115, 109]);
const manifest = {
  id: "tools/fetch",
  version: "1.0.0",
  codeHash: sha256(bytes),
  artifact: "ipfs://bafy-test/component.wasm",
  entrypoint: "run",
  permissions: []
};

test("resolves IPFS, enforces hash and returns bytes", async () => {
  let requested;
  const fetcher = new ArtifactFetcher({
    ipfsGateway: "https://gateway.example/ipfs",
    fetcher: async url => {
      requested = url;
      return new Response(bytes, { status: 200 });
    }
  });
  assert.deepEqual(await fetcher.download(manifest), bytes);
  assert.equal(requested, "https://gateway.example/ipfs/bafy-test/component.wasm");
});

test("rejects bytes that do not match the published hash", async () => {
  const fetcher = new ArtifactFetcher({
    fetcher: async () => new Response(new Uint8Array([1]), { status: 200 })
  });
  await assert.rejects(fetcher.download(manifest), /does not match/);
});
