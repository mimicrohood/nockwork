import { assertPermission } from "./permissions.js";

export class WasmLoader {
  constructor(host = {}) {
    this.host = host;
  }

  async load(bytes, permissions) {
    const granted = new Set(permissions);
    const imports = { system: {} };

    if (granted.has("clock:read")) {
      imports.system.now = () => Number(this.host.now?.() ?? Date.now());
    }
    if (granted.has("user:notify")) {
      imports.system.notify = value => {
        assertPermission(granted, "user:notify");
        this.host.notify?.(value);
      };
    }

    const module = await WebAssembly.compile(bytes);
    const instance = await WebAssembly.instantiate(module, imports);
    return Object.freeze({ module, instance });
  }
}
