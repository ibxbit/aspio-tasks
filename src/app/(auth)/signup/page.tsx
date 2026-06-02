import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";
import { CardCorners } from "@/components/ui/card-corners";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage({
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
          Create your account.
        </h2>
        <p className="text-[13px] leading-relaxed text-white/55">
          We&apos;ll spin up a workspace you can invite others to.
        </p>
      </div>

      <div className="py-7">
        <SignUpForm next={next} />
      </div>

      <p className="border-t border-white/10 pt-6 text-center text-[13px] text-white/55">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
