import { Link, Upload, CheckSquare, LayoutDashboard } from "lucide-react";

const steps = [
    {
        number: "1",
        title: "프로젝트 생성",
        description: "관리자는 프로젝트 생성 후 제출해야 할 파일 목록 설정",
        icon: LayoutDashboard,
    },
    {
        number: "2",
        title: "링크 공유",
        description: "생성된 제출 링크를 사용자에게 공유",
        icon: Link,
    },
    {
        number: "3",
        title: "파일 업로드",
        description: "사용자는 링크 접속 후 필요한 서류를 업로드",
        icon: Upload,
    },
    {
        number: "4",
        title: "실시간 확인",
        description: "관리자 페이지에서 업로드 현황 실시간 확인 가능",
        icon: CheckSquare,
    },
];

export default function Solution() {
    return (
        <section id="solution" className="py-24 bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        링크 한 번으로 끝나는<br />
                        제출 시스템
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-400">
                        Google Forms처럼 간단하지만, 파일 제출에 특화된 솔루션
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-center group hover:border-primary/50 transition-colors">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <step.icon className="w-8 h-8 text-primary" />
                                </div>
                                <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                                    {step.number}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
