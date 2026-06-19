import { ChevronDown, LogOut, Settings } from "lucide-react";
import {
  data,
  Link,
  Outlet,
  useLocation,
  useLoaderData,
  type ShouldRevalidateFunctionArgs,
} from "react-router";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/server";
import type { Route } from "./+types/main";

type HeaderUser = {
  displayName: string;
  roleLabel: string;
  email: string;
};

type HeaderState = {
  label: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return data({ user: null }, { headers });
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const emailName = user.email?.split("@")[0] ?? "사용자";

  return data(
    {
      user: {
        displayName: teacher?.name?.trim() || emailName,
        roleLabel: teacher?.is_admin ? "학교 관리자" : "선생님",
        email: user.email ?? "",
      } satisfies HeaderUser,
    },
    { headers },
  );
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formMethod || actionResult !== undefined) {
    return defaultShouldRevalidate;
  }

  return (
    currentUrl.pathname === nextUrl.pathname &&
    currentUrl.search === nextUrl.search &&
    defaultShouldRevalidate
  );
}

export default function Main() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const headerState = getHeaderState(location.pathname);

  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh flex-col">
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 lg:px-6">
            <Link
              to="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-1 py-1 text-foreground transition-colors hover:text-primary"
            >
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-base font-semibold tracking-[-0.02em]">
                BeRO
              </span>
            </Link>

            <div className="min-w-0 flex-1 border-l border-border/70 pl-4">
              <p className="text-sm text-foreground">{headerState.label}</p>
            </div>

            {user ? (
              <HeaderUserMenu user={user} />
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link to="/login">로그인</Link>
              </Button>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function HeaderUserMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = useEffectEvent(() => {
    setOpen(false);
  });

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prevOpen) => !prevOpen)}
        className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {user.displayName} {user.roleLabel}
          </p>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-full overflow-hidden rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-foreground/5"
        >
          <MenuItem icon={<Settings className="size-4" />}>설정</MenuItem>
          <Link
            to="/logout"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            로그아웃
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground"
    >
      {icon}
      <span className="flex-1">{children}</span>
    </button>
  );
}

function getHeaderState(pathname: string): HeaderState {
  if (pathname === "/") {
    return {
      label: "홈",
    };
  }

  if (pathname === "/login") {
    return {
      label: "로그인",
    };
  }

  if (pathname === "/sign-up") {
    return {
      label: "회원가입",
    };
  }

  if (pathname === "/forgot-password") {
    return {
      label: "비밀번호 재설정",
    };
  }

  if (pathname === "/update-password") {
    return {
      label: "비밀번호 변경",
    };
  }

  if (pathname.startsWith("/teacher/register-class")) {
    return {
      label: "수업 등록",
    };
  }

  if (pathname.startsWith("/teacher/dashboard")) {
    return {
      label: "출석 현황",
    };
  }

  if (pathname.startsWith("/teacher/school-admin/register")) {
    return {
      label: "학교 등록 관리",
    };
  }

  if (pathname.startsWith("/student")) {
    return {
      label: "학생 리포트",
    };
  }

  return {
    label: "대시보드",
  };
}
