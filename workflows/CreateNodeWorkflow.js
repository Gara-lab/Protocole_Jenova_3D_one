import { CreateNode } from "../domain/operations/CreateNode.js";
import { DeleteNode } from "../domain/operations/DeleteNode.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const CreateNodeWorkflow = {
  execute(graph, nodeInput) {
    const createResult = CreateNode.execute(graph, nodeInput);

    if (!createResult.ok) {
      return fail(createResult.reason);
    }

    const node = createResult.value;

    let syncResult;

    try {
      syncResult = RendererService.addNodeVisual(node);
    } catch {
      syncResult = fail("SyncFailedRolledBack");
    }

    if (syncResult.ok) {
      return ok(node);
    }

    try {
      DeleteNode.execute(graph, node.id);
    } catch {}

    return fail("SyncFailedRolledBack");
  },
};
