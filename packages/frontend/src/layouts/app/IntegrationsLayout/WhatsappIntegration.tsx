import { FunctionComponent, useState } from 'react';
import { Modal, Button } from 'antd';
import Link from 'next/link';
import { USER_APP_ROUTES } from '@/routing/routes';
import { Info, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type WhatsappIntegrationProps = object;

export const WhatsappIntegration: FunctionComponent<
  WhatsappIntegrationProps
> = () => {
  const [infoVisible, setInfoVisible] = useState(false);
  
  const showInfo = () => {
    setInfoVisible(true);
  };

  const hideInfo = () => {
    setInfoVisible(false);
  };
  
  return (
    <>
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full">
              <svg viewBox="0 0 24 24" width="32" height="32" className="h-8 w-8 text-green-600">
                <path 
                  d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-xl text-foreground font-bold">WhatsApp</h2>
          </div>
          <Badge className="bg-blue-600 text-white border-0">
            Active
          </Badge>
        </div>
        
        <p className="mt-2 text-sm text-muted-foreground">
          Send and receive messages through WhatsApp.
          <span className="hidden md:inline"><br /></span>
          <span className="md:hidden"> </span>
          Connect with Centrus using the WhatsApp number below.
        </p>
        
        <div className="flex justify-center my-3">
          <p className="font-medium text-foreground text-lg">
            +44 7462 836662
          </p>
        </div>
        
        <div className="flex-grow">
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>Fast and secure messaging</li>
              <li>Access from any WhatsApp-enabled device</li>
              <li>Maintain conversation history</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          <button
            onClick={showInfo}
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <Info className="mr-2 h-4 w-4" />
            <span>How to Use</span>
          </button>
          <Link 
            href={USER_APP_ROUTES.getPath('helpCenterArticles')}
            className="w-1/2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Learn More</span>
          </Link>
        </div>
      </div>
      
      <Modal
        title="How to use WhatsApp with Centrus"
        open={infoVisible}
        onCancel={hideInfo}
        width={600}
        footer={[
          <Button key="close" onClick={hideInfo}>
            Close
          </Button>,
        ]}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div className="text-sm mb-4">
          <ol className="list-decimal pl-4 my-3 space-y-2">
            <li>Add this number as a contact in your phone</li>
            <li>Ensure your mobile number is correctly set in your user profile with country code (e.g. +44 for UK numbers)</li>
            <li>Send a message to Centrus via WhatsApp</li>
            <li>Centrus will recognise your number and ask you to confirm which tag you want to use</li>
            <li>After selecting a tag, you can chat normally as you would in the web app</li>
          </ol>
          <div className="mt-3">
            <p><strong>Special commands:</strong> Type <strong>RESTART CHAT</strong> (case sensitive) to reset the conversation</p>
          </div>
        </div>
      </Modal>
    </>
  );
};
