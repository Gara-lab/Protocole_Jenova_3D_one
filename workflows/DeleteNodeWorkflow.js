import { DeleteNode } from "../domain/operations/DeleteNode.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const DeleteNodeWorkflow = {
  execute(graph, nodeId) {
    const deleteResult = DeleteNode.execute(graph, nodeId);

    if (!deleteResult.ok) {
      return fail(deleteResult.reason);
    }

    const removedNodeId = deleteResult.value.removedNodeId ?? nodeId;
    const removedLinkIds = deleteResult.value.removedLinkIds ?? [];
    const failedVisualIds = [];

    let nodeVisualResult;

    try {
      nodeVisualResult = RendererService.removeNodeVisual(removedNodeId);
    } catch {
      nodeVisualResult = fail("SyncFailed");
    }

    if (!nodeVisualResult.ok) {
      failedVisualIds.push(removedNodeId);
    }

    for (const linkId of removedLinkIds) {
      let linkVisualResult;

      try {
        linkVisualResult = RendererService.removeLinkVisual(linkId);
      } catch {
        linkVisualResult = fail("SyncFailed");
      }

      if (!linkVisualResult.ok) {
        failedVisualIds.push(linkId);
      }
    }

    if (failedVisualIds.length > 0) {
      return {
        ok: false,
        reason: "SyncFailed",
        value: {
          nodeId: removedNodeId,
          removedLinkIds,
          failedVisualIds,
        },
      };
    }

    return ok({
      nodeId: removedNodeId,
      removedLinkIds,
    });
  },
};
