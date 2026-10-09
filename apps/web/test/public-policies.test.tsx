/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";
import PrivacyPage, { metadata as privacyMetadata } from "@/app/(customer)/privacy/page";
import TermsPage, { metadata as termsMetadata } from "@/app/(customer)/terms/page";
import { SiteFooter } from "@/components/layout/site-footer";

it.each([
  ["Privacy Policy", PrivacyPage, privacyMetadata],
  ["Terms of Service", TermsPage, termsMetadata],
] as const)("renders public %s content without a session or provider", (title, Page, metadata) => {
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  expect(metadata.title).toBe(title);
  expect(screen.getByText(/not a real restaurant or commercial ordering service/)).toBeInTheDocument();
  expect(screen.getByText(/Developer contact email — owner confirmation required/)).toBeInTheDocument();
  const navigation = within(screen.getByRole("navigation", { name: "Policy navigation" }));
  expect(navigation.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  expect(navigation.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
});

it("links both public policies from the existing customer footer", () => {
  render(<SiteFooter />);
  const footer = within(screen.getByRole("navigation", { name: "Footer navigation" }));
  expect(footer.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  expect(footer.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  expect(footer.getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/");
  expect(footer.getByRole("link", { name: "Track order" })).toHaveAttribute("href", "/track-order");
});
