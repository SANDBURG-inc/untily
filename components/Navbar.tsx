'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Modal from './Modal';
import ContactForm from './ContactForm';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <nav className="fixed w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/logo_light.svg" alt="오늘까지 로고" className="h-8 w-auto dark:hidden" />
                            <img src="/logo_dark.svg" alt="오늘까지 로고" className="h-8 w-auto hidden dark:block" />
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#features" className="text-sm font-medium text-gray-900 hover:text-primary dark:text-gray-100">
                            기능
                        </Link>
                        <Link href="#audience" className="text-sm font-medium text-gray-900 hover:text-primary dark:text-gray-100">
                            솔루션
                        </Link>
                        <Link href="#pricing" className="text-sm font-medium text-gray-900 hover:text-primary dark:text-gray-100">
                            요금제
                        </Link>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all transform hover:scale-105"
                        >
                            지금 시작하기
                        </button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <Link href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                            기능
                        </Link>
                        <Link href="#audience" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                            솔루션
                        </Link>
                        <Link href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                            요금제
                        </Link>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setIsModalOpen(true);
                            }}
                            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            지금 시작하기                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="서비스 알림받기"
            >
                <ContactForm onSuccess={() => setIsModalOpen(false)} />
            </Modal>
        </nav>
    );
}
