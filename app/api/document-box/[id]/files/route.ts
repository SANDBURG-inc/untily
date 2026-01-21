import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ensureAuthenticated } from '@/lib/auth';
import { getSubmittedFilesForDownload } from '@/lib/queries/document-box';
import { s3Client, S3_BUCKET } from '@/lib/s3/client';

/**
 * 문서함의 제출 파일을 ZIP으로 다운로드
 * GET /api/document-box/[id]/files?submitterIds=id1,id2,id3
 * submitterIds가 없으면 전체 다운로드
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await ensureAuthenticated();
        const { id: documentBoxId } = await params;

        // 선택된 제출자 ID 파싱
        const submitterIdsParam = request.nextUrl.searchParams.get('submitterIds');
        const submitterIds = submitterIdsParam
            ? submitterIdsParam.split(',').filter(Boolean)
            : undefined;

        // 제출 파일 조회
        const result = await getSubmittedFilesForDownload(documentBoxId, user.id, submitterIds);

        if (!result) {
            return NextResponse.json(
                { error: '문서함을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const { files, boxTitle } = result;

        if (files.length === 0) {
            return NextResponse.json(
                { error: '다운로드할 파일이 없습니다.' },
                { status: 400 }
            );
        }

        // ZIP 파일 생성
        const zip = new JSZip();

        // 중복 파일명 추적 (제출자별로 구분)
        const fileNameCountMap = new Map<string, number>();

        // 제출자별 폴더로 파일 정리
        for (const file of files) {
            try {
                // S3에서 파일 가져오기
                const command = new GetObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: file.s3Key,
                });

                const response = await s3Client.send(command);
                const bodyStream = response.Body;

                if (!bodyStream) {
                    console.error(`Failed to get file body: ${file.s3Key}`);
                    continue;
                }

                // Stream to Buffer
                const chunks: Uint8Array[] = [];
                // @ts-expect-error - ReadableStream is iterable in Node.js
                for await (const chunk of bodyStream) {
                    chunks.push(chunk);
                }
                const fileBuffer = Buffer.concat(chunks);

                // 폴더 구조: {제출자이름}/{파일명}
                const folderName = sanitizeFolderName(file.submitterName);

                // 중복 파일명 처리 (같은 폴더 내 같은 파일명이면 순번 추가)
                const baseFilePath = `${folderName}/${file.filename}`;
                const count = fileNameCountMap.get(baseFilePath) || 0;
                fileNameCountMap.set(baseFilePath, count + 1);

                // 두 번째 이후 파일은 확장자 앞에 순번 추가
                let filePath = baseFilePath;
                if (count > 0) {
                    const ext = file.filename.split('.').pop() || '';
                    const nameWithoutExt = file.filename.replace(/\.[^.]+$/, '');
                    filePath = `${folderName}/${nameWithoutExt}_${count + 1}.${ext}`;
                }

                zip.file(filePath, fileBuffer);
            } catch (fileError) {
                console.error(`Failed to process file ${file.s3Key}:`, fileError);
                // 개별 파일 실패는 건너뛰고 계속 진행
                continue;
            }
        }

        // ZIP 생성
        const zipBuffer = await zip.generateAsync({
            type: 'arraybuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });

        // 파일명 생성 (한글 인코딩 처리)
        const sanitizedTitle = sanitizeFileName(boxTitle);
        const zipFileName = `${sanitizedTitle}_제출파일.zip`;

        return new Response(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(zipFileName)}`,
                'Content-Length': zipBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('ZIP download error:', error);
        return NextResponse.json(
            { error: '파일 다운로드 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * 폴더명으로 사용할 수 없는 문자 제거
 */
function sanitizeFolderName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

/**
 * 파일명으로 사용할 수 없는 문자 제거
 */
function sanitizeFileName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}
