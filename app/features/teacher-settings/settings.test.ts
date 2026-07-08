import { describe, expect, it } from "vitest";

import { toRequiredString } from "./settings";

describe("toRequiredString", () => {
  it("returns a Korean message for known required fields", () => {
    expect(() => toRequiredString("", "name")).toThrow("이름을 입력해 주세요.");
    expect(() => toRequiredString("", "classroomId")).toThrow(
      "교실을 선택해 주세요.",
    );
    expect(() => toRequiredString("", "email")).toThrow(
      "이메일을 입력해 주세요.",
    );
  });

  it("falls back to a generic Korean message for unknown fields", () => {
    expect(() => toRequiredString("", "unknownField")).toThrow(
      "필수 항목을 입력해 주세요.",
    );
  });
});
