import { test } from "node:test";
import assert from "node:assert/strict";
import { SelectionService } from "../../../services/selection/SelectionService.js";
import { EventBus } from "../../../core/events.js";

function resetSelection() {
  SelectionService.selectedId = null;
}

test("SelectionService select updates selected id and emits event", () => {
  resetSelection();

  const events = [];

  const unsubscribe = EventBus.on("SelectionChanged", (payload) => {
    events.push(payload);
  });

  const result = SelectionService.select("n1");

  unsubscribe();

  assert.equal(result.ok, true);
  assert.equal(SelectionService.getSelectedId(), "n1");
  assert.equal(SelectionService.isSelected("n1"), true);
  assert.deepEqual(events, [{ selectedId: "n1" }]);
});

test("SelectionService clearSelection clears selected id and emits event", () => {
  resetSelection();

  SelectionService.select("n1");

  const events = [];

  const unsubscribe = EventBus.on("SelectionChanged", (payload) => {
    events.push(payload);
  });

  const result = SelectionService.clearSelection();

  unsubscribe();

  assert.equal(result.ok, true);
  assert.equal(SelectionService.getSelectedId(), null);
  assert.deepEqual(events, [{ selectedId: null }]);
});

test("SelectionService rejects invalid node ids", () => {
  resetSelection();

  const events = [];

  const unsubscribe = EventBus.on("SelectionChanged", (payload) => {
    events.push(payload);
  });

  const result = SelectionService.select("");

  unsubscribe();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NodeIdRequired");
  assert.equal(SelectionService.getSelectedId(), null);
  assert.equal(events.length, 0);
});
