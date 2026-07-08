import { describe, expect, it, vi } from "vitest";

import { loader } from "../_index";
import { createClient } from "~/lib/supabase/server";

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

function createRequest(url = "https://example.com/") {
  return new Request(url);
}

function createLoaderArgs(request: Request): Parameters<typeof loader>[0] {
  return {
    request,
    params: {},
    context: {} as never,
    url: new URL(request.url),
    pattern: "/",
  } as unknown as Parameters<typeof loader>[0];
}

describe("home route loader", () => {
  it("redirects authenticated teachers to the dashboard", async () => {
    mockedCreateClient.mockReturnValue({
      headers: new Headers(),
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "teacher-user-1",
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table !== "teachers") {
            throw new Error(`unexpected table ${table}`);
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: "teacher-1" },
                }),
              })),
            })),
          };
        }),
      } as never,
    });

    const result = await loader(createLoaderArgs(createRequest()));

    expect(result).toBeInstanceOf(Response);

    if (!(result instanceof Response)) {
      throw new Error("expected redirect response");
    }

    expect(result.status).toBe(302);
    expect(result.headers.get("Location")).toBe("/teacher/dashboard");
  });

  it("does not redirect authenticated users without a teacher record", async () => {
    mockedCreateClient.mockReturnValue({
      headers: new Headers(),
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: "user-1",
              },
            },
          }),
        },
        from: vi.fn((table: string) => {
          if (table !== "teachers") {
            throw new Error(`unexpected table ${table}`);
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                }),
              })),
            })),
          };
        }),
      } as never,
    });

    const result = await loader(createLoaderArgs(createRequest()));

    expect(result).not.toBeInstanceOf(Response);
  });
});
