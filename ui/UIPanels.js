function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

class UIPanelsImplementation {
  canvas = null;
  controls = null;

 initialize(rootElement) {
  if (this.canvas && this.controls) {
    return ok(null);
  }

  if (!rootElement || typeof rootElement.querySelector !== "function") {
    return fail("InitializationFailed");
  }

  try {
    const canvas = rootElement.querySelector("#render-canvas");
    const createNodeButton = rootElement.querySelector("#create-node-btn");
    const deleteNodeButton = rootElement.querySelector("#delete-node-btn");
    const connectModeButton = rootElement.querySelector("#connect-mode-btn");
    const disconnectButton = rootElement.querySelector("#disconnect-btn");
    const exportButton = rootElement.querySelector("#export-btn");
    const importButton = rootElement.querySelector("#import-btn");
    const fileInput = rootElement.querySelector("#import-file-input");

    if (
      !(canvas instanceof HTMLCanvasElement) ||
      !(createNodeButton instanceof HTMLButtonElement) ||
      !(deleteNodeButton instanceof HTMLButtonElement) ||
      !(connectModeButton instanceof HTMLButtonElement) ||
      !(disconnectButton instanceof HTMLButtonElement) ||
      !(exportButton instanceof HTMLButtonElement) ||
      !(importButton instanceof HTMLButtonElement) ||
      !(fileInput instanceof HTMLInputElement) ||
      fileInput.type !== "file"
    ) {
      return fail("InitializationFailed");
    }

    this.canvas = canvas;

    this.controls = {
      createNodeButton,
      deleteNodeButton,
      connectModeButton,
      disconnectButton,
      exportButton,
      importButton,
      fileInput,
    };

      return ok(null);
  } catch {
      return fail("InitializationFailed");
  }
}
    } catch {
      return fail("InitializationFailed");
    }
  }

  getCanvasElement() {
    return this.canvas;
  }

  getControlElements() {
    if (!this.controls) {
      return null;
    }

    return { ...this.controls };
  }
}

export const UIPanels = new UIPanelsImplementation();
