export function createLink(input) {
  if (
    !input ||
    typeof input.id !== "string" ||
    typeof input.sourceId !== "string" ||
    typeof input.targetId !== "string"
  ) {
    throw new Error(
      "Invalid Link input: id, sourceId, and targetId are required"
    );
  }

  const link = {
    id: input.id,
    sourceId: input.sourceId,
    targetId: input.targetId,
  };

  if (input.data !== undefined) {
    link.data = input.data;
  }

  return Object.freeze(link);
}
