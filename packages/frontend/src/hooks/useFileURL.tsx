import { useEffect, useState } from 'react';

export const useFileURL = (file?: File) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (file) setUrl(URL.createObjectURL(file));
    else setUrl('');
  }, [file]);
  return url;
};
