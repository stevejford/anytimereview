export async function waitUntil<T>(
  ctx: { executionCtx?: ExecutionContext },
  promise: Promise<T>,
): Promise<void> {
  if (typeof ctx.executionCtx?.waitUntil === "function") {
    ctx.executionCtx.waitUntil(promise);
    return;
  }

  try {
    await promise;
  } catch (error) {
    console.error("waitUntil.fallback", { error });
  }
}


