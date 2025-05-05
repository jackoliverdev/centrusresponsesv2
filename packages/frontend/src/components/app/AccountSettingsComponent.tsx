import {
  FormEvent,
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { useUpdateUser } from '@/hooks/user/useUpdateUser';
import { UpdateProfileImage } from './UpdateProfileImage';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateUserAIContext } from '@/hooks/user/useUpdateUserAIContext';
import { Select, Modal, Tag, Tooltip, Slider } from 'antd';
import { GlobalOutlined, FileOutlined, CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Brain } from 'lucide-react';

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

export const AccountSettingsComponent: FunctionComponent<Props> = ({}) => {
  const { user, isOrgAdmin } = useAuthContext();
  const [selectedModelForInfo, setSelectedModelForInfo] = useState<ModelOptionType | null>(null);
  const [showInfoModal, setShowInfoModal] = useState<string | false>(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    position: '',
  });
  const [userContext, setUserContext] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [aiUserModel, setAiUserModel] = useState<string | undefined>(user?.ai_user_model);
  const [aiUserTemperature, setAiUserTemperature] = useState<number>(user?.ai_user_temperature ?? 0.5);
  const noTempModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];

  const { mutate: changePassword, isLoading: isChangingPassword } = useChangePassword();
  const { mutate: updateUser, isLoading: isUpdatingUser } = useUpdateUser();
  const { mutate: updateUserContext, isLoading: isUpdatingUserContext } = useUpdateUserAIContext();

  const isMobileDropdown = typeof window !== 'undefined' && window.innerWidth <= 600;

  const renderModelOption = (option: ModelOptionType) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;

    const renderTags = (
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? 2 : 8, 
        minWidth: isMobile ? 'auto' : '400px',
        flexWrap: isMobile ? 'nowrap' : 'nowrap',
        overflowX: isMobile ? 'auto' : undefined,
        whiteSpace: isMobile ? 'nowrap' : undefined,
        alignItems: 'center'
      }}>
        {option.webSearch && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f6f7f9',
            color: '#374151',
            borderRadius: 5,
            fontSize: isMobile ? 10 : 13,
            padding: isMobile ? '0 3px' : '0 12px',
            height: 22,
            fontWeight: 400,
            border: '1px solid #e5e7eb',
            minWidth: isMobile ? 70 : 120,
            maxWidth: isMobile ? 70 : 120,
            justifyContent: 'center',
            marginRight: 0,
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <GlobalOutlined style={{ fontSize: isMobile ? 11 : 14, marginRight: 3, color: '#9ca3af' }} />
            Web Search
          </span>
        )}
        {option.fileSearch && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f6f7f9',
            color: '#374151',
            borderRadius: 5,
            fontSize: isMobile ? 10 : 13,
            padding: isMobile ? '0 3px' : '0 12px',
            height: 22,
            fontWeight: 400,
            border: '1px solid #e5e7eb',
            minWidth: isMobile ? 70 : 120,
            maxWidth: isMobile ? 70 : 120,
            justifyContent: 'center',
            marginRight: 0,
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <FileOutlined style={{ fontSize: isMobile ? 11 : 14, marginRight: 3, color: '#9ca3af' }} />
            File Search
          </span>
        )}
        {option.reasoning && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f6f7f9',
            color: '#374151',
            borderRadius: 5,
            fontSize: isMobile ? 10 : 13,
            padding: isMobile ? '0 3px' : '0 12px',
            height: 22,
            fontWeight: 400,
            border: '1px solid #e5e7eb',
            minWidth: isMobile ? 70 : 120,
            maxWidth: isMobile ? 70 : 120,
            justifyContent: 'center',
            marginRight: 0,
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Brain style={{ width: isMobile ? 11 : 14, height: isMobile ? 11 : 14, fontSize: isMobile ? 10 : 13, marginRight: 3, color: '#9ca3af', display: 'inline-block', verticalAlign: 'middle' }} />
              <span style={{ fontSize: isMobile ? 10 : 13, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }}>Reasoning</span>
            </span>
          </span>
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

  const [initialUserData, setInitialUserData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    position: user?.profile?.position || '',
    aiUserModel: user?.ai_user_model,
    aiUserTemperature: typeof user?.ai_user_temperature === 'number' ? user.ai_user_temperature : 0.5,
    userContext: user?.aiUserContext || '',
  });

  useEffect(() => {
    if (!user) return;
    setUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      position: user.profile?.position || '',
    });
    setUserContext(user.aiUserContext || '');
    setAiUserModel(user.ai_user_model);
    setAiUserTemperature(typeof user.ai_user_temperature === 'number' ? user.ai_user_temperature : 0.5);
    setInitialUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      position: user.profile?.position || '',
      aiUserModel: user.ai_user_model,
      aiUserTemperature: typeof user.ai_user_temperature === 'number' ? user.ai_user_temperature : 0.5,
      userContext: user.aiUserContext || '',
    });
  }, [user]);

  const handleDiscardAll = useCallback(() => {
    setUserData({
      firstName: initialUserData.firstName,
      lastName: initialUserData.lastName,
      position: initialUserData.position,
    });
    setUserContext(initialUserData.userContext);
    setAiUserModel(initialUserData.aiUserModel);
    setAiUserTemperature(initialUserData.aiUserTemperature);
  }, [initialUserData]);

  const handleSaveAll = useCallback(
    (e?: FormEvent) => {
      if (e) e.preventDefault();
      const temp = typeof aiUserTemperature === 'number' ? aiUserTemperature : user?.ai_user_temperature ?? 0.5;
      updateUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        profile: { ...user?.profile, position: userData.position },
        ai_user_model: aiUserModel,
        ai_user_temperature: temp,
      });
      updateUserContext(userContext);
    },
    [userData, user, updateUser, aiUserModel, aiUserTemperature, userContext, updateUserContext],
  );

  const handleChangePassword = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      changePassword(
        { oldPassword, newPassword },
        {
          onSuccess: () => {
            setNewPassword('');
            setOldPassword('');
          },
        },
      );
    },
    [oldPassword, newPassword, changePassword],
  );

  const { firstName, lastName, position } = userData || {};
  return (
    <>
      <div className="space-y-6">
        {isOrgAdmin && <h2 className="text-2xl font-bold">Account</h2>}
        <div className="space-y-8">
          <form className="space-y-4" onSubmit={handleSaveAll}>
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                className="bg-gray-100"
                onChange={(e) =>
                  setUserData({ ...userData, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                className="bg-gray-100"
                onChange={(e) =>
                  setUserData({ ...userData, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                defaultValue={position}
                className="bg-gray-100"
                onChange={(e) =>
                  setUserData({ ...userData, position: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="position">Phone</Label>
              <Input
                id="phone"
                value={user?.phone || ''}
                className="bg-gray-100"
                readOnly
                disabled
              />
            </div>
            <UpdateProfileImage />

            {/* Personal AI Settings Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Personal AI Settings</h2>
              <div className="mb-4">
                <Label htmlFor="aiUserModel">Personal AI Model</Label>
                <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer', marginLeft: 6 }} onClick={() => setShowInfoModal('personal_model')} />
                <Select
                  id="aiUserModel"
                  value={aiUserModel}
                  onChange={setAiUserModel}
                  options={modelOptions.map(opt => ({ value: opt.value, label: renderModelOption(opt) }))}
                  style={{ width: '100%', height: '34px' }}
                  size="middle"
                  placeholder="Select your preferred AI model"
                  allowClear
                  optionLabelProp="label"
                  dropdownStyle={isMobileDropdown ? { width: '70vw', minWidth: 0, maxWidth: '75vw', left: '50%', transform: 'translateX(-50%)', margin: 0, padding: 0 } : { minWidth: 500 }}
                />
                {aiUserModel && !noTempModels.includes(aiUserModel) ? (
                  <div className="flex flex-col mt-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Label htmlFor="aiUserTemperature" className="text-sm font-medium mb-0">Personal Temperature: {aiUserTemperature.toFixed(2)}</Label>
                      <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('temperature')} />
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={aiUserTemperature}
                      onChange={value => setAiUserTemperature(typeof value === 'number' ? value : value[0])}
                      style={{ width: '100%' }}
                    />
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs mt-1">Temperature is not supported for the selected reasoning model.</div>
                )}
              </div>
              <div className="mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Label htmlFor="userContext" className="text-sm">Personal AI Context</Label>
                  <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer' }} onClick={() => setShowInfoModal('personal_context')} />
                </div>
                <Textarea
                  id="userContext"
                  className="h-24 max-h-24 resize-none bg-gray-100"
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="Add personal context to customise AI responses for you..."
                />
              </div>
            </div>

            {/* Profile-wide action buttons */}
            <div className="flex justify-start gap-2 mt-8">
              <Button
                className="bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                type="button"
                onClick={handleDiscardAll}
              >
                Discard changes
              </Button>
              <Button
                className="bg-blue-900 text-white hover:bg-blue-800"
                type="submit"
              >
                Save changes
              </Button>
            </div>

            {/* Password section */}
            <form onSubmit={handleChangePassword} className="mt-8">
              <h2 className="text-2xl font-bold">Password</h2>
              <p className="text-sm text-gray-500">
                Set a unique password to protect your account
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="oldPassword">Old Password</Label>
                  <Input
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="bg-gray-100"
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-gray-100"
                    type="password"
                    minLength={6}
                  />
                </div>

                <Button
                  variant="outline"
                  className="text-blue-500"
                  disabled={isChangingPassword}
                >
                  Update password
                </Button>
              </div>
            </form>
          </form>
        </div>
      </div>

      {/* Model Info Modal */}
      <Modal
        title={showInfoModal === 'personal_model' ? 'What does Personal AI Model do?' : showInfoModal === 'personal_context' ? 'What does Personal AI Context do?' : (selectedModelForInfo?.label || (showInfoModal === 'temperature' ? 'What does Temperature do?' : ''))}
        open={showInfoModal !== false}
        onCancel={() => {
          setShowInfoModal(false);
          setSelectedModelForInfo(null);
        }}
        footer={null}
        destroyOnClose
      >
        {showInfoModal === 'personal_model' ? (
          <div>
            <p>
              <strong>Personal AI Model</strong> If set, this will override any default organisation AI model for your account only, allowing you to customise your own AI experience.
            </p>
          </div>
        ) : showInfoModal === 'personal_context' ? (
          <div>
            <p>
              <strong>Personal AI Context</strong> is combined with any context set by your organisation, but personal context is only applied to your own conversations. Use this to tailor the AI's responses to your specific needs, preferences, or role, without affecting other users in your organisation.
            </p>
          </div>
        ) : showInfoModal === 'temperature' ? (
          <div>
            <p>
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
