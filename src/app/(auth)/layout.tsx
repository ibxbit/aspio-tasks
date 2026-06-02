import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import EtherealBeamsHero from "@/components/ui/login";
import { CrossMarker } from "@/components/ui/cross-marker";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Dark theme: 3D beams + glow. Hidden in light mode so the page
          doesn't render a hard-black panel over the paper background. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block [&_*]:pointer-events-none"
      >
        <EtherealBeamsHero />
      </div>

      {/* Light theme: soft paper backdrop with a faint grid + warm glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 60%), radial-gradient(circle at 75% 70%, rgba(225,220,210,0.45), transparent 55%), linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 32px 32px, 32px 32px",
          backgroundColor: "var(--background)",
        }}
      />

      {/* Dim overlay — dark mode only, sharpens form contrast. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] hidden bg-black/60 dark:block"
      />

      {/* Foreground */}
      <div className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto]">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-12 top-0 z-[1] w-px bg-foreground/10 dark:bg-white/[0.07] sm:left-16 lg:left-24"
        />

        <header className="relative flex items-center justify-between border-b border-foreground/10 dark:border-white/[0.06] py-5 pl-20 pr-6 text-[11px] uppercase tracking-[0.18em] text-foreground/70 dark:text-white/55 sm:pl-24 sm:pr-10 lg:pl-32 lg:pr-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground transition-colors dark:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center bg-foreground text-[10px] font-mono font-bold text-background dark:bg-white dark:text-black">
              a/
            </span>
            <span className="font-semibold tracking-[0.2em]">ASPIO</span>
            <span className="text-foreground/40 dark:text-white/40">©2026</span>
          </Link>

          <a
            href="https://github.com/ibxbit/aspio-tasks"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-foreground/70 transition-colors hover:text-foreground dark:text-white/70 dark:hover:text-white"
          >
            VIEW REPO
            <ArrowUpRight className="h-3 w-3" />
          </a>

          <CrossMarker className="-bottom-[7px] left-12 -translate-x-1/2 z-20 dark:!text-white/50 sm:left-16 lg:left-24" />
        </header>

        <main className="relative grid grid-cols-1 border-b border-foreground/10 dark:border-white/[0.06] lg:grid-cols-[1fr_minmax(0,520px)]">
          <div className="relative flex flex-col justify-end border-b border-foreground/10 dark:border-white/[0.06] py-10 pl-20 pr-6 sm:pl-24 sm:pr-10 lg:border-b-0 lg:border-r lg:border-foreground/10 lg:dark:border-white/[0.07] lg:py-16 lg:pl-32 lg:pr-12">
            <HeroSide />
            <CrossMarker className="-right-[7px] -top-[7px] hidden dark:!text-white/50 lg:block" />
            <CrossMarker className="-bottom-[7px] -right-[7px] hidden dark:!text-white/50 lg:block" />
          </div>
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
            {children}
          </div>

          <CrossMarker className="-bottom-[7px] left-12 -translate-x-1/2 z-20 dark:!text-white/50 sm:left-16 lg:left-24" />
        </main>

        <footer className="flex items-center justify-between py-5 pl-20 pr-6 text-[10px] uppercase tracking-[0.18em] text-foreground/40 dark:text-white/40 sm:pl-24 sm:pr-10 lg:pl-32 lg:pr-16">
          <span>Aspio Tasks — built for the take-home review.</span>
          <span className="hidden font-mono normal-case tracking-normal text-foreground/30 dark:text-white/30 sm:inline">
            v0.1.0
          </span>
        </footer>
      </div>
    </div>
  );
}

function HeroSide(): React.ReactElement {
  return (
    <section className="flex max-w-2xl flex-col justify-end gap-8">
      <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-foreground dark:text-white sm:text-5xl lg:text-[3.75rem]">
        tasks that move at the
        <br />
        speed of your team.
      </h1>

      <p className="max-w-lg text-sm leading-relaxed text-foreground/65 dark:text-white/65 sm:text-base">
        Aspio gives every team a workspace, every workspace its projects, and
        every project a list that updates in real time. Built on Supabase with
        row-level security from byte zero.
      </p>

      <div className="flex flex-col gap-2 pt-2">
        <ul className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.16em]">
          {[
            "Workspaces",
            "Realtime",
            "Inline editing",
            "URL filters",
            "Optimistic",
            "Edge functions",
            "RLS-secured",
            "Server components",
          ].map((label) => (
            <li
              key={label}
              className="border border-foreground/15 bg-foreground/[0.03] px-2 py-1 text-foreground/70 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70"
            >
              {label}
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.16em]">
          {[
            "Next.js 16",
            "TypeScript strict",
            "Tailwind v4",
            "Postgres triggers",
            "PKCE auth",
          ].map((label) => (
            <li
              key={label}
              className="border border-foreground/15 bg-foreground/[0.03] px-2 py-1 text-foreground/70 dark:border-white/15 dark:bg-white/[0.03] dark:text-white/70"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        <a
          href="https://github.com/ibxbit/aspio-tasks"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-foreground/25 bg-foreground/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground/10 dark:border-white/25 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/10"
        >
          View source
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 border border-foreground/15 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground dark:border-white/15 dark:text-white/80 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Read the brief
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
