export class MessageGeneratorDto {
  instanceId: number;
  messageContext: string;
  platformType: 'email' | 'linkedin' | 'social_dm' | 'social_comment' | 'custom';
  customPlatform?: string;
  numberOfVariants: number;
  senderName?: string;
  documentIds?: string[];
} 