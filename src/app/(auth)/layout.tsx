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
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background — the EtherealBeamsHero (3D beams + glow). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 [&_*]:pointer-events-none"
      >
        <EtherealBeamsHero />
      </div>

      {/* Dim the demo's centred text so our overlay reads cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-black/60"
      />

      {/* Foreground */}
      <div className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto]">
        {/* Vertical accent line — runs from top of header to bottom of main. */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-12 top-0 z-[1] w-px bg-white/[0.07] sm:left-16 lg:left-24"
        />

        <header className="relative flex items-center justify-between border-b border-white/[0.06] py-5 pl-20 pr-6 text-[11px] uppercase tracking-[0.18em] text-white/55 sm:pl-24 sm:pr-10 lg:pl-32 lg:pr-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-white transition-colors hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center bg-white text-[10px] font-mono font-bold text-black">
              a/
            </span>
            <span className="font-semibold tracking-[0.2em]">ASPIO</span>
            <span className="text-white/40">©2026</span>
          </Link>

          <a
            href="https://github.com/ibxbit/aspio-tasks"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-white/70 transition-colors hover:text-white"
          >
            VIEW REPO
            <ArrowUpRight className="h-3 w-3" />
          </a>

          {/* Cross marker at intersection of header bottom border × left vertical line */}
          <CrossMarker className="-bottom-[7px] left-12 -translate-x-1/2 z-20 !text-white/50 sm:left-16 lg:left-24" />
        </header>

        <main className="relative grid grid-cols-1 border-b border-white/[0.06] lg:grid-cols-[1fr_minmax(0,520px)]">
          <div className="relative flex flex-col justify-end border-b border-white/[0.06] py-10 pl-20 pr-6 sm:pl-24 sm:pr-10 lg:border-b-0 lg:border-r lg:border-white/[0.07] lg:py-16 lg:pl-32 lg:pr-12">
            <HeroSide />
            {/* Cross at top-right corner of hero column = top of column divider × header line */}
            <CrossMarker className="-right-[7px] -top-[7px] hidden !text-white/50 lg:block" />
            {/* Cross at bottom-right corner of hero column = bottom of column divider × main line */}
            <CrossMarker className="-bottom-[7px] -right-[7px] hidden !text-white/50 lg:block" />
          </div>
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
            {children}
          </div>

          {/* Cross at intersection of main bottom border × left vertical line */}
          <CrossMarker className="-bottom-[7px] left-12 -translate-x-1/2 z-20 !text-white/50 sm:left-16 lg:left-24" />
        </main>

        <footer className="flex items-center justify-between py-5 pl-20 pr-6 text-[10px] uppercase tracking-[0.18em] text-white/40 sm:pl-24 sm:pr-10 lg:pl-32 lg:pr-16">
          <span>Aspio Tasks — built for the take-home review.</span>
          <span className="hidden font-mono normal-case tracking-normal text-white/30 sm:inline">
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
      <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
        tasks that move at the
        <br />
        speed of your team.
      </h1>

      <p className="max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
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
              className="border border-white/15 bg-white/[0.03] px-2 py-1 text-white/70"
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
              className="border border-white/15 bg-white/[0.03] px-2 py-1 text-white/70"
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
          className="inline-flex items-center gap-1.5 border border-white/25 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
        >
          View source
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href="#"
          className="inline-flex items-center gap-1.5 border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          Read the brief
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
