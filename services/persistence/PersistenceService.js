function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function exportToFile(jsonString, fileName) {
  try {
    if (typeof jsonString !== "string") {
      return fail("ExportFailed");
    }

    if (typeof fileName !== "string" || fileName.length === 0) {
      return fail("ExportFailed");
    }

    const blob = new Blob([jsonString], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);

    return ok(null);
  } catch {
    return fail("ExportFailed");
  }
}

async function importFromFile(fileHandle) {
  if (
    !fileHandle ||
    typeof fileHandle !== "object" ||
    typeof fileHandle.name !== "string"
  ) {
    return fail("NoFileProvided");
  }

  try {
    return await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(ok(reader.result));
      };

      reader.onerror = () => {
        resolve(fail("ImportReadFailed"));
      };

      reader.readAsText(fileHandle);
    });
  } catch {
    return fail("ImportReadFailed");
  }
}

export const PersistenceService = {
  exportToFile,
  importFromFile,
};
