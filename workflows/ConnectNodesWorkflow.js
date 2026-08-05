import { ConnectNodes } from "../domain/operations/ConnectNodes.js";
import { DisconnectNodes } from "../domain/operations/DisconnectNodes.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const ConnectNodesWorkflow = {
  execute(graph, sourceId, targetId, linkData) {
    const connectResult = ConnectNodes.execute(
      graph,
      sourceId,
      targetId,
      linkData
    );

    if (!connectResult.ok) {
      return fail(connectResult.reason);
    }

    const link = connectResult.value;

    const sourceNode = graph.getNode(sourceId);
    const targetNode = graph.getNode(targetId);

    if (!sourceNode || !targetNode) {
      try {
        DisconnectNodes.execute(graph, link.id);
      } catch {}

      return fail("SyncFailedRolledBack");
    }

    const sourcePosition = {
      x: sourceNode.position.x,
      y: sourceNode.position.y,
      z: sourceNode.position.z,
    };

    const targetPosition = {
      x: targetNode.position.x,
      y: targetNode.position.y,
      z: targetNode.position.z,
    };

    let syncResult;

    try {
      syncResult = RendererService.addLinkVisual(
        link,
        sourcePosition,
        targetPosition
      );
    } catch {
      syncResult = fail("SyncFailedRolledBack");
    }

    if (syncResult.ok) {
      return ok(link);
    }

    try {
      DisconnectNodes.execute(graph, link.id);
    } catch {}

    return fail("SyncFailedRolledBack");
  },
};
