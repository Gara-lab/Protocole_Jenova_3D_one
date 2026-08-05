import { DisconnectNodes } from "../domain/operations/DisconnectNodes.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const DisconnectNodesWorkflow = {
  execute(graph, linkId) {
    const disconnectResult = DisconnectNodes.execute(graph, linkId);

    if (!disconnectResult.ok) {
      return fail(disconnectResult.reason);
    }

    const removedLinkId = disconnectResult.value.removedLinkId ?? linkId;

    let syncResult;

    try {
      syncResult = RendererService.removeLinkVisual(removedLinkId);
    } catch {
      syncResult = fail("SyncFailed");
    }

    if (!syncResult.ok) {
      return {
        ok: false,
        reason: "SyncFailed",
        value: {
          linkId: removedLinkId,
        },
      };
    }

    return ok({
      linkId: removedLinkId,
    });
  },
};
