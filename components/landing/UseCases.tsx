import { Building2, GraduationCap, Briefcase, FileText } from "lucide-react";

const cases = [
    {
        icon: Building2,
        title: "공공기관 입찰 서류",
        description: "복잡한 입찰 서류를 누락 없이 한 번에 수집",
    },
    {
        icon: Briefcase,
        title: "기업 채용 지원서",
        description: "지원자별 포트폴리오와 이력서 체계적 관리",
    },
    {
        icon: GraduationCap,
        title: "교육기관 과제 제출",
        description: "학생 과제물 기한 내 자동 수합 및 관리",
    },
    {
        icon: FileText,
        title: "보험 서류 접수",
        description: "고객 청구 서류를 안전하게 접수 및 보관",
    },
];

export default function UseCases() {
    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        다양한 활용 사례
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-400">
                        입찰부터 채용까지, 어디서나 활용 가능한 문서 제출 플랫폼
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cases.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
