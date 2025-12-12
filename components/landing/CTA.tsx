'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import ContactForm from '../shared/ContactForm';

export default function CTA() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <section id="pricing" className="py-24 bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-blue-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            지금 시작하기
                        </h2>
                        <p className="text-xl text-white mb-10">
                            복잡한 서류 제출을 가장 간단하게 바꿔보세요.<br />
                            5분이면 첫 프로젝트를 만들고 링크를 공유할 수 있습니다.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                            <Link
                                href="/dashboard"
                                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center"
                            >
                                무료로 시작하기 <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-blue-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>유연한 요금제</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>14일 무료 체험</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>언제든 해지 가능</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="서비스 알림받기"
            >
                <ContactForm onSuccess={() => setIsModalOpen(false)} />
            </Modal>
        </section>
    );
}
