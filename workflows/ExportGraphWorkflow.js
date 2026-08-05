import { PersistenceService } from "../services/persistence/PersistenceService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const ExportGraphWorkflow = {
  execute(graph, fileName) {
    let jsonString;

    try {
      jsonString = graph.toJSON();
    } catch {
      return fail("ExportFailed");
    }

    const exportResult = PersistenceService.exportToFile(jsonString, fileName);

    if (!exportResult.ok) {
      return fail(exportResult.reason ?? "ExportFailed");
    }

    return ok(null);
  },
};
