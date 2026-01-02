'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Modal from '../shared/Modal';
import ContactForm from '../shared/ContactForm';
import DemoModal from './DemoModal';
import { IconButton } from '../shared/IconButton';
import { Button } from '../ui/Button';

export default function Hero() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    return (
        <section className="pt-32 pb-16 md:pt-48 md:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-5xl mx-auto">
                    <h1 className="text-2xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
                        "오늘도 대표님 죄송하지만.." 이라는 말로<br />
                        서류 제출을 요청하고 계신가요?<br />
                        <span className="text-primary">'오늘까지'가 대신해드릴게요.</span>
                    </h1>
                    <p className="text-xs md:text-xl text-gray-700 dark:text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                        제출 현황 대시보드, 미 제출자 자동 리마인드, 파일 자동 정리까지.<br />
                        흩어진 서류 수집/관리의 혼란을 '오늘까지'에서 끝내드려요.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                        <IconButton
                            as="link"
                            href="/dashboard"
                            variant="primary"
                            size="xl"
                            icon={<ArrowRight className="w-5 h-5" />}
                            iconPosition="right"
                        >
                            프로젝트 만들기
                        </IconButton>
                        <Button
                            variant="secondary"
                            size="xl"
                            onClick={() => setIsDemoModalOpen(true)}
                        >
                            데모 보기
                        </Button>
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

