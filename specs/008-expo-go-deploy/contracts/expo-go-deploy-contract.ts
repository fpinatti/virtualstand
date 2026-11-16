/**
 * Contract: Expo Go & EAS Update Dynamic Configuration (Feature 008)
 */

export interface ExpoAppBaseConfig {
  name: string;
  slug: string;
  version: string;
  owner?: string;
  runtimeVersion?: {
    policy: 'sdkVersion' | 'appVersion' | 'nativeVersion' | 'fingerprint';
  };
  updates?: {
    url?: string;
  };
  extra?: {
    eas?: {
      projectId?: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ExpoConfigContext {
  config: ExpoAppBaseConfig;
}

export type ExpoDynamicConfigFn = (ctx: ExpoConfigContext) => ExpoAppBaseConfig;
