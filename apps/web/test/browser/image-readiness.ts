import { type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// A Node deadline also bounds an evaluation when the page cannot run its own timer.
async function bounded<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("page-operation-timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function assertRequiredImageReady(
  image: Locator,
  testInfo: TestInfo,
  label: string,
  timeoutMs = 8_000,
) {
  const started = Date.now();
  let outcome: string;
  const states: unknown[] = [];
  const snapshot = async (stage: string) => {
    states.push(
      await image.evaluate(
        (node, stage) => {
          const img = node as HTMLImageElement;
          const safeSource = (value: string) => {
            if (!value) return "empty-source";
            const url = new URL(value || document.baseURI, document.baseURI);
            const asset = url.searchParams
              .get("url")
              ?.match(
                /^\/images\/menu\/[a-z0-9-]+\.(?:webp|png|jpg|jpeg|svg)$/i,
              )?.[0];
            return url.protocol === "data:"
              ? "data-image"
              : url.pathname === "/_next/image" && asset
                ? `${url.pathname}?url=${encodeURIComponent(asset)}&w=${Number(url.searchParams.get("w"))}&q=${Number(url.searchParams.get("q"))}`
                : url.pathname;
          };
          const box = img.getBoundingClientRect();
          return {
            stage,
            src: safeSource(img.src),
            currentSrc: safeSource(img.currentSrc),
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            loading: img.loading,
            connected: img.isConnected,
            viewport: { width: innerWidth, height: innerHeight },
            box: { x: box.x, y: box.y, width: box.width, height: box.height },
          };
        },
        stage,
        { timeout: 500 },
      ),
    );
  };
  try {
    outcome = await bounded(
      (async () => {
        await image.scrollIntoViewIfNeeded({ timeout: timeoutMs });
        await snapshot("after-scroll").catch(() =>
          states.push({ stage: "after-scroll", unavailable: true }),
        );
        const remaining = Math.max(1, timeoutMs - (Date.now() - started));
        return image.evaluate(
          async (node, budget) => {
            const img = node as HTMLImageElement;
            const deadline = performance.now() + budget;
            while (!img.complete && performance.now() < deadline) {
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
            if (!img.complete) return "load-timeout";
            if (!img.naturalWidth || !img.naturalHeight) return "load-failed";
            let timer: ReturnType<typeof setTimeout>;
            try {
              return await Promise.race([
                img.decode().then(
                  () => "decoded",
                  () => "decode-rejected",
                ),
                new Promise<string>((resolve) => {
                  timer = setTimeout(
                    () => resolve("decode-timeout"),
                    Math.max(1, deadline - performance.now()),
                  );
                }),
              ]);
            } finally {
              clearTimeout(timer!);
            }
          },
          remaining,
          { timeout: remaining },
        );
      })(),
      timeoutMs + 250,
    );
  } catch (error) {
    outcome =
      error instanceof Error && error.message === "page-operation-timeout"
        ? "page-operation-timeout"
        : "image-locator-or-page-error";
  }
  await snapshot(outcome).catch(() =>
    states.push({ stage: outcome, unavailable: true }),
  );
  const statePath = testInfo.outputPath(
    `image-state-${label.replace(/[^a-z0-9-]/gi, "-")}.json`,
  );
  await writeFile(
    statePath,
    JSON.stringify({
      label,
      outcome,
      timeoutMs,
      elapsedMs: Date.now() - started,
      states,
    }),
  );
  await testInfo.attach("required-image-state", {
    path: statePath,
    contentType: "application/json",
  });
  if (outcome !== "decoded") {
    await testInfo.attach("required-image-failure", {
      body: JSON.stringify({
        label,
        outcome,
        timeoutMs,
        elapsedMs: Date.now() - started,
      }),
      contentType: "application/json",
    });
    throw new Error(
      `Required image ${label}: ${outcome} (bounded at ${timeoutMs}ms)`,
    );
  }
}

export async function diagnoseOtherImages(
  page: Page,
  testInfo: TestInfo,
  timeoutMs = 2_000,
) {
  const results = await bounded(
    page.locator("img").evaluateAll(async (nodes, budget) => {
      return Promise.all(
        nodes.map(async (node, index) => {
          const image = node as HTMLImageElement;
          const source = new URL(
            image.currentSrc || image.src,
            document.baseURI,
          );
          // No query strings, credentials, cookies, data URLs or captured identities.
          const sourcePath =
            source.protocol === "data:" ? "data-image" : source.pathname;
          const deadline = performance.now() + budget;
          const box = image.getBoundingClientRect();
          const offscreen =
            box.bottom <= 0 ||
            box.top >= innerHeight ||
            box.right <= 0 ||
            box.left >= innerWidth;
          const state = () => ({
            index,
            sourcePath,
            loading: image.loading,
            complete: image.complete,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
          });
          if (!image.complete && image.loading === "lazy" && offscreen) {
            return { ...state(), outcome: "deferred-lazy-offscreen" };
          }
          while (!image.complete && performance.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          const base = state();
          if (!image.complete) return { ...base, outcome: "load-timeout" };
          if (!image.naturalWidth || !image.naturalHeight)
            return { ...base, outcome: "load-failed" };
          let timer: ReturnType<typeof setTimeout>;
          try {
            const outcome = await Promise.race([
              image.decode().then(
                () => "decoded",
                () => "decode-rejected",
              ),
              new Promise<string>((resolve) => {
                timer = setTimeout(
                  () => resolve("decode-timeout"),
                  Math.max(1, deadline - performance.now()),
                );
              }),
            ]);
            return { ...base, outcome };
          } finally {
            clearTimeout(timer!);
          }
        }),
      );
    }, timeoutMs),
    timeoutMs + 250,
  ).catch(async (error) => {
    await testInfo.attach("image-readiness-page-failure", {
      body: JSON.stringify({
        outcome: "page-evaluation-failed-or-timed-out",
        timeoutMs,
      }),
      contentType: "application/json",
    });
    throw error;
  });
  await testInfo.attach("image-readiness-diagnostics", {
    body: JSON.stringify(results),
    contentType: "application/json",
  });
  for (const result of results.filter((entry) =>
    [
      "load-failed",
      "load-timeout",
      "decode-rejected",
      "decode-timeout",
    ].includes(entry.outcome),
  )) {
    testInfo.annotations.push({
      type: "image-warning",
      description: JSON.stringify(result),
    });
  }
  return results;
}
