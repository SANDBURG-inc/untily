'use client';

import Link from "next/link";
import { LegalLinks } from "@/components/legal";

export default function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-xl font-bold text-primary mb-3 inline-block">
                            오늘까지
                        </Link>
                        <p className="text-gray-700 dark:text-gray-400 text-sm max-w-xs">
                            번거로운 파일 제출, 이제 링크 하나로 끝.<br />
                            누구나 쉽게 문서 제출을 관리할 수 있는 올인원 플랫폼
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Product</h4>
                        <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <li><Link href="#features" className="hover:text-primary">기능</Link></li>
                            <li><Link href="#solution" className="hover:text-primary">솔루션</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary">요금제</Link></li>
                        </ul>
                    </div>
                </div>

                {/* 사업자 정보 */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-2">
                    <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                        <p>
                            사업자등록번호 : 880-86-02354 | 주식회사 샌드버그 | 대표이사 : 배호진
                        </p>
                        <p>
                            48400 부산광역시 남구 전포대로 133, 14층 111호(문현동, WeWork BIFC)
                        </p>
                        <p>
                            고객센터 : 051-711-4488 | 이메일 : contact@sandburg.co.kr
                        </p>
                    </div>

                    {/* 약관 링크 및 저작권 */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4">
                        <div className="flex items-center gap-2 text-xs">
                            <LegalLinks
                                linkClassName="text-xs"
                                dividerClassName="text-gray-300"
                            />
                            <span className="text-gray-300">|</span>
                            <a
                                href="mailto:contact@sandburg.co.kr"
                                className="text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                            >
                                제휴문의
                            </a>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            © 2024 오늘까지. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
