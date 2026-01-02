'use client';

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@/components/shared/UserButton";

export function DashboardHeader() {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src="/logo_light.svg" alt="오늘까지" width={128} height={32} className="h-8 w-auto" />
                </Link>

                <UserButton />
            </div>
        </header>
    );
}
