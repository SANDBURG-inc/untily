import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-xl font-bold text-primary mb-4 inline-block">
                            오늘까지
                        </Link>
                        <p className="text-gray-700 dark:text-gray-400 text-sm max-w-xs">
                            번거로운 파일 제출, 이제 링크 하나로 끝.<br />
                            누구나 쉽게 문서 제출을 관리할 수 있는 올인원 플랫폼
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><Link href="#features" className="hover:text-primary">기능</Link></li>
                            <li><Link href="#solution" className="hover:text-primary">솔루션</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary">요금제</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        © 2024 오늘까지. All rights reserved.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        궁금한 점이 있으신가요? 고객센터 또는 1:1 문의를 이용해주세요.
                    </p>
                </div>
            </div>
        </footer>
    );
}
