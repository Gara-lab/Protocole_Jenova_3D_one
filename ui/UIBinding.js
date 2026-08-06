import { CreateNodeWorkflow } from "../workflows/CreateNodeWorkflow.js";
import { DeleteNodeWorkflow } from "../workflows/DeleteNodeWorkflow.js";
import { ConnectNodesWorkflow } from "../workflows/ConnectNodesWorkflow.js";
import { DisconnectNodesWorkflow } from "../workflows/DisconnectNodesWorkflow.js";
import { SelectNodeWorkflow } from "../workflows/SelectNodeWorkflow.js";
import { ExportGraphWorkflow } from "../workflows/ExportGraphWorkflow.js";
import { ImportGraphWorkflow } from "../workflows/ImportGraphWorkflow.js";
import { SelectionService } from "../services/selection/SelectionService.js";
import { InteractionStateService } from "../services/interactionstate/InteractionStateService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function report(result) {
  if (result && result.ok === false) {
    console.error(result.reason);
  }
}

function run(fn) {
  try {
    report(fn());
  } catch (error) {
    console.error(error);
  }
}

async function runAsync(fn) {
  try {
    report(await fn());
  } catch (error) {
    console.error(error);
  }
}

let initialized = false;

export const UIBindings = {
  initialize(controlElements, canvasElement, graph) {
    if (initialized) {
      return ok(null);
    }

    if (!controlElements || !canvasElement || !graph) {
      return fail("NotInitialized");
    }

    const requiredKeys = [
      "createNodeButton",
      "deleteNodeButton",
      "connectModeButton",
      "disconnectButton",
      "exportButton",
      "importButton",
      "fileInput",
    ];

    if (requiredKeys.some((key) => !controlElements[key])) {
      return fail("NotInitialized");
    }

    const {
      createNodeButton,
      deleteNodeButton,
      connectModeButton,
      disconnectButton,
      exportButton,
      importButton,
      fileInput,
    } = controlElements;

    canvasElement.addEventListener("click", (event) => {
      run(() => SelectNodeWorkflow.execute(event.clientX, event.clientY));
    });

    createNodeButton.addEventListener("click", () => {
      run(() =>
        CreateNodeWorkflow.execute(graph, {
          position: { x: 0, y: 0, z: 0 },
        })
      );
    });

    deleteNodeButton.addEventListener("click", () => {
      const selectedId = SelectionService.getSelectedId();

      if (!selectedId) {
        return;
      }

      run(() => DeleteNodeWorkflow.execute(graph, selectedId));
    });

    connectModeButton.addEventListener("click", () => {
      const mode = InteractionStateService.getMode();

      if (mode === "idle") {
        const selectedId = SelectionService.getSelectedId();

        if (!selectedId) {
          return;
    }

        run(() => {
          const result = InteractionStateService.beginConnectMode(selectedId);

          if (result.ok) {
            connectModeButton.classList.add("connect-mode-active");
      }

          return result;
    });

        return;
  }

      if (mode === "awaitingSecondNode") {
        const firstNodeId = InteractionStateService.getPendingFirstNodeId();
        const secondNodeId = SelectionService.getSelectedId();

        if (!firstNodeId) {
          run(() => {
            const result = InteractionStateService.resetConnectMode();

            if (result.ok) {
              connectModeButton.classList.remove("connect-mode-active");
        }

            return result;
      });

          return;
    }

        if (!secondNodeId || firstNodeId === secondNodeId) {
          return;
    }

        run(() =>
          ConnectNodesWorkflow.execute(graph, firstNodeId, secondNodeId)
    );

        run(() => {
          const result = InteractionStateService.resetConnectMode();

          if (result.ok) {
            connectModeButton.classList.remove("connect-mode-active");
      }

          return result;
    });
  }
});

    disconnectButton.addEventListener("click", () => {
      const linkId = InteractionStateService.getSelectedLinkId();

      if (!linkId) {
        return;
      }

      run(() => DisconnectNodesWorkflow.execute(graph, linkId));
      run(() => InteractionStateService.clearSelectedLink());
    });

    exportButton.addEventListener("click", () => {
      run(() => ExportGraphWorkflow.execute(graph, "graph.json"));
    });

    importButton.addEventListener("click", () => {
      run(() => fileInput.click());
    });

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];

      event.target.value = "";

      if (!file) {
        return;
      }

      runAsync(() => ImportGraphWorkflow.execute(graph, file));
    });

    initialized = true;

    return ok(null);
  },
};
