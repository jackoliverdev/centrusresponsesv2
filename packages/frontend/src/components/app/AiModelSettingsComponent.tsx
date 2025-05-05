import {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { LoadingLayout } from '@/layouts/LoadingLayout';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import { OrganizationSchema } from 'common';
import { Select, Slider, Tag, Tooltip, Modal } from 'antd';
import { useUpdateUserAIContext } from '@/hooks/user/useUpdateUserAIContext';
import { useAuthContext } from '@/context/AuthContext';
import { useUpdateUser } from '@/hooks/user/useUpdateUser';
import { GlobalOutlined, FileOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Brain } from 'lucide-react';

const modelOptions: ModelOptionType[] = [
  {
    label: 'GPT-4 Omni',
    value: 'gpt-4o',
    released: '13/05/2024',
    webSearch: true,
    fileSearch: true,
    description: `OpenAIs legacy model with broad capabilities including file analysis, web search, and image attachments. This makes it a versatile all-rounder for a diverse range of tasks. (Knowledge cutoff: October 2023)`,
  },
  {
    label: 'GPT-4 Omni Mini',
    value: 'gpt-4o-mini',
    released: '18/07/2024',
    webSearch: true,
    fileSearch: true,
    description: `A speed-optimised variant of GPT-4 Omni that delivers almost the same quality in far less time. Supports file analysis, web search, and image attachments for quick, versatile responses. Not suitable for complex reasoning tasks.  (Knowledge cutoff: October 2023)`,
  },
  {
    label: 'O1',
    value: 'o1',
    released: '05/12/2024',
    webSearch: false,
    fileSearch: true,
    reasoning: true,
    description: `Specialised "thinking" model built for deep analytical reasoning and complex document analysis. This model is best for complex tasks where accuracy and step-by-step rigor are primary, with a tradeoff in speed. Supports file analysis, reasoning, and chat attachments. (Knowledge cutoff: October 2023)`,
  },
  {
    label: 'GPT-4.1 Nano',
    value: 'gpt-4.1-nano',
    released: '14/04/2025',
    webSearch: true,
    fileSearch: true,
    description: `Lightning-fast variant of GPT-4.1 for near-instant answers. This model is best for quick queries and real-time conversations when speed is critical. Not suitable for complex reasoning tasks. Supports file analysis, web search, and chat attachments. (Knowledge cutoff: June 2024)`,
  },
  {
    label: 'GPT-4.1 Mini',
    value: 'gpt-4.1-mini',
    released: '14/04/2025',
    webSearch: true,
    fileSearch: true,
    description: `Balanced variant of GPT-4.1 that combines excellent performance with faster response times. This model is best for most everyday business tasks that require a fine balance between quality and speed. Supports file analysis, web search, and chat attachments. (Knowledge cutoff: June 2024)`,
  },
  {
    label: 'GPT-4.1',
    value: 'gpt-4.1',
    released: '14/04/2025',
    webSearch: true,
    fileSearch: true,
    description: `This is the flagship model offering exceptional accuracy, speed, and a wide range of capabilities  allowing it to perform across a wide range of tasks. It's our default choice for professional use cases requiring comprehensive, high-quality outputs. Supports file analysis, web search, and chat attachments. (Knowledge cutoff: June 2024)`,
  },
  {
    label: 'O3 Mini',
    value: 'o3-mini',
    released: '16/04/2025',
    webSearch: false,
    fileSearch: true,
    reasoning: true,
    description: `Newest reasoning-focused model that excels at layered analytical problems balancing speed and accuracy. Does not process images or perform web searches. Use only when you require deeper reasoning than GPT-4.1. (Knowledge cutoff: October 2023)`,
  },
];

type Props = object;

type ModelOptionType = {
  label: string;
  value: string;
  released: string;
  webSearch: boolean;
  fileSearch: boolean;
  reasoning?: boolean;
  description: string;
};

export const AiModelSettingsComponent: FunctionComponent<PropsWithChildren<Props>> = ({}) => {
  const { data: organization, isLoading } = useOrganization();
  const { mutate: update, isLoading: isUpdating } = useUpdateOrganization();
  const { mutate: updateUserContext, isLoading: isUpdatingUserContext } = useUpdateUserAIContext();
  const { user } = useAuthContext();
  const { mutate: updateUser, isLoading: isUpdatingUser } = useUpdateUser();

  const [data, setData] = useState<
    Pick<OrganizationSchema, 'ai_context' | 'ai_model' | 'ai_temperature'>
  >({
    ai_temperature: 0.5,
    ai_model: 'gpt-4o',
    ai_context: '',
  });
  const [userContext, setUserContext] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [personalModel, setPersonalModel] = useState<string | undefined>(user?.ai_user_model);
  const [initialData, setInitialData] = useState<typeof data | null>(null);
  const [initialUserContext, setInitialUserContext] = useState<string>('');
  const [initialPersonalModel, setInitialPersonalModel] = useState<string | undefined>(user?.ai_user_model);
  const [personalTemperature, setPersonalTemperature] = useState<number>(user?.ai_user_temperature ?? 0.5);
  const [initialPersonalTemperature, setInitialPersonalTemperature] = useState<number>(user?.ai_user_temperature ?? 0.5);
  const [selectedModelForInfo, setSelectedModelForInfo] = useState<ModelOptionType | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<string | false>(false);

  const isMobileDropdown = typeof window !== 'undefined' && window.innerWidth <= 600;

  useEffect(() => {
    if (!organization) return;
    const { ai_temperature, ai_model, ai_context } = organization;
    const orgData = { ai_temperature, ai_model, ai_context };
    setData(orgData);
    setInitialData(orgData);
  }, [organization]);

  useEffect(() => {
    if (!user) return;
    setUserContext(user.aiUserContext || '');
    setPersonalModel(user.ai_user_model);
    setPersonalTemperature(typeof user.ai_user_temperature === 'number' ? user.ai_user_temperature : 0.5);
    setInitialUserContext(user.aiUserContext || '');
    setInitialPersonalModel(user.ai_user_model);
    setInitialPersonalTemperature(typeof user.ai_user_temperature === 'number' ? user.ai_user_temperature : 0.5);
  }, [user]);

  const resetToDefault = useCallback(() => {
    setData({
      ai_context:
        'You are Centrus, an AI assistant designed to enhance workplace efficiency by addressing employee inquiries, resolving issues promptly, and facilitating requests. Your goal is to provide precise and supportive assistance, actively listening to users, comprehending their needs, and delivering relevant information or guiding them to appropriate solutions. If a query is unclear, seek clarification to ensure accurate responses. Conclude interactions positively, ensuring users feel empowered and informed.',
      ai_model: 'gpt-4o',
      ai_temperature: 0.5,
    });
    setUserContext('');
    setPersonalModel(undefined);
  }, []);

  const handleDiscard = () => {
    if (initialData) setData(initialData);
    setUserContext(initialUserContext);
    setPersonalModel(initialPersonalModel);
    setPersonalTemperature(initialPersonalTemperature);
  };

  const handleSave = useCallback(() => {
    // Save organization settings
    update(data);
    // Save user context if it has changed
    if (user?.aiUserContext !== userContext) {
      updateUserContext(userContext);
    }
    // Save personal AI model or temperature if changed
    if (user?.ai_user_model !== personalModel || user?.ai_user_temperature !== personalTemperature) {
      updateUser({ ai_user_model: personalModel, ai_user_temperature: personalTemperature });
    }
  }, [data, update, userContext, updateUserContext, user, personalModel, personalTemperature, updateUser]);

  if (isLoading) return <LoadingLayout />;

  const { ai_context } = data;
  // Disable temperature slider for models that don't support it
  const noTempModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
  const tempDisabled = noTempModels.includes(data.ai_model);

  const renderModelOption = (option: ModelOptionType) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    const renderTags = (
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? 2 : 8, 
        minWidth: isMobile ? 'auto' : '400px',
        flexWrap: isMobile ? 'nowrap' : 'wrap'
      }}>
        {option.webSearch && (
          <Tag
            icon={<GlobalOutlined />}
            color="green"
            style={{
              fontSize: isMobile ? 9 : 12,
              padding: isMobile ? '0 2px' : '0 6px',
              height: isMobile ? 16 : 22,
              display: 'flex',
              alignItems: 'center',
              minWidth: isMobile ? '20px' : '100px',
              justifyContent: 'center',
            }}
          >
            {!isMobile && 'Web Search'}
          </Tag>
        )}
        {option.fileSearch && (
          <Tag
            icon={<FileOutlined />}
            color="purple"
            style={{
              fontSize: isMobile ? 9 : 12,
              padding: isMobile ? '0 2px' : '0 6px',
              height: isMobile ? 16 : 22,
              display: 'flex',
              alignItems: 'center',
              minWidth: isMobile ? '20px' : '100px',
              justifyContent: 'center',
            }}
          >
            {!isMobile && 'File Search'}
          </Tag>
        )}
        {option.reasoning && (
          <Tag
            icon={<Brain className={isMobile ? "h-3 w-3" : "h-3 w-3 mr-1"} />}
            color="orange"
            style={{
              fontSize: isMobile ? 9 : 12,
              padding: isMobile ? '0 2px' : '0 6px',
              height: isMobile ? 16 : 22,
              display: 'flex',
              alignItems: 'center',
              minWidth: isMobile ? '20px' : '100px',
              justifyContent: 'center',
              gap: isMobile ? '2px' : '4px'
            }}
          >
            {!isMobile && 'Reasoning'}
          </Tag>
        )}
      </div>
    );

    const handleInfoClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedModelForInfo(option);
      setShowInfoModal('model');
    };

    const infoButton = (
      <div onClick={handleInfoClick}>
        <InfoCircleOutlined style={{ marginLeft: 4, color: '#8c8c8c' }} />
      </div>
    );

    if (isMobile) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: '100%',
            padding: '1px 0',
            borderBottom: '1px solid #f0f0f0',
            paddingLeft: 2,
            fontSize: 12,
          }}
        >
          <span style={{ 
            fontWeight: 500, 
            fontSize: 12, 
            whiteSpace: 'nowrap',
            width: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {option.label}
          </span>
          {renderTags}
          {infoButton}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '4px 0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ width: '150px', flexShrink: 0 }}>
          <span style={{ fontWeight: 500, fontSize: 15, whiteSpace: 'nowrap' }}>
            {option.label}
          </span>
        </div>
        {renderTags}
        {infoButton}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Model settings</h2>
        <div className="space-y-4">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Label htmlFor="context">Organisation Context</Label>
              <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('org_context')} />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              This context applies to all users in your organisation.
            </p>
            <Textarea
              id="context"
              className="h-32 max-h-32 resize-none"
              value={ai_context}
              onChange={(e) => setData({ ...data, ai_context: e.target.value })}
            />
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Label htmlFor="userContext">Personal Context</Label>
              <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('personal_context')} />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              This context applies only to your conversations and is combined with the organisation context.
            </p>
            <Textarea
              id="userContext"
              className="h-24 max-h-24 resize-none"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="Add personal context to customise AI responses for you..."
            />
          </div>
          
          <div>
            <button
              type="button"
              className="text-blue-600 text-sm font-medium hover:underline focus:outline-none"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            </button>
          </div>
          {showAdvanced && (
            <div className="space-y-6 pt-2 pb-2 px-3 border border-gray-100 rounded">
              {/* Organisation Model Section */}
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Label htmlFor="ai_model" className="text-base font-semibold">Organisation AI Model</Label>
                  <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('org_model')} />
                </div>
                <Select
                  value={data.ai_model}
                  onChange={(value) => setData({ ...data, ai_model: value as OrganizationSchema['ai_model'] })}
                  options={modelOptions.map(opt => ({ value: opt.value, label: renderModelOption(opt) }))}
                  optionLabelProp="label"
                  style={{ width: '100%', height: '38px' }}
                  size="middle"
                  dropdownStyle={isMobileDropdown ? { width: '70vw', minWidth: 0, maxWidth: '75vw', left: '50%', transform: 'translateX(-50%)', margin: 0, padding: 0 } : { minWidth: 500 }}
                />
                <div className="flex flex-col mt-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Label htmlFor="org_ai_temperature" className="text-sm font-medium mb-0">Organisation Temperature: {data.ai_temperature.toFixed(2)}</Label>
                    <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('org_temperature')} />
                  </div>
                  {data.ai_model && !noTempModels.includes(data.ai_model) ? (
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={data.ai_temperature}
                      onChange={(value) => setData({ ...data, ai_temperature: value as number })}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="text-gray-500">
                      <p className="text-xs mt-1">Temperature is not supported for the selected reasoning model.</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Personal Model Section */}
              <div className="space-y-2 pt-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Label htmlFor="personal_ai_model" className="text-base font-semibold">Personal AI Model</Label>
                  <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('personal_model')} />
                </div>
                <Select
                  id="personal_ai_model"
                  value={personalModel}
                  onChange={setPersonalModel}
                  options={modelOptions.map(opt => ({ value: opt.value, label: renderModelOption(opt) }))}
                  optionLabelProp="label"
                  style={{ width: '100%', height: '38px' }}
                  size="middle"
                  placeholder="Select your preferred AI model"
                  allowClear
                  loading={isUpdatingUser}
                  dropdownStyle={isMobileDropdown ? { width: '70vw', minWidth: 0, maxWidth: '75vw', left: '50%', transform: 'translateX(-50%)', margin: 0, padding: 0 } : { minWidth: 500 }}
                />
                <div className="text-xs text-gray-500 mt-1 mb-2">This will override the organisation model for your account only.</div>
                <div className="flex flex-col gap-0.5">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Label htmlFor="personal_ai_temperature" className="text-sm font-medium mb-0">Personal Temperature: {personalTemperature.toFixed(2)}</Label>
                    <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('personal_temperature')} />
                  </div>
                  {personalModel && !noTempModels.includes(personalModel) ? (
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={personalTemperature}
                      onChange={setPersonalTemperature}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="text-gray-500">
                      <p className="text-xs mt-1">Temperature is not supported for the selected reasoning model.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-4 flex-wrap gap-4">
            <Button
              variant="outline"
              className="text-blue-600 hover:bg-blue-50"
              onClick={() => resetToDefault()}
              size="sm"
            >
              Reset to default
            </Button>
            <div className="flex gap-2">
              <Button
                className="bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                onClick={handleDiscard}
                size="sm"
                type="button"
              >
                Discard changes
            </Button>
            <Button
              className="bg-blue-900 text-white hover:bg-blue-800"
              disabled={isUpdating || isUpdatingUserContext}
              onClick={handleSave}
              size="sm"
            >
              Save changes
            </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        title={
          showInfoModal === 'org_context'
            ? 'What does Organisation Context do?'
            : showInfoModal === 'personal_context'
              ? 'What does Personal Context do?'
              : showInfoModal === 'org_model'
                ? 'What does Organisation AI Model do?'
                : showInfoModal === 'personal_model'
                  ? 'What does Personal AI Model do?'
                  : showInfoModal === 'org_temperature'
                    ? 'What does Organisation Temperature do?'
                    : showInfoModal === 'personal_temperature'
                      ? 'What does Personal Temperature do?'
                      : selectedModelForInfo?.label
        }
        open={showInfoModal !== false}
        onCancel={() => {
          setShowInfoModal(false);
          setSelectedModelForInfo(null);
        }}
        footer={null}
        destroyOnClose
      >
        {showInfoModal === 'org_context' ? (
          <div>
            <p>
              <strong>Organisation Context</strong> is the default background and instruction set for all users in your organisation. It provides the AI with essential information about your business, goals, and preferred communication style, ensuring consistent and relevant responses for everyone.
            </p>
          </div>
        ) : showInfoModal === 'personal_context' ? (
          <div>
            <p>
              <strong>Personal Context</strong> is combined with the organisation context, but only applies to your own conversations. Use this to tailor the AI's responses to your specific needs, preferences, or role, without affecting other users in your organisation.
            </p>
          </div>
        ) : showInfoModal === 'org_model' ? (
          <div>
            <p>
              <strong>Organisation AI Model</strong> sets the default AI model for all users in your organisation. This model will be used for everyone unless a user selects a personal AI model, in which case their personal choice will override this default for their account only.
            </p>
          </div>
        ) : showInfoModal === 'personal_model' ? (
          <div>
            <p>
              <strong>Personal AI Model</strong> only applies if you have selected a personal model. If set, this will override the organisation AI model for your account only, allowing you to customise your own AI experience.
            </p>
          </div>
        ) : showInfoModal === 'org_temperature' ? (
          <div>
            <p>
              <strong>Organisation Temperature</strong> sets the default creativity and variability for all users in your organisation. This value will apply to everyone unless a user sets a personal AI model, in which case their personal temperature setting will override this default for their account only.<br /><br />
              <strong>Temperature</strong> controls the creativity and variability of AI-generated responses. Lower values (e.g., 0.1–0.3) make outputs more focused, predictable, and deterministic—ideal for business-critical or compliance-driven tasks. Higher values (e.g., 0.7–1.0) encourage more creative, varied, and exploratory responses, which can be useful for brainstorming or open-ended tasks. For most professional use cases, a moderate setting (around 0.5) is recommended.
            </p>
          </div>
        ) : showInfoModal === 'personal_temperature' ? (
          <div>
            <p>
              <strong>Personal Temperature</strong> only applies if you have selected a personal AI model. If set, this will override the organisation temperature for your account only, allowing you to customise the creativity and variability of your own AI responses.<br /><br />
              <strong>Temperature</strong> controls the creativity and variability of AI-generated responses. Lower values (e.g., 0.1–0.3) make outputs more focused, predictable, and deterministic—ideal for business-critical or compliance-driven tasks. Higher values (e.g., 0.7–1.0) encourage more creative, varied, and exploratory responses, which can be useful for brainstorming or open-ended tasks. For most professional use cases, a moderate setting (around 0.5) is recommended.
            </p>
          </div>
        ) : (
          <p>{selectedModelForInfo?.description}</p>
        )}
      </Modal>
    </>
  );
};
