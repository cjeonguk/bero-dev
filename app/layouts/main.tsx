import { Outlet } from "react-router";

export default function Main() {
  return (
    <>
      <header>Bero</header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
