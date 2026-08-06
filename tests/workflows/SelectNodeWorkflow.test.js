import { test } from "node:test";
import assert from "node:assert/strict";
import { SelectNodeWorkflow } from "../../workflows/SelectNodeWorkflow.js";
import { RendererService } from "../../services/renderer/RendererService.js";
import { SelectionService } from "../../services/selection/SelectionService.js";
import { InteractionService } from "../../services/interaction/InteractionService.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

test("SelectNodeWorkflow keeps selection when attach fails", () => {
  SelectionService.selectedId = null;

  const restorePick = patch(RendererService, "pickObjectAt", () => {
    return { type: "node", id: "n1" };
  });

  const restoreAttach = patch(InteractionService, "attachToNode", () => {
    return { ok: false, reason: "NodeVisualNotFound" };
  });

  const result = SelectNodeWorkflow.execute(0, 0);

  restorePick();
  restoreAttach();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "AttachFailed");
  assert.equal(SelectionService.getSelectedId(), "n1");

  SelectionService.selectedId = null;
});

test("SelectNodeWorkflow clears selection when pick is null", () => {
  SelectionService.selectedId = "n1";

  let detached = false;

  const restorePick = patch(RendererService, "pickObjectAt", () => null);

  const restoreDetach = patch(InteractionService, "detach", () => {
    detached = true;
    return { ok: true, value: null };
  });

  const result = SelectNodeWorkflow.execute(0, 0);

  restorePick();
  restoreDetach();

  assert.equal(result.ok, true);
  assert.equal(result.value.selectedId, null);
  assert.equal(SelectionService.getSelectedId(), null);
  assert.equal(detached, true);
});
