import { FC, useState } from 'react';
import { Puzzle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CustomIntegrationRequestModal from './CustomIntegrationRequestModal';

export const CustomIntegrationCard: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <>
      <div className="group flex flex-col hover:shadow-md transition-shadow border-2 border-primary bg-blue-50 rounded-md p-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <Puzzle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl text-primary font-bold">Request Custom Integration</h2>
          </div>
          <Badge className="bg-primary text-white border-0">
            Custom
          </Badge>
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          Request a custom integration tailored to your specific needs. Our team will work with you to create a bespoke solution.
        </p>
        
        <div className="flex-grow mt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold">We can build custom integrations for:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-gray-600">
              <li>Third-party services and platforms</li>
              <li>In-house systems and databases</li>
              <li>Workflow automation tools</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
            onClick={() => setModalOpen(true)}  
          >
            Submit Request
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
      
      <CustomIntegrationRequestModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default CustomIntegrationCard; 