import { RendererService } from "../services/renderer/RendererService.js";
import { SelectionService } from "../services/selection/SelectionService.js";
import { InteractionService } from "../services/interaction/InteractionService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const SelectNodeWorkflow = {
  execute(screenX, screenY) {
    let picked;

    try {
      picked = RendererService.pickObjectAt(screenX, screenY);
    } catch {
      picked = null;
    }

    if (!picked || picked.type !== "node") {
      try {
        SelectionService.clearSelection();
      } catch {}

      try {
        InteractionService.detach();
      } catch {}

      return ok({
        selectedId: SelectionService.getSelectedId(),
      });
    }

    const selectResult = SelectionService.select(picked.id);

    if (!selectResult.ok) {
      return fail(selectResult.reason);
    }

    let attachResult;

    try {
      attachResult = InteractionService.attachToNode(picked.id);
    } catch {
      attachResult = fail("AttachFailed");
    }

    if (!attachResult.ok) {
      return fail("AttachFailed");
    }

    return ok({
      selectedId: SelectionService.getSelectedId(),
    });
  },
};
