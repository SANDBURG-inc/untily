'use client';

import { useStackApp } from "@stackframe/stack";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const app = useStackApp();

    const onSubmit = async () => {
        if (!email) {
            setError('이메일을 입력해주세요.');
            return;
        }

        const result = await app.sendForgotPasswordEmail(email);

        if (result.status === 'error') {
            setError(result.error.message);
            setMessage('');
        } else {
            setError('');
            setMessage('비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.');
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-10 mb-8">
                <Image
                    src="/logo_light.svg"
                    alt="SANDBURG"
                    fill
                    className="object-contain"
                />
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm w-[400px]">
                <div className="flex flex-col items-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">비밀번호 찾기</h3>
                    <p className="text-gray-500 text-sm">가입한 이메일로 재설정 링크를 보내드립니다.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md">
                            {message}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">이메일</label>
                        <input
                            type="email"
                            placeholder="이메일을 입력해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors mt-2"
                    >
                        비밀번호 재설정 링크 보내기
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/sign-in"
                        className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                    >
                        로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
