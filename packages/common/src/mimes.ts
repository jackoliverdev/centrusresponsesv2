export const AUDIO_MIMES = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
};

export const VIDEO_MIMES = {
  'video/mp4': ['.mp4'],
  'video/mpeg': ['.mpeg'],
  'video/webm': ['.webm'],
};

export const TEXT_MIMES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/html': ['.html'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

export const ALL_MIMES = {
  ...TEXT_MIMES,
  ...AUDIO_MIMES,
  ...VIDEO_MIMES,
};

export const TRAIN_DOCUMENT_MIMES = {
  ...TEXT_MIMES,
  ...AUDIO_MIMES,
};

export const getKnowledgeBaseType = (filename: string) => {
  const extension = '.' + filename.split('.').pop() || '';
  const textExtensions = Object.values(TEXT_MIMES).flat();
  const audioExtensions = Object.values(AUDIO_MIMES).flat();

  if (textExtensions.includes(extension)) return 'text' as const;
  if (audioExtensions.includes(extension)) return 'audio' as const;
};
