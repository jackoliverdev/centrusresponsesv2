import {
  BookOpen,
  Gauge,
  HelpCircle,
  MessageSquare,
  Settings,
  Users,
  Bot,
} from 'lucide-react';
import { USER_APP_ROUTES } from '@/routing/routes';
import { NavigationItem } from '@/routing/navigation/types';
import { GatewayOutlined } from '@ant-design/icons';

export const APP_NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    Icon: Gauge,
    path: USER_APP_ROUTES.getPath('dashboard'),
    adminOnly: true,
  },
  {
    id: 'chat',
    name: 'Chat',
    Icon: MessageSquare,
    path: USER_APP_ROUTES.getPath('chat'),
  },
  {
    id: 'agents',
    name: 'Agents',
    Icon: Bot,
    path: USER_APP_ROUTES.getPath('agents'),
  },
  {
    id: 'train',
    name: 'Train',
    Icon: BookOpen,
    path: USER_APP_ROUTES.getPath('trainFiles'),
    adminOnly: true,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    Icon: GatewayOutlined,
    path: USER_APP_ROUTES.getPath('integrations'),
    adminOnly: true,
  },
  {
    id: 'users',
    name: 'Edit users',
    Icon: Users,
    path: USER_APP_ROUTES.getPath('users'),
    adminOnly: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    subtitle: 'Update your account details',
    Icon: Settings,
    path: USER_APP_ROUTES.getPath('settingsAccount'),
  },
  {
    id: 'help',
    name: 'Help Center',
    subtitle: 'Get support and learn how to get the most out of Centrus',
    Icon: HelpCircle,
    path: USER_APP_ROUTES.getPath('helpCenterArticles'),
  },
] as const satisfies NavigationItem[];

export type NavigationItemId = (typeof APP_NAVIGATION_ITEMS)[number]['id'];

export type UserSettingsTab = {
  id: string;
  name: string;
  path: string;
  adminOnly?: boolean;
};

export const USER_SETTINGS_TABS = [
  {
    id: 'account',
    name: 'Account',
    path: USER_APP_ROUTES.getPath('settingsAccount'),
  },
  {
    id: 'billing',
    name: 'Billing',
    path: USER_APP_ROUTES.getPath('settingsBilling'),
    adminOnly: true,
  },
  {
    id: 'organisation',
    name: 'Organisation',
    path: USER_APP_ROUTES.getPath('settingsOrganization'),
    adminOnly: true,
  },
  {
    id: 'ai-model',
    name: 'AI Model',
    path: USER_APP_ROUTES.getPath('settingsAIModel'),
    adminOnly: true,
  },
  {
    id: 'tags',
    name: 'Tags',
    path: USER_APP_ROUTES.getPath('settingsTags'),
    adminOnly: true,
  },
] as const satisfies UserSettingsTab[];

export const HELP_CENTER_TABS = [
  {
    id: 'articles',
    name: 'Articles',
    path: USER_APP_ROUTES.getPath('helpCenterArticles'),
  },
  {
    id: 'videos',
    name: 'Videos',
    path: USER_APP_ROUTES.getPath('helpCenterVideos'),
  },
  {
    id: 'prompts',
    name: 'Prompts',
    path: USER_APP_ROUTES.getPath('helpCenterPrompts'),
  },
  {
    id: 'support',
    name: 'Support',
    path: USER_APP_ROUTES.getPath('helpCenterSupport'),
  },
] as const;
