import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";
import { CopyableCredential } from "./copyable-credential";
import { CardCorners } from "@/components/ui/card-corners";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}): Promise<React.ReactElement> {
  const { next } = await searchParams;

  return (
    <div className="relative mx-auto flex w-full max-w-[480px] flex-col border border-white/10 bg-black/55 px-8 py-14 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:px-10 sm:py-16">
      <CardCorners className="!text-white/50" />
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h2 className="text-base font-semibold tracking-tight text-white">
          Welcome back.
        </h2>
        <p className="text-[13px] leading-relaxed text-white/55">
          Sign in to your workspaces. Demo accounts are seeded — click to
          copy:
          <br />
          <CopyableCredential value="demo@aspio.dev" />
          <span className="px-1 text-white/30">/</span>
          <CopyableCredential value="demo1234" />
        </p>
      </div>

      <div className="py-7">
        <SignInForm next={next} />
      </div>

      <p className="border-t border-white/10 pt-6 text-center text-[13px] text-white/55">
        New here?{" "}
        <Link
          href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
