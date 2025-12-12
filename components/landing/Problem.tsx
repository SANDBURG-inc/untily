import { AlertTriangle, Clock, Inbox, XCircle } from "lucide-react";

const problems = [
    {
        icon: Inbox,
        title: "Messy inbox",
        description: "이메일 제출 요청의 불편함",
        stat: "미제출 15건",
    },
    {
        icon: Clock,
        title: "제출 요청 이후",
        description: "리마인드 기능 부재",
        stat: "시간 낭비",
    },
    {
        icon: AlertTriangle,
        title: "파일 제출",
        description: "재촉 연락의 부담",
        stat: "스트레스",
    },
    {
        icon: XCircle,
        title: "누락·중복 제출",
        description: "업무 비효율 증가",
        stat: "비효율",
    },
];

export default function Problem() {
    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        왜 아직도 이메일로<br />
                        파일을 주고받으시나요?
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-400">
                        비효율적인 문서 제출 프로세스로 인한 시간 낭비와 스트레스
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {problems.map((problem, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6">
                                <problem.icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {problem.title}
                            </h3>
                            <p className="text-gray-700 dark:text-gray-400 mb-4">
                                {problem.description}
                            </p>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {problem.stat}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
