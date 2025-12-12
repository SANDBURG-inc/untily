import Link from "next/link";
import { UserButton } from "@stackframe/stack";

export function DashboardHeader() {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <img src="/logo_light.svg" alt="오늘까지" className="h-8" />
                </Link>
                <UserButton />
            </div>
        </header>
    );
}
