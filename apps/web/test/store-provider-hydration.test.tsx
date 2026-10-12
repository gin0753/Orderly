/** @jest-environment jsdom */
import { act, Suspense, useEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { StoreProvider } from "@/store/store-provider";
import { useAppDispatch } from "@/store/hooks";
import { customerSessionReplaced } from "@/features/customer-auth/store/customer-auth-slice";
import { CustomerRouteGuard } from "@/features/customer-auth/components/customer-route-guard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/account",
}));

function SessionBootstrap() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(
      customerSessionReplaced({
        id: "hydration-fixture",
        name: "Fixture",
        email: "hydration@example.test",
        phone: null,
        authMethods: { password: true, google: false },
      }),
    );
  }, [dispatch]);
  return null;
}

test("account hydration keeps the server snapshot when bootstrap completes before a suspense boundary hydrates", async () => {
  const tree = (
    <StoreProvider>
      <SessionBootstrap />
      <Suspense fallback={null}>
        <CustomerRouteGuard>
          <h1>Account fixture</h1>
        </CustomerRouteGuard>
      </Suspense>
    </StoreProvider>
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(tree);
  expect(container.querySelector('[role="status"]')).toHaveTextContent(
    "Checking your session",
  );
  document.body.append(container);
  const recoverableError = jest.fn();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, tree, {
        onRecoverableError: recoverableError,
      });
    });
    expect(container.querySelector("h1")).toHaveTextContent("Account fixture");
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(recoverableError).not.toHaveBeenCalled();
  } finally {
    await act(async () => {
      root?.unmount();
    });
    container.remove();
  }
});
