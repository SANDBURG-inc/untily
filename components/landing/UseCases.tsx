import { Building2, GraduationCap, Briefcase, FileText } from "lucide-react";

const cases = [
    {
        icon: Building2,
        title: "스타트업 지원기관",
        description: "지원자/참여팀에게 제출요청이 많고, 마감·누락 관리가 핵심이라 정중한 리마인드와 제출 현황 공유로 운영 스트레스를 줄여요.",
    },
    {
        icon: Briefcase,
        title: "교육기관",
        description: "과제/서류/동의서 제출을 “반복적으로” 받아야 해서, 자동 리마인드 + 미제출자 분리 관리로 학습 운영이 매끄러워져요.",
    },
    {
        icon: GraduationCap,
        title: "에이전시/대행사",
        description: "클라이언트 피드백, 원고/소스 전달, 수정본 승인처럼 “확정이 늦어져서 일정이 밀리는” 일이 많아서 버전별 제출 링크 + 승인 마감 리마인드로 일정 지연을 확 줄여요.",
    },
    {
        icon: FileText,
        title: "기업 관리자",
        description: "증빙/동의/정산 자료를 여러 사람·거래처로부터 받아야 하니까, 요청 메시지 템플릿 + 마감 추적 + 자동 독촉으로 ‘서류 받는 일’을 시스템화해요.",
    },
];

export default function UseCases() {
    return (
        <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-5xl mx-auto mb-16">
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        '오늘까지'를 통해 다양한 상황에서 똑똑하게 커뮤니케이션하는 법.                    </h2>
                    <p className="text-sm md:text-lg text-gray-700 dark:text-gray-400">
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
