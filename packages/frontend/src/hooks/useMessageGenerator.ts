import { useMutation } from 'react-query';
import { runMessageGenerator, MessageGeneratorInputSchema, MessageGeneratorResultSchema } from 'common';
import { getAPI } from '@/utils/api';

const useMessageGenerator = () => {
  const runGenerator = useMutation<
    MessageGeneratorResultSchema, 
    unknown, 
    MessageGeneratorInputSchema
  >({
    mutationFn: async (input) => {
      console.log('Calling message generator API with:', input);
      const { post } = getAPI();
      try {
        const result = await post(runMessageGenerator, input);
        console.log('Message generator API result:', result);
        return result as MessageGeneratorResultSchema;
      } catch (error) {
        console.error('Message generator API failed:', error);
        throw error;
      }
    }
  });

  return {
    runGenerator
  };
};

export default useMessageGenerator; 