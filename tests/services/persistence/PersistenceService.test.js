import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PersistenceService } from "../../../services/persistence/PersistenceService.js";

const originalBlob = globalThis.Blob;
const originalURL = globalThis.URL;
const originalDocument = globalThis.document;
const originalFileReader = globalThis.FileReader;

afterEach(() => {
  globalThis.Blob = originalBlob;
  globalThis.URL = originalURL;
  globalThis.document = originalDocument;
  globalThis.FileReader = originalFileReader;
});

test("PersistenceService exportToFile succeeds", async () => {
  let clicked = false;
  let revoked = 0;

  globalThis.Blob = class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  };

  globalThis.URL = {
    createObjectURL() {
      return "blob:test";
    },
    revokeObjectURL() {
      revoked += 1;
    },
  };

  globalThis.document = {
    body: {
      appendChild() {},
    },
    createElement() {
      return {
        href: "",
        download: "",
        click() {
          clicked = true;
        },
        remove() {},
      };
    },
  };

  const result = PersistenceService.exportToFile("{}", "graph.json");

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(result.ok, true);
  assert.equal(clicked, true);
  assert.equal(revoked, 1);
});

test("PersistenceService exportToFile fails when download cannot be created", () => {
  globalThis.Blob = class {};

  globalThis.URL = {
    createObjectURL() {
      throw new Error("failed");
    },
    revokeObjectURL() {},
  };

  const result = PersistenceService.exportToFile("{}", "graph.json");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "ExportFailed");
});

test("PersistenceService importFromFile rejects missing file", async () => {
  const result = await PersistenceService.importFromFile(null);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NoFileProvided");
});

test("PersistenceService importFromFile reads file text", async () => {
  globalThis.FileReader = class {
    readAsText() {
      this.result = "{\"ok\":true}";
      this.onload();
    }
  };

  const result = await PersistenceService.importFromFile({
    name: "graph.json",
  });

  assert.equal(result.ok, true);
  assert.equal(result.value, "{\"ok\":true}");
});

test("PersistenceService importFromFile fails when read fails", async () => {
  globalThis.FileReader = class {
    readAsText() {
      this.onerror();
    }
  };

  const result = await PersistenceService.importFromFile({
    name: "graph.json",
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "ImportReadFailed");
});
