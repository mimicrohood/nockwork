export class ChainComputer {
  constructor({ kernel, store, artifactFetcher }) {
    if (!kernel || !store || !artifactFetcher) {
      throw new Error("kernel, store and artifactFetcher are required");
    }
    this.kernel = kernel;
    this.store = store;
    this.artifacts = artifactFetcher;
  }

  async install(manifest) {
    const bytes = await this.artifacts.download(manifest);
    await this.kernel.mount(manifest, bytes);
    await this.store.install(manifest, bytes);
    return manifest;
  }

  async launch(componentName, version, ...args) {
    const { manifest, bytes } = await this.store.read(componentName, version);
    this.kernel.unmount(componentName);
    await this.kernel.mount(manifest, bytes);
    return this.kernel.execute(componentName, ...args);
  }

  installed() {
    return this.store.list();
  }

  async uninstall(componentName, version) {
    this.kernel.unmount(componentName);
    await this.store.remove(componentName, version);
  }
}
