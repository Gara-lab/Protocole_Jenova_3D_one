import { MoveNode } from "../domain/operations/MoveNode.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const MoveNodeWorkflow = {
  execute(graph, nodeId, position) {
    let previousNode;

    try {
      previousNode = graph.getNode(nodeId);
    } catch {
      previousNode = null;
    }

    if (!previousNode) {
      return fail("NodeNotFound");
    }

    const previousPosition = {
      x: previousNode.position.x,
      y: previousNode.position.y,
      z: previousNode.position.z,
    };

    const moveResult = MoveNode.execute(graph, nodeId, position);

    if (!moveResult.ok) {
      return fail(moveResult.reason);
    }

    const updatedNode = moveResult.value;

    let syncResult;

    try {
      syncResult = RendererService.updateNodeVisual(nodeId, position);
    } catch {
      syncResult = fail("SyncFailedRolledBack");
    }

    if (syncResult.ok) {
      return ok(updatedNode);
    }

    try {
      MoveNode.execute(graph, nodeId, previousPosition);
    } catch {}

    return fail("SyncFailedRolledBack");
  },
};
