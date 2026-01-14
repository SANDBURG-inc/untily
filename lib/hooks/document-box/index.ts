/**
 * DocumentBox 폼 관련 Custom Hooks
 *
 * @example
 * ```tsx
 * import { useDocumentBoxForm } from '@/lib/hooks/document-box';
 *
 * function MyForm() {
 *   const form = useDocumentBoxForm({ mode: 'create' });
 *   return <form onSubmit={form.handleSubmit}>...</form>;
 * }
 * ```
 */

// 메인 훅
export { useDocumentBoxForm } from './useDocumentBoxForm';

// 서브 훅 (개별 사용 가능)
export { useBasicInfo } from './useBasicInfo';
export { useTemplateFiles } from './useTemplateFiles';
export { useSubmitters } from './useSubmitters';
export { useRequirements } from './useRequirements';
export { useSubmissionSettings } from './useSubmissionSettings';
export { useFormSubmission } from './useFormSubmission';

// 타입
export type {
  DocumentBoxInitialData,
  UseDocumentBoxFormOptions,
  UseDocumentBoxFormReturn,
  UseBasicInfoOptions,
  UseBasicInfoReturn,
  UseTemplateFilesReturn,
  UseSubmittersOptions,
  UseSubmittersReturn,
  UseRequirementsOptions,
  UseRequirementsReturn,
  UseSubmissionSettingsOptions,
  UseSubmissionSettingsReturn,
  SubmitFormParams,
  ConfirmDialogData,
  UseFormSubmissionReturn,
} from './types';
