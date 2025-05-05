import { escapeRegExp } from 'lodash';
import { REGEX } from '@/utils/constants';

type Route = {
  path: string | RegExp;

  /**
   * Necessary if the path is a RegExp
   * @param params
   */
  getRoute?: (params: Record<string, string>) => string;

  /**
   * User needs to have proper authorization to
   * access this route.
   */
  isProtected?: boolean;

  /**
   * If another route isn't available, and the user IS NOT
   * authenticated, is redirected to this route.
   */
  isPublicFallback?: boolean;

  /**
   * If another route isn't available, and the user IS
   * authenticated, is redirected to this route.
   */
  isProtectedFallback?: boolean;
};

export class RouteHelper<RouteKey extends string> {
  private readonly routes: { [routeKey in RouteKey]: Route };
  private readonly routesAsValues: Route[];
  private readonly routesAsEntries: [RouteKey, Route][];
  private readonly publicFallbackRouteKey: RouteKey;
  private readonly protectedFallbackRouteKey: RouteKey;

  constructor(routes: typeof this.routes) {
    this.routes = routes;
    this.routesAsValues = Object.values(routes) as Route[];
    this.routesAsEntries = Object.entries(routes) as [RouteKey, Route][];

    if (
      this.routesAsValues.some(
        (route) =>
          (route as Route).path instanceof RegExp && !(route as Route).getRoute,
      )
    ) {
      throw new Error(
        `A route with a RegExp path needs to include a getRoute callback`,
      );
    }

    /*
      FIND PUBLIC FALLBACK ROUTE
     */
    const publicFallbackRoutes = this.routesAsEntries.filter(
      ([_, route]) => route.isPublicFallback,
    );

    if (publicFallbackRoutes.length !== 1) {
      throw new Error(
        `RouteHelper needs one, and only one, public fallback route `,
      );
    }

    this.publicFallbackRouteKey = publicFallbackRoutes[0][0];

    /*
      FIND PROTECTED FALLBACK ROUTE
     */
    const protectedFallbackRoutes = this.routesAsEntries.filter(
      ([_, route]) => route.isProtectedFallback,
    );

    if (protectedFallbackRoutes.length > 1) {
      throw new Error(`RouteHelper needs at most one private fallback route `);
    }

    // If there isn't any protected fallback routes, use the public one.
    this.protectedFallbackRouteKey = protectedFallbackRoutes.length
      ? protectedFallbackRoutes[0][0]
      : publicFallbackRoutes[0][0];
  }

  /**
   * Checks if a given pathname matches any of the
   * routes.
   */
  check(pathname: string) {
    const checkCallback = (route: Route) =>
      route.path instanceof RegExp
        ? (route.path as RegExp).test(pathname)
        : pathname === route.path;

    const includes = this.routesAsValues.some(checkCallback);
    const isProtected = this.routesAsValues
      .filter((route) => route.isProtected)
      .some(checkCallback);

    return {
      includes,
      isProtected,
    };
  }

  /**
   * Get the full path for a route, with the route
   * params. If the route doesn't have params, it just
   * returns the path string.
   * @param routeKey
   * @param routeParams
   */
  getPath(routeKey: RouteKey, routeParams?: Record<string, any>) {
    const route = this.routes[routeKey];
    if (route.getRoute) {
      return route.getRoute(routeParams ?? {});
    }

    return route.path as string;
  }

  getDefaultPath(routeParams?: Record<string, any>, isAuthenticated?: boolean) {
    return this.getPath(
      isAuthenticated
        ? this.protectedFallbackRouteKey
        : this.publicFallbackRouteKey,
      routeParams,
    );
  }
}

export const ADMIN_ROUTES = new RouteHelper({
  adminSignIn: {
    path: '/admin/sign-in',
    isPublicFallback: true,
  },
  adminDashboard: {
    path: '/admin/dashboard',
    isProtected: true,
    isProtectedFallback: true,
  },
  adminUsers: {
    path: '/admin/users',
    isProtected: true,
  },
  adminUser: {
    path: new RegExp(`${escapeRegExp(`/admin/users/`)}${REGEX.positiveInt}`),
    getRoute: (params: Record<'id', string>) => `/admin/users/${params.id}`,
  },
  adminOrganizations: {
    path: '/admin/organizations',
    isProtected: true,
  },
  adminOrganization: {
    path: new RegExp(
      `${escapeRegExp(`/admin/organizations/`)}${REGEX.positiveInt}`,
    ),
    getRoute: (params: Record<'id', string>) =>
      `/admin/organizations/${params.id}`,
  },
  adminAgents: {
    path: '/admin/agents',
    isProtected: true,
  },
});

const userAppRoutes = {
  signIn: {
    path: '/app/sign-in',
    isPublicFallback: true,
  },
  signUp: {
    path: '/app/sign-up',
  },
  dashboard: {
    path: '/app',
    isProtected: true,
  },
  chat: {
    path: '/app/chat',
    isProtected: true,
    isProtectedFallback: true,
  },
  agents: {
    path: '/app/agents',
    isProtected: true,
  },
  agentType: {
    path: new RegExp(`${escapeRegExp('/app/agents/')}[a-zA-Z_]+$`),
    getRoute: (params: Record<'type', string>) => `/app/agents/${params.type}`,
    isProtected: true,
  },
  agentInstance: {
    path: new RegExp(`${escapeRegExp('/app/agents/')}[a-zA-Z_]+/[0-9]+$`),
    getRoute: (params: Record<'type' | 'instanceId', string>) => 
      `/app/agents/${params.type}/${params.instanceId}`,
    isProtected: true,
  },
  trainFiles: {
    path: '/app/train/files',
    isProtected: true,
  },
  trainIntegrations: {
    path: '/app/train/integrations',
    isProtected: true,
  },
  trainWebsites: {
    path: '/app/train/websites',
    isProtected: true,
  },
  trainTextAudio: {
    path: '/app/train/text-audio',
    isProtected: true,
  },
  integrations: {
    path: '/app/integrations',
    isProtected: true,
  },
  users: {
    path: '/app/users',
    isProtected: true,
  },
  settingsAccount: {
    path: '/app/settings/account',
    isProtected: true,
  },
  settingsAIModel: {
    path: '/app/settings/ai-model',
    isProtected: true,
  },
  settingsOrganization: {
    path: '/app/settings/organization',
    isProtected: true,
  },
  settingsBilling: {
    path: '/app/settings/billing',
    isProtected: true,
  },
  settingsTags: {
    path: '/app/settings/tags',
    isProtected: true,
  },
  helpCenterArticles: {
    path: '/app/help-center/articles',
    isProtected: true,
  },
  helpCenterVideos: {
    path: '/app/help-center/videos',
    isProtected: true,
  },
  helpCenterPrompts: {
    path: '/app/help-center/prompts',
    isProtected: true,
  },
  helpCenterSupport: {
    path: '/app/help-center/support',
    isProtected: true,
  },
};

export const USER_APP_ROUTES = new RouteHelper(userAppRoutes);

export const ORG_ADMIN_ROUTES = new RouteHelper({
  users: userAppRoutes.users,
  dashboard: {
    ...userAppRoutes.dashboard,
    isProtected: false,
    isPublicFallback: true,
  },
});
