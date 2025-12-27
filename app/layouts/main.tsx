import { Outlet } from "react-router";

export default function Main() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center bg-[#90baff] h-24 w-full text-white text-7xl pl-6">
        BeRO
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
