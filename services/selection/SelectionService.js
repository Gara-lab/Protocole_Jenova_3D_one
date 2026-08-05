import { EventBus } from "../../core/events.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function isValidNodeId(nodeId) {
  return typeof nodeId === "string" && nodeId.length > 0;
}

class SelectionServiceImplementation {
  selectedId = null;

  getSelectedId() {
    return this.selectedId;
  }

  isSelected(nodeId) {
    return this.selectedId !== null && this.selectedId === nodeId;
  }

  select(nodeId) {
    if (!isValidNodeId(nodeId)) {
      return fail("NodeIdRequired");
    }

    this.selectedId = nodeId;

    EventBus.emit("SelectionChanged", {
      selectedId: this.selectedId,
    });

    return ok(null);
  }

  clearSelection() {
    this.selectedId = null;

    EventBus.emit("SelectionChanged", {
      selectedId: null,
    });

    return ok(null);
  }
}

export const SelectionService = new SelectionServiceImplementation();
