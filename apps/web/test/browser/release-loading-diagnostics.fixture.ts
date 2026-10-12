import { test as base } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const test = base.extend<{ loadingDiagnostics: void }>({
  loadingDiagnostics: [
    async ({ page }, runFixture, info) => {
      const started = Date.now();
      const events: unknown[] = [];
      const pending = new Map<object, { path: string; at: number }>();
      const pathname = (value: string) => {
        try {
          return new URL(value).pathname;
        } catch {
          return "unknown";
        }
      };
      const resourceLocation = (value: string) => {
        try {
          const url = new URL(value);
          return { origin: url.origin, path: url.pathname, queryKeys: [...url.searchParams.keys()] };
        } catch {
          return null;
        }
      };
      page.on("request", (request) => {
        const entry = {
          path: pathname(request.url()),
          at: Date.now() - started,
        };
        pending.set(request, entry);
        events.push({
          type: "request",
          ...entry,
          method: request.method(),
          resource: request.resourceType(),
          origin: resourceLocation(request.url())?.origin,
          rsc: request.headers().rsc === "1",
          prefetch: request.headers()["next-router-prefetch"] === "1",
        });
      });
      page.on("requestfinished", (request) => {
        events.push({
          type: "finished",
          path: pathname(request.url()),
          at: Date.now() - started,
        });
        pending.delete(request);
      });
      page.on("requestfailed", (request) => {
        events.push({
          type: "failed",
          path: pathname(request.url()),
          at: Date.now() - started,
          code: request.failure()?.errorText.match(/net::[A-Z_]+|NS_[A-Z_]+/)?.[0] ??
            (/cancel|abort/i.test(request.failure()?.errorText ?? "") ? "cancelled-or-aborted" : "details-withheld"),
        });
        pending.delete(request);
      });
      page.on("response", (response) =>
        events.push({
          type: "response",
          path: pathname(response.url()),
          status: response.status(),
          at: Date.now() - started,
        }),
      );
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type()))
          events.push({
            type: "console",
            level: message.type(),
            at: Date.now() - started,
            message: "withheld to avoid payload/credential exposure",
          });
      });
      page.on("pageerror", (error) =>
        events.push({
          type: "pageerror",
          category: /#418|[Hh]ydration/.test(error.message) ? "hydration" : /access control/.test(error.message) ? "access-control" : /ResizeObserver/.test(error.message) ? "resize-observer" : /[Aa]bort/.test(error.message) ? "abort" : "unclassified",
          route: resourceLocation(page.url()),
          resources: ((error.stack ?? error.message).split("\n")[0].match(/https?:\/\/[^\s"'<>]+/g) ?? []).map(resourceLocation),
          at: Date.now() - started,
          message: "withheld; restricted trace retained on failure",
        }),
      );
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame())
          events.push({
            type: "navigation",
            path: pathname(frame.url()),
            at: Date.now() - started,
          });
      });
      let sampling = false;
      const timer = setInterval(() => {
        if (sampling || page.isClosed()) return;
        sampling = true;
        void page
          .evaluate(() => ({
            sessionChecking:
              document.body.textContent?.includes("Checking your session") ??
              false,
            busy: document.querySelectorAll('[aria-busy="true"]').length,
            skeletons: document.querySelectorAll(".animate-pulse").length,
            checkoutForm: Boolean(
              document.querySelector('input[autocomplete="name"]'),
            ),
            orderHistoryHeading:
              document.body.textContent?.includes(
                "Orders placed while signed in",
              ) ?? false,
          }))
          .then((state) =>
            events.push({
              type: "loading-sample",
              path: pathname(page.url()),
              at: Date.now() - started,
              ...state,
            }),
          )
          .catch(() => {})
          .finally(() => {
            sampling = false;
          });
      }, 500);
      try {
        await runFixture();
      } finally {
        clearInterval(timer);
        const directory = process.env.ORDERLY_RELEASE_DIAGNOSTICS_DIR;
        if (directory) {
          await mkdir(directory, { recursive: true });
          const file = path.join(
            directory,
            `${info.project.name}-${info.testId.replace(/[^a-z0-9]/gi, "_")}.json`,
          );
          await writeFile(
            file,
            JSON.stringify(
              {
                title: info.title,
                status: info.status,
                elapsedMs: Date.now() - started,
                pending: [...pending.values()].map((entry) => ({
                  ...entry,
                  ageMs: Date.now() - started - entry.at,
                })),
                events,
              },
              null,
              2,
            ),
          );
        }
      }
    },
    { auto: true },
  ],
});
