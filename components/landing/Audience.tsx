import { Check } from "lucide-react";

const adminBenefits = [
    "원클릭 제출 링크 생성",
    "실시간 제출 현황 모니터링",
    "자동 리마인드 발송",
    "제출 데이터 일괄 다운로드",
];

const userBenefits = [
    "간편한 링크 접속",
    "드래그 앤 드롭 업로드",
    "자주 쓰는 파일 저장",
    "제출 완료 즉시 확인",
];

export default function Audience() {
    return (
        <section className="py-24 bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        모두를 위한 솔루션
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-400">
                        관리자와 사용자, 모두가 만족하는 문서 제출 경험
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Admin Card */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 lg:p-12 border border-gray-100 dark:border-gray-800">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold text-sm mb-6">
                            관리자
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            파일 제출 요청 → 확인까지<br />전 과정 자동화
                        </h3>
                        <ul className="space-y-4">
                            {adminBenefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-900 dark:text-gray-300 font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* User Card */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 lg:p-12 border border-gray-100 dark:border-gray-800">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm mb-6">
                            사용자
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            반복 제출 없이<br />저장된 파일로 빠르게 업로드
                        </h3>
                        <ul className="space-y-4">
                            {userBenefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-900 dark:text-gray-300 font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
