import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AttendanceEditFields } from "./lecture-attendance-panel";

describe("AttendanceEditFields", () => {
  it("renders Korean attendance labels with per-student field names", () => {
    const markup = renderToStaticMarkup(
      <AttendanceEditFields
        students={[
          { id: "student-1", name: "Kim", num: "1", attendance: "present" },
          { id: "student-2", name: "Lee", num: "2", attendance: "sick leave" },
        ]}
      />,
    );

    expect(markup).toContain('name="attendance:student-1"');
    expect(markup).toContain('name="attendance:student-2"');
    expect(markup).toContain('aria-label="Kim 출결 상태"');
    expect(markup).toContain('aria-label="Lee 출결 상태"');
    expect(markup).toContain("1번 Kim");
    expect(markup).toContain("2번 Lee");
  });
});
