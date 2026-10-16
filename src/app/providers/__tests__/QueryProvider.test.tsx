import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider } from "../QueryProvider";

const session = vi.hoisted(() => ({ accessToken: null as string | null }));

vi.mock("@/features/user/presentation/context/UserContext", () => ({
  useUser: () => session,
}));

function SensitiveValue() {
  const { data } = useQuery({
    queryKey: ["sensitive-user-data"],
    queryFn: async () => session.accessToken,
  });

  return <p>{data ?? "loading"}</p>;
}

describe("QueryProvider", () => {
  afterEach(() => {
    cleanup();
    session.accessToken = null;
  });

  it("does not reuse sensitive cached data after the authenticated user changes", async () => {
    session.accessToken = "user-a";
    const view = render(
      <QueryProvider><SensitiveValue /></QueryProvider>,
    );
    await waitFor(() => expect(screen.getByText("user-a")).toBeTruthy());

    session.accessToken = "user-b";
    view.rerender(<QueryProvider><SensitiveValue /></QueryProvider>);
    await waitFor(() => expect(screen.getByText("user-b")).toBeTruthy());
    expect(screen.queryByText("user-a")).toBeNull();
  });
});
