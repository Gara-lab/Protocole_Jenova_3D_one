import { test } from "node:test";
import assert from "node:assert/strict";
import { InteractionStateService } from "../../../services/interactionstate/InteractionStateService.js";

function resetInteractionState() {
  InteractionStateService.mode = "idle";
  InteractionStateService.pendingFirstNodeId = null;
  InteractionStateService.selectedLinkId = null;
}

test("InteractionStateService connect-mode transitions", () => {
  resetInteractionState();

  assert.equal(InteractionStateService.getMode(), "idle");
  assert.equal(InteractionStateService.getPendingFirstNodeId(), null);

  const beginResult = InteractionStateService.beginConnectMode("n1");

  assert.equal(beginResult.ok, true);
  assert.equal(InteractionStateService.getMode(), "awaitingSecondNode");
  assert.equal(InteractionStateService.getPendingFirstNodeId(), "n1");

  const resetResult = InteractionStateService.resetConnectMode();

  assert.equal(resetResult.ok, true);
  assert.equal(InteractionStateService.getMode(), "idle");
  assert.equal(InteractionStateService.getPendingFirstNodeId(), null);
});

test("InteractionStateService rejects beginning connect mode twice", () => {
  resetInteractionState();

  InteractionStateService.beginConnectMode("n1");

  const result = InteractionStateService.beginConnectMode("n2");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "AlreadyAwaitingSecondNode");
  assert.equal(InteractionStateService.getPendingFirstNodeId(), "n1");
});

test("InteractionStateService rejects invalid ids", () => {
  resetInteractionState();

  assert.equal(InteractionStateService.beginConnectMode("").reason, "NodeIdRequired");
  assert.equal(InteractionStateService.selectLink("").reason, "LinkIdRequired");
});

test("InteractionStateService link selection state", () => {
  resetInteractionState();

  assert.equal(InteractionStateService.getSelectedLinkId(), null);

  const selectResult = InteractionStateService.selectLink("l1");

  assert.equal(selectResult.ok, true);
  assert.equal(InteractionStateService.getSelectedLinkId(), "l1");

  const clearResult = InteractionStateService.clearSelectedLink();

  assert.equal(clearResult.ok, true);
  assert.equal(InteractionStateService.getSelectedLinkId(), null);
});
