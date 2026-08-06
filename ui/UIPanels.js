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

    if (!rootElement || typeof rootElement.appendChild !== "function") {
      return fail("InitializationFailed");
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      canvas.style.display = "block";

      const controls = document.createElement("div");

      const createNodeButton = document.createElement("button");
      createNodeButton.type = "button";
      createNodeButton.textContent = "Create Node";

      const deleteNodeButton = document.createElement("button");
      deleteNodeButton.type = "button";
      deleteNodeButton.textContent = "Delete Node";

      const connectModeButton = document.createElement("button");
      connectModeButton.type = "button";
      connectModeButton.textContent = "Connect";

      const disconnectButton = document.createElement("button");
      disconnectButton.type = "button";
      disconnectButton.textContent = "Disconnect";

      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.textContent = "Export";

      const importButton = document.createElement("button");
      importButton.type = "button";
      importButton.textContent = "Import";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json,application/json";
      fileInput.style.display = "none";

      controls.appendChild(createNodeButton);
      controls.appendChild(deleteNodeButton);
      controls.appendChild(connectModeButton);
      controls.appendChild(disconnectButton);
      controls.appendChild(exportButton);
      controls.appendChild(importButton);
      controls.appendChild(fileInput);

      rootElement.appendChild(canvas);
      rootElement.appendChild(controls);

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
