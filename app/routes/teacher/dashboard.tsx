import { useRef, useState } from "react";

export default function TeacherSidebar() {
  const [className, setClassName] = useState("연애학개론 (M)");
  const [classNameEditable, setClassNameEditable] = useState(false);
  const classNameDivRef = useRef<HTMLDivElement>(null);
  const schedule = {
    3: "연애학개론",
    4: "연애학개론",
    7: "고급연대",
    8: "고급연대",
  };
  const students = [
    { id: 241101, name: "최정욱", attendance: false },
    { id: 241102, name: "최정욱", attendance: false },
    { id: 241103, name: "최정욱", attendance: false },
    { id: 241104, name: "최정욱", attendance: true },
    { id: 241105, name: "최정욱", attendance: true },
    { id: 241106, name: "최정욱", attendance: true },
    { id: 241107, name: "최정욱", attendance: true },
    { id: 241108, name: "최정욱", attendance: true },
    { id: 241109, name: "최정욱", attendance: true },
    { id: 241110, name: "최정욱", attendance: true },
    { id: 241111, name: "최정욱", attendance: true },
    { id: 241112, name: "최정욱", attendance: true },
    { id: 241113, name: "최정욱", attendance: true },
    { id: 241114, name: "최정욱", attendance: true },
    { id: 241115, name: "최정욱", attendance: true },
    { id: 241116, name: "최정욱", attendance: true },
  ];
  function getColumnCount(arr: any[]) {
    if (arr.length <= 16) return 4;
    return Math.ceil(Math.sqrt(arr.length));
  }
  function handleClassNameEdit() {
    const div = classNameDivRef.current!;
    setClassNameEditable(true);

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    div.focus();
  }
  function handleClassNameSave() {
    const div = classNameDivRef.current!;
    setClassNameEditable(false);
    setClassName(div.innerText);
  }
  function handleClassNameCancel() {
    const div = classNameDivRef.current!;
    setClassNameEditable(false);
    div.innerText = className;
  }
  return (
    <div className="flex w-full h-[calc(100vh-6rem)]">
      <div className="flex flex-col self-center justify-center h-full bg-[#D9D9D9]">
        <div className="text-[28px] border-b-2 border-black pt-5 pl-4 pb-2">
          2025/11/21 [금]
        </div>
        <div className=" flex flex-col gap-5 p-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
            <div
              key={period}
              className="text-[28px] [font-variant-numeric:tabular-nums] leading-none"
            >
              <span className="font-semibold">{period}.</span>{" "}
              {schedule[period] ?? "-"}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col grow self-center items-center px-28">
        <div className="flex w-full max-w-6xl mb-10 items-center">
          <div
            ref={classNameDivRef}
            className="text-[44px] mr-8 leading-none"
            contentEditable={classNameEditable}
            tabIndex={0}
          >
            연애학개론 (M)
          </div>
          {classNameEditable ? (
            <>
              <button
                onClick={handleClassNameSave}
                className="flex items-center justify-center leading-none bg-[#e4e4e4] text-[24px] px-5 py-2 rounded-[32px] hover:cursor-pointer mr-3"
              >
                저장
              </button>
              <button
                onClick={handleClassNameCancel}
                className="flex items-center justify-center leading-none bg-[#e4e4e4] text-[24px] px-5 py-2 rounded-[32px] hover:cursor-pointer"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={handleClassNameEdit}
              className="flex items-center justify-center leading-none bg-[#e4e4e4] text-[24px] px-5 py-2 rounded-[32px] hover:cursor-pointer"
            >
              수정
            </button>
          )}
        </div>
        <div
          className={`w-full max-w-6xl grid gap-2 ${students.length > 12 ? "content-stretch" : "grid-rows-4"} h-[480px]`}
          style={{
            gridTemplateColumns: `repeat(${getColumnCount(students)}, minmax(0, 1fr))`,
          }}
        >
          {students.map((student) => (
            <div
              className={`flex flex-col items-center justify-center border-6 border-[#92A2C1] ${student.attendance ? "bg-[#63D119]" : "bg-[#DB5555]"}`}
              key={student.id}
            >
              <div className="text-[36px]">{student.name}</div>
              <div className="text-[16px]">{student.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
