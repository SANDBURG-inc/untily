import Link from "next/link";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

export default async function SendSuccessPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const documentBox = await prisma.documentBox.findUnique({
        where: { documentBoxId: id },
        select: { boxTitle: true }
    });

    if (!documentBox) {
        notFound();
    }

    return (
        <main className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-10 max-w-md w-full text-center">
                {/* Frame for the icon */}
                <div className="mx-auto w-20 h-24 relative mb-8">
                    {/* Outline of a clipboard/document */}
                    <div className="absolute inset-0 border-2 border-green-500 rounded-lg"></div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-white border-2 border-green-500 rounded-t-md"></div>

                    {/* Success Checkmark */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="text-green-500 w-10 h-10" strokeWidth={3} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">이메일 발송 완료</h1>
                <p className="text-gray-500 mb-10">제출자에게 이메일 발송을 완료했습니다.</p>

                {/* Document Information Box */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">발송 문서</p>
                    <p className="text-lg font-bold text-slate-800">{documentBox.boxTitle}</p>
                </div>

                {/* Confirmation Button */}
                <Link
                    href={`/dashboard/${id}`}
                    className="block w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                    확인
                </Link>
            </div>
        </main>
    );
}
