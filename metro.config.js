const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Evita múltiplas cópias de @firebase/app no bundle web quando firebase e firebase-admin
// resolvem versões diferentes em node_modules (causa "Component auth has not been registered yet").
const rootOrigin = path.join(__dirname, 'index.ts');
const firebaseSingletons = new Set([
  '@firebase/app',
  '@firebase/component',
  '@firebase/logger',
  '@firebase/util',
]);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const nextContext =
    platform === 'web' && firebaseSingletons.has(moduleName)
      ? { ...context, originModulePath: rootOrigin }
      : context;
  if (defaultResolveRequest) {
    return defaultResolveRequest(nextContext, moduleName, platform);
  }
  return context.resolveRequest(nextContext, moduleName, platform);
};

module.exports = config;
