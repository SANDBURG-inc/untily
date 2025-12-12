'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import ContactForm from '../shared/ContactForm';
import DemoModal from './DemoModal';

export default function Hero() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    return (
        <section className="pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
                        번거로운 파일 제출,<br />
                        <span className="text-primary">이제 링크 하나로 끝.</span>
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                        이메일 요청·재촉·누락 걱정 없이,<br className="md:hidden" /> 누구나 쉽게 문서 제출을 관리할 수 있는<br /> 올인원 파일 제출 플랫폼
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                        <Link href="/dashboard" className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            프로젝트 만들기 <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button onClick={() => setIsDemoModalOpen(true)} className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:bg-gray-800">
                            데모 보기
                        </button>
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

            <DemoModal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
            />
        </section>
    );
}

