import { Button, Divider, Form, Input, List, Modal, Spin, message } from 'antd';
import { FunctionComponent, useMemo, useState } from 'react';
import { Documents } from './Documents';
import { DocumentUsage } from './DocumentUsage';
import { useAddWebsiteDocument } from '@/hooks/documents/useAddWebsiteDocument';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { CheckSquare, Globe, LinkIcon, Search } from 'lucide-react';
import { useScanWebsite } from '@/hooks/documents/useScanWebsite';
import { useCrawlWebsitePages } from '@/hooks/documents/useCrawlWebsitePages';

export type WebsitesTabProps = object;

export const WebsitesTab: FunctionComponent<WebsitesTabProps> = () => {
  const [form] = Form.useForm();
  const [scanForm] = Form.useForm();
  const { data: documents = [], isLoading: isLoadingDocuments } =
    useDocuments();
  const { mutate: addWebsiteDocument, isLoading: isLoadingAddWebsite } =
    useAddWebsiteDocument();

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanResults, setScanResults] = useState<{ url: string; title: string }[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const { mutate: scanWebsite, isLoading: isScanning } = useScanWebsite();
  const { mutate: crawlWebsitePages, isLoading: isCrawling } = useCrawlWebsitePages();

  const websiteDocuments = useMemo(
    () => documents.filter((doc) => doc.type === 'website'),
    [documents],
  );

  const handleScanWebsite = (values: { url: string }) => {
    scanWebsite(
      { url: values.url },
      {
        onSuccess: (data) => {
          if (data) {
            setScanResults(data);
            setSelectedPages([]);
          }
        },
        onError: () => {
          message.error('Failed to scan website. Please check the URL and try again.');
        },
      }
    );
  };

  const handleCrawlPages = () => {
    if (selectedPages.length === 0) {
      message.warning('Please select at least one page to crawl');
      return;
    }

    const websiteName = scanForm.getFieldValue('url').replace(/^https?:\/\//, '').split('/')[0];
    
    crawlWebsitePages(
      {
        urls: selectedPages,
        name: `${websiteName} (${selectedPages.length} pages)`,
      },
      {
        onSuccess: () => {
          message.success(`Successfully crawled ${selectedPages.length} pages from the website`);
          setIsScanModalOpen(false);
          setSelectedPages([]);
          setScanResults([]);
          scanForm.resetFields();
        },
      }
    );
  };

  const togglePageSelection = (url: string) => {
    if (selectedPages.includes(url)) {
      setSelectedPages(selectedPages.filter(pageUrl => pageUrl !== url));
    } else {
      if (selectedPages.length >= 5) {
        message.warning('You can select a maximum of 5 pages at a time.');
        return;
      }
      setSelectedPages([...selectedPages, url]);
    }
  };

  const selectAllPages = () => {
    if (selectedPages.length === scanResults.length) {
      setSelectedPages([]);
    } else {
      if (scanResults.length > 5) {
        setSelectedPages(scanResults.slice(0, 5).map(result => result.url));
        message.warning('You can select a maximum of 5 pages at a time. Only the first 5 have been selected.');
      } else {
        setSelectedPages(scanResults.map(result => result.url));
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border p-4">
        <div className="text-xl font-semibold mb-4">Website</div>
        <Form
          layout="vertical"
          onFinish={({ url }) =>
            void addWebsiteDocument(
              { url },
              { onSuccess: () => form.resetFields() },
            )
          }
          form={form}
        >
          <Form.Item
            label="Webpage"
            name="url"
            rules={[{ required: true }, { type: 'url' }]}
          >
            <Input />
          </Form.Item>
          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => {
                form.validateFields().then(values => {
                  scanForm.setFieldsValue(values);
                  setIsScanModalOpen(true);
                }).catch(() => {
                  // Form validation failed
                });
              }}
            >
              <div className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                <span>Scan Website</span>
              </div>
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoadingAddWebsite}
            >
              <div className="flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                <span>Crawl Website</span>
              </div>
            </Button>
          </div>
        </Form>
      </div>

      <Modal
        title="Website Scanner"
        open={isScanModalOpen}
        onCancel={() => {
          setIsScanModalOpen(false);
          setScanResults([]);
          setSelectedPages([]);
        }}
        width={800}
        footer={[
          <div key="prewarning" style={{ flex: 1, textAlign: 'left', color: '#64748b', fontSize: 13, display: 'inline-block', marginRight: 12 }}>
            You may select up to 5 pages at a time.
          </div>,
          <Button 
            key="select-all" 
            onClick={selectAllPages}
            disabled={scanResults.length === 0 || isScanning}
          >
            {selectedPages.length === scanResults.length && scanResults.length > 0 
              ? 'Deselect All' 
              : 'Select All'}
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setIsScanModalOpen(false)}
          >
            Cancel
          </Button>,
          <Button 
            key="crawl" 
            type="primary" 
            onClick={handleCrawlPages}
            disabled={selectedPages.length === 0 || isScanning || isCrawling}
            loading={isCrawling}
          >
            Crawl Selected Pages ({selectedPages.length})
          </Button>,
        ]}
      >
        <Form
          form={scanForm}
          layout="vertical"
          onFinish={handleScanWebsite}
          className="mb-4"
        >
          <div className="flex space-x-2">
            <Form.Item
              name="url"
              rules={[{ required: true }, { type: 'url' }]}
              className="flex-1 mb-0"
            >
              <Input placeholder="Enter website URL (e.g., https://example.com)" />
            </Form.Item>
            <Button
              type="primary"
              onClick={() => scanForm.submit()}
              loading={isScanning}
            >
              Scan
            </Button>
          </div>
        </Form>
        
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Scanning website for available pages...</p>
          </div>
        ) : scanResults.length > 0 ? (
          <List
            className="max-h-96 overflow-y-auto border rounded"
            itemLayout="horizontal"
            dataSource={scanResults}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer hover:bg-gray-50 ${
                  selectedPages.includes(item.url) ? 'bg-blue-50' : ''
                }`}
                onClick={() => togglePageSelection(item.url)}
              >
                <div className="flex items-center w-full p-2">
                  <div className="mr-3">
                    {selectedPages.includes(item.url) ? (
                      <CheckSquare className="h-5 w-5 text-blue-500" />
                    ) : (
                      <div className="h-5 w-5 border border-gray-300 rounded-sm" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium truncate">{item.title || 'Untitled Page'}</div>
                    <div className="text-sm text-gray-500 truncate">{item.url}</div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {scanForm.getFieldValue('url')
              ? 'No pages found. Try scanning a different website.'
              : 'Enter a website URL and click "Scan" to find available pages.'}
          </div>
        )}
      </Modal>

      <Divider>
        <div className="flex items-center gap-2 text-gray-600">
          <LinkIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Included Links</h2>
        </div>
      </Divider>
      <Documents documents={websiteDocuments} loading={isLoadingDocuments} />
      <DocumentUsage />
    </div>
  );
};
