import * as fs from 'fs';
import * as path from 'path';
import { ExpoAppBaseConfig, ExpoDynamicConfigFn } from '../../specs/008-expo-go-deploy/contracts/expo-go-deploy-contract';

describe('Expo Go Deploy & EAS Update Configuration (Feature 008 - Piupiu U Pattern)', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const origEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('maintains .env.example with EAS_PROJECT_ID, EXPO_OWNER, and EXPO_PUBLIC_BGG_API_TOKEN', () => {
    const envExamplePath = path.join(repoRoot, '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    expect(content).toContain('EAS_PROJECT_ID=');
    expect(content).toContain('EXPO_OWNER=');
    expect(content).toContain('EXPO_PUBLIC_BGG_API_TOKEN=');
  });

  it('configures app.json with runtimeVersion policy "sdkVersion" and metro web bundler', () => {
    const appJsonPath = path.join(repoRoot, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    expect(appJson.expo.runtimeVersion).toEqual({ policy: 'sdkVersion' });
    expect(appJson.expo.web?.bundler).toBe('metro');
  });

  it('defines start:go, update:preview, and update:prod scripts in package.json matching piapiupiu', () => {
    const pkgPath = path.join(repoRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.scripts['start:go']).toBe('expo start --go --tunnel -c');
    expect(pkg.scripts['update:preview']).toBe('npx eas-cli update --branch preview --auto');
    expect(pkg.scripts['update:prod']).toBe('npx eas-cli update --branch production --auto');
    expect(pkg.dependencies['expo-updates']).toBeDefined();
  });

  it('dynamically injects owner, extra.eas.projectId, and updates.url in app.config.js when env vars are set', () => {
    process.env.EAS_PROJECT_ID = '11111111-2222-3333-4444-555555555555';
    process.env.EXPO_OWNER = 'fpinatti';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configFn = require(path.join(repoRoot, 'app.config.js')) as ExpoDynamicConfigFn;
    const baseConfig: ExpoAppBaseConfig = {
      name: 'VirtualStand',
      slug: 'virtualstand',
      version: '1.0.0',
    };

    const resolved = configFn({ config: baseConfig });
    expect(resolved.owner).toBe('fpinatti');
    expect(resolved.extra?.eas?.projectId).toBe('11111111-2222-3333-4444-555555555555');
    expect(resolved.updates?.url).toBe(
      'https://u.expo.dev/11111111-2222-3333-4444-555555555555'
    );
  });

  it('preserves base config cleanly when EAS_PROJECT_ID and EXPO_OWNER are not set', () => {
    delete process.env.EAS_PROJECT_ID;
    delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    delete process.env.EXPO_OWNER;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configFn = require(path.join(repoRoot, 'app.config.js')) as ExpoDynamicConfigFn;
    const baseConfig: ExpoAppBaseConfig = {
      name: 'VirtualStand',
      slug: 'virtualstand',
      version: '1.0.0',
    };

    const resolved = configFn({ config: baseConfig });
    expect(resolved.owner).toBeUndefined();
    expect(resolved.extra?.eas).toBeUndefined();
    expect(resolved.updates).toBeUndefined();
  });

  it('ignores placeholder values like your-eas-project-uuid to allow eas project:init to link cleanly', () => {
    process.env.EAS_PROJECT_ID = 'your-eas-project-uuid';
    process.env.EXPO_OWNER = 'your-expo-username';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const configFn = require(path.join(repoRoot, 'app.config.js')) as ExpoDynamicConfigFn;
    const baseConfig: ExpoAppBaseConfig = {
      name: 'VirtualStand',
      slug: 'virtualstand',
      version: '1.0.0',
    };

    const resolved = configFn({ config: baseConfig });
    expect(resolved.owner).toBeUndefined();
    expect(resolved.extra?.eas).toBeUndefined();
    expect(resolved.updates).toBeUndefined();
  });
});
