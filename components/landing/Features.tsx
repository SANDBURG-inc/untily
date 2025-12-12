import { Bell, FileText, Lock, Users, Calendar, Database } from "lucide-react";
import Image from "next/image";

const features = [
    {
        icon: Link,
        title: "파일 제출 링크 생성",
        description: "제출 문서 종류·개수 설정",
    },
    {
        icon: Bell,
        title: "자동 리마인드 기능",
        description: "제출 마감일 기반 알림 자동 발송",
    },
    {
        icon: Users,
        title: "문서 제출 현황 트래킹",
        description: "누가 무엇을 제출했는지 실시간 확인",
    },
    {
        icon: Database,
        title: "사용자 파일 아카이브 기능",
        description: "자주 제출하는 파일을 계정에 저장해 빠른 업로드 가능",
    },
    {
        icon: Lock,
        title: "보안 강화 저장소",
        description: "제출 문서 암호화 저장, 안전하게 관리",
    },
    {
        icon: Calendar,
        title: "마감일 관리",
        description: "프로젝트별 제출 기한 설정 및 자동 마감",
    },
];

import { Link } from "lucide-react";

export default function Features() {
    return (
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        문서 제출에 필요한<br />
                        모든 기능을 한 곳에
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-400">
                        파일 수집부터 관리까지, 완벽한 문서 제출 솔루션
                    </p>
                </div>

                {/* Dashboard Preview */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 mb-24 bg-white dark:bg-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-900/50 z-10" />
                    <div className="aspect-[16/9] w-full relative">
                        <Image
                            src="/preview.png"
                            alt="Dashboard Preview - 직관적인 대시보드 인터페이스"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-6">
                                <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
