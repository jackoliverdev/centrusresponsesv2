import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { AppLayout } from '@/layouts/app/AppLayout';
import { AccountSettingsComponent } from '@/components/app/AccountSettingsComponent';
import { useAuthContext } from '@/context/AuthContext';
import { OrganizationSettingsComponent } from '@/components/app/OrganizationSettingsComponent';
import { SettingsLayout } from '@/layouts/app/SettingsLayout';
import { AiModelSettingsComponent } from '@/components/app/AiModelSettingsComponent';
import { BillingSettingsComponent } from '@/components/app/BillingSettingsComponent';
import { TagsSettingsComponent } from '@/components/app/TagsSettingsComponent';
import { USER_SETTINGS_TABS } from '@/routing/navigation/app';
import { useMemo } from 'react';

type Props = object;

const SettingsPage: NextPage<Props> = ({}) => {
  const { isLoading, user } = useAuthContext();

  const router = useRouter();
  const { settingsPage } = router.query;

  // TODO: Check for non-recognized tabs
  const activeTab = useMemo(() => {
    if (typeof settingsPage !== 'string' || isLoading || !user) {
      return null;
    }
    return USER_SETTINGS_TABS?.find((t) => t.path === router.asPath) ?? null;
  }, [isLoading, router.asPath, settingsPage, user]);

  return (
    <AppLayout currentItemId="settings" subtitle="Update your account details">
      {activeTab && (
        <SettingsLayout activeTab={activeTab}>
          {settingsPage === 'organization' && <OrganizationSettingsComponent />}
          {settingsPage === 'billing' && <BillingSettingsComponent />}
          {settingsPage === 'ai-model' && <AiModelSettingsComponent />}
          {settingsPage === 'account' && <AccountSettingsComponent />}
          {settingsPage === 'tags' && <TagsSettingsComponent />}
        </SettingsLayout>
      )}
    </AppLayout>
  );
};

export default SettingsPage;
