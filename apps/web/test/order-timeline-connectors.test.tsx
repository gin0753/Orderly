/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OrderStatusTimeline } from "@/features/order-tracking/components/result/order-status-timeline";
import type { OrderStatus } from "@/features/order-tracking/types/order-tracking.types";

const timestamps = {
  createdAt: "2026-10-09T03:00:00Z",
  updatedAt: "2026-10-09T03:10:00Z",
};

it.each<[OrderStatus, number]>([
  ["PENDING", 0],
  ["ACCEPTED", 0],
  ["PREPARING", 1],
  ["READY", 2],
  ["COMPLETED", 3],
])(
  "%s marks only completed transitions and keeps connectors decorative",
  (status, completed) => {
    const { container } = render(
      <OrderStatusTimeline
        status={status}
        orderType="DELIVERY"
        {...timestamps}
      />,
    );
    const connectors = container.querySelectorAll("[data-progress-connector]");
    expect(connectors).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-progress-connector="completed"]'),
    ).toHaveLength(completed);
    for (const connector of connectors)
      expect(connector).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("listitem")[completed]).toHaveAttribute(
      "aria-current",
      "step",
    );
    if (status === "READY")
      expect(
        screen.getByText("Current status: Ready for delivery"),
      ).toBeInTheDocument();
  },
);

it("does not depict a cancelled order as chronological progress", () => {
  const { container } = render(
    <OrderStatusTimeline
      status="CANCELLED"
      orderType="PICKUP"
      {...timestamps}
    />,
  );
  expect(container.querySelector("[data-progress-connector]")).toBeNull();
  expect(container.querySelector("[aria-current]")).toBeNull();
});

it.each<OrderStatus>([
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
])(
  "preserves recorded %s semantics and optionally captures the timeline",
  (status) => {
    const { container } = render(
      <OrderStatusTimeline
        status={status}
        orderType="PICKUP"
        {...timestamps}
      />,
    );
    if (status === "CANCELLED") {
      expect(
        screen.getByRole("heading", { name: "This order has been cancelled" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    } else {
      expect(screen.getAllByRole("listitem")).toHaveLength(4);
      expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(
        1,
      );
      if (status === "ACCEPTED")
        expect(
          screen.getByText("Current status: Accepted"),
        ).toBeInTheDocument();
    }
    const phase = process.env.ORDERLY_TIMELINE_CAPTURE_PHASE;
    if (phase) {
      const directory = path.resolve(
        process.cwd(),
        "../../audit-artifacts/timeline-connectors",
        phase,
      );
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(directory, `${status}.html`),
        `<main class="customer-theme" style="padding:16px;max-width:1100px;margin:auto">${container.innerHTML}</main>`,
      );
    }
  },
);
