/**
 * @fileoverview 로고 조회 쿼리 모듈
 *
 * 문서함 ID를 기반으로 로고를 조회하는 함수를 제공합니다.
 * 로고 우선순위: 문서함 로고 > 담당자 기본 로고 > 시스템 로고
 *
 * @see {@link file://docs/logo/LOGO-SYSTEM.md} 로고 시스템 가이드
 * @module lib/queries/logo
 */
import "server-only";

import prisma from "@/lib/db";

/** 시스템 기본 로고 경로 */
const SYSTEM_LOGO = "/logo_light.svg";

/**
 * 문서함 ID로 로고 URL 조회
 *
 * 우선순위:
 * 1. 문서함 전용 로고 (type: DOCUMENT_BOX)
 * 2. 담당자 기본 로고 (type: DEFAULT)
 * 3. 시스템 기본 로고 (/logo_light.svg)
 *
 * @param documentBoxId 문서함 ID
 * @returns 로고 이미지 URL
 */
export async function getLogoForDocumentBox(
  documentBoxId: string
): Promise<string> {
  // 문서함 조회 (userId 확인용)
  const documentBox = await prisma.documentBox.findUnique({
    where: { documentBoxId },
    select: { userId: true },
  });

  if (!documentBox) {
    return SYSTEM_LOGO;
  }

  // 1순위: 문서함 전용 로고
  const documentBoxLogo = await prisma.logo.findFirst({
    where: {
      documentBoxId,
      type: "DOCUMENT_BOX",
    },
  });

  if (documentBoxLogo) {
    return documentBoxLogo.imageUrl;
  }

  // 2순위: 담당자 기본 로고
  const defaultLogo = await prisma.logo.findFirst({
    where: {
      userId: documentBox.userId,
      type: "DEFAULT",
      documentBoxId: null,
    },
  });

  if (defaultLogo) {
    return defaultLogo.imageUrl;
  }

  // 3순위: 시스템 기본 로고
  return SYSTEM_LOGO;
}

/**
 * 사용자 ID로 기본 로고 URL 조회
 *
 * 우선순위:
 * 1. 사용자 기본 로고 (type: DEFAULT)
 * 2. 시스템 기본 로고 (/logo_light.svg)
 *
 * @param userId 사용자 ID
 * @returns 로고 이미지 URL
 */
export async function getUserDefaultLogo(userId: string): Promise<string> {
  const defaultLogo = await prisma.logo.findFirst({
    where: {
      userId,
      type: "DEFAULT",
      documentBoxId: null,
    },
  });

  return defaultLogo?.imageUrl || SYSTEM_LOGO;
}
