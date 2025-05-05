import { FunctionComponent, useState } from 'react';
import { Button, Modal } from 'antd';
import { Puzzle, LinkIcon, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomIntegrationRequestModal } from '@/layouts/app/IntegrationsLayout/CustomIntegrationRequestModal';

export type CustomIntegrationCardProps = object;

export const CustomIntegrationCard: FunctionComponent<CustomIntegrationCardProps> = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  
  const showInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoVisible(true);
  };

  const hideInfo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInfoVisible(false);
  };

  return (
    <div className="group flex flex-col hover:shadow-md transition-shadow border-2 border-primary bg-blue-50 rounded-md p-4 h-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-full p-2">
            <Puzzle className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl text-primary font-bold">Custom Integration</h2>
        </div>
      </div>
      
      <p className="mt-2 text-sm text-gray-600">
        Request a custom integration tailored to your specific needs.<br />
        Our team will work with you to create a bespoke solution.
      </p>
      
      <div className="flex-grow">
        <div className="text-sm text-muted-foreground mt-4">
          <p className="font-semibold">We can build custom integrations for:</p>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-gray-600">
            <li>Third-party services and platforms</li>
            <li>In-house systems and databases</li>
            <li>Workflow automation tools</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 flex gap-2">
        <button
          className="w-1/2 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          onClick={() => setModalOpen(true)}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Request</span>
        </button>
        <button
          className="w-1/2 bg-white border-2 border-primary text-primary hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
          onClick={showInfo}
        >
          <Info className="mr-2 h-4 w-4" />
          <span>Learn More</span>
        </button>
      </div>
      
      <Modal
        title="How Custom Integrations Work"
        open={infoVisible}
        onCancel={() => hideInfo()}
        width={600}
        footer={[
          <Button key="close" onClick={() => hideInfo()}>
            Close
          </Button>,
        ]}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div className="text-sm mb-4" onClick={(e) => e.stopPropagation()}>
          <ol className="list-decimal pl-4 my-3 space-y-2">
            <li>Submit a request detailing your integration needs</li>
            <li>Our team will review your requirements and contact you</li>
            <li>We'll work together to design the perfect solution</li>
            <li>Our developers will build and test the integration</li>
            <li>Once approved, we'll deploy it to your environment</li>
          </ol>
          <div className="mt-3">
            <p><strong>Typical integration types:</strong> CRM systems, ERP platforms, custom databases, API connections, and more</p>
            <p className="mt-2"><strong>Timeline:</strong> Development time varies based on complexity, typically 2-4 weeks</p>
          </div>
        </div>
      </Modal>
      
      <CustomIntegrationRequestModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default CustomIntegrationCard; 