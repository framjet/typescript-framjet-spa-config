# @framjet/spa-config

A universal configuration loader for Single Page Applications that works seamlessly across different JavaScript runtimes and bundlers. Automatically detects your environment (Node.js, Browser, Vite, Webpack, Deno, Bun) and loads configuration from the appropriate sources.

## Features

- 🌐 **Universal Runtime Support**: Works in Node.js, browsers, Deno, Bun, and modern bundlers
- 🔧 **Auto-Detection**: Automatically detects your runtime environment
- 📦 **Bundler Integration**: Built-in support for Vite, Webpack, and other modern bundlers
- 🔒 **Type Safety**: Full TypeScript support with custom configuration interfaces
- 🎯 **Smart Fallbacks**: Tries multiple environment variable sources and common prefixes
- 🚀 **Zero Dependencies**: Lightweight with no external dependencies
- 🔄 **Caching**: Built-in caching with refresh capability
- 🛠 **Flexible API**: Multiple getter methods for different data types

## Installation

```bash
npm install @framjet/spa-config
```

```bash
yarn add @framjet/spa-config
```

```bash
pnpm add @framjet/spa-config
```

## Quick Start

### 1. Define Your Configuration Interface

```typescript
// src/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    API_URL: string;
    API_KEY: string;
    DEBUG_MODE: string;
    MAX_RETRIES: string;
    FEATURE_FLAGS: string;
  }
}
```

### 2. Use the Config Loader

```typescript
import { configLoader } from '@framjet/spa-config';

// Basic usage
const apiUrl = configLoader.get('API_URL');
const apiKey = configLoader.getRequired('API_KEY'); // Throws if not found

// Type-safe getters
const debugMode = configLoader.getBoolean('DEBUG_MODE');
const maxRetries = configLoader.getNumber('MAX_RETRIES');
const featureFlags = configLoader.getJSON('FEATURE_FLAGS');

// With defaults
const timeout = configLoader.getWithDefault('TIMEOUT', 5000);
```

## Environment Variable Sources

The loader automatically tries multiple sources based on your runtime:

### Node.js / Bun
```bash
# .env file or process.env
API_URL=https://api.example.com
DEBUG_MODE=true
```

### Vite
```bash
# .env file with VITE_ prefix
VITE_API_URL=https://api.example.com
VITE_DEBUG_MODE=true
```

### React (Create React App)
```bash
# .env file with REACT_APP_ prefix
REACT_APP_API_URL=https://api.example.com
REACT_APP_DEBUG_MODE=true
```

### Next.js
```bash
# .env file with NEXT_PUBLIC_ prefix
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_DEBUG_MODE=true
```

### Deno
```typescript
// Use Deno.env
Deno.env.set('API_URL', 'https://api.example.com');
```

### Browser (Runtime Injection)
```javascript
// Inject via window object
window.__ENV__ = {
  API_URL: 'https://api.example.com',
  DEBUG_MODE: 'true'
};
```

## API Reference

### Basic Methods

#### `get(key, options?)`
Get a configuration value with automatic fallbacks.

```typescript
const value = configLoader.get('API_URL');
const prefixedValue = configLoader.get('API_URL', { prefix: 'CUSTOM_' });
```

#### `getRequired(key, options?)`
Get a required configuration value. Throws an error if not found.

```typescript
const apiKey = configLoader.getRequired('API_KEY');
```

#### `getWithDefault(key, defaultValue, options?)`
Get a configuration value with a default fallback.

```typescript
const timeout = configLoader.getWithDefault('TIMEOUT', 5000);
const retries = configLoader.getWithDefault('MAX_RETRIES', 3);
```

### Type-Safe Getters

#### `getBoolean(key, options?)`
Parse string values as booleans. Accepts: `'true'`, `'1'`, `'yes'`, `'on'` (case-insensitive).

```typescript
const isDebug = configLoader.getBoolean('DEBUG_MODE'); // true | false | undefined
```

#### `getNumber(key, options?)`
Parse string values as numbers. Throws if the value is not a valid number.

```typescript
const port = configLoader.getNumber('PORT'); // number | undefined
const maxRetries = configLoader.getNumber('MAX_RETRIES');
```

#### `getJSON(key, options?)`
Parse JSON string values. Throws if the JSON is invalid.

```typescript
interface FeatureFlags {
  newDashboard: boolean;
  betaFeatures: boolean;
}

const flags = configLoader.getJSON<FeatureFlags>('FEATURE_FLAGS');
```

#### `getTransformed(key, transform, options?)`
Apply a custom transformation function to the raw string value.

```typescript
const urls = configLoader.getTransformed(
  'API_URLS',
  (value) => value.split(',').map(url => url.trim()),
  { prefix: 'CUSTOM_' }
);
```

### Utility Methods

#### `getAll(prefix?)`
Get all configuration values, optionally filtered by prefix.

```typescript
const allConfig = configLoader.getAll();
const viteConfig = configLoader.getAll('VITE_');
```

#### `has(key)`
Check if a configuration key exists.

```typescript
if (configLoader.has('OPTIONAL_FEATURE')) {
  // Feature is configured
}
```

#### `refresh()`
Refresh the internal cache and reload environment variables.

```typescript
configLoader.refresh();
```

#### `set(key, value)`
Set a value in the cache (useful for testing or runtime overrides).

```typescript
configLoader.set('TEST_MODE', 'true');
```

#### `getRuntime()`
Get information about the detected runtime environment.

```typescript
const runtime = configLoader.getRuntime();
console.log(runtime);
// {
//   isNode: false,
//   isBrowser: true,
//   isVite: true,
//   isWebpack: false,
//   isDeno: false,
//   isBun: false
// }
```

## Framework Examples

### React with Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Vite automatically loads .env files
});
```

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_API_KEY=your-api-key
VITE_DEBUG_MODE=true
```

```typescript
// src/api.ts
import { configLoader } from '@framjet/spa-config';

const API_URL = configLoader.getRequired('API_URL');
const API_KEY = configLoader.getRequired('API_KEY');
const DEBUG = configLoader.getBoolean('DEBUG_MODE') ?? false;

export const apiClient = new APIClient({
  baseURL: API_URL,
  apiKey: API_KEY,
  debug: DEBUG
});
```

### Vue with Vite

```typescript
// src/types/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    API_URL: string;
    API_KEY: string;
    DEV_MODE: string;
    MAX_RETRIES: string;
  }
}
```

```typescript
// src/config/index.ts
import { configLoader } from '@framjet/spa-config';

export const config = {
  apiUrl: configLoader.getRequired('API_URL'),
  apiKey: configLoader.getRequired('API_KEY'),
  isDevelopment: configLoader.getBoolean('DEV_MODE') ?? false,
  maxRetries: configLoader.getNumber('MAX_RETRIES') ?? 3
};
```

### Node.js Backend

```typescript
// types/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    PORT: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}
```

```typescript
// server.ts
import { configLoader } from '@framjet/spa-config';

const PORT = configLoader.getNumber('PORT') ?? 3000;
const DATABASE_URL = configLoader.getRequired('DATABASE_URL');
const JWT_SECRET = configLoader.getRequired('JWT_SECRET');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Next.js

```typescript
// types/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    API_URL: string;
    FEATURE_FLAGS: string;
  }
}
```

```typescript
// lib/config.ts
import { configLoader } from '@framjet/spa-config';

export const clientConfig = {
  apiUrl: configLoader.getRequired('API_URL'), // NEXT_PUBLIC_API_URL
  features: configLoader.getJSON('FEATURE_FLAGS') ?? {}
};
```

## Advanced Usage

### Custom Prefixes

```typescript
// Look for CUSTOM_API_URL instead of API_URL
const apiUrl = configLoader.get('API_URL', { prefix: 'CUSTOM_' });
```

### Runtime Environment Detection

```typescript
import { configLoader } from '@framjet/spa-config';

const runtime = configLoader.getRuntime();

if (runtime.isNode) {
  // Node.js specific logic
} else if (runtime.isBrowser) {
  // Browser specific logic
  if (runtime.isVite) {
    // Vite specific optimizations
  }
}
```

### Testing

```typescript
// test/config.test.ts
import { configLoader } from '@framjet/spa-config';

beforeEach(() => {
  configLoader.set('TEST_API_URL', 'http://localhost:3001');
  configLoader.set('TEST_DEBUG', 'true');
});

afterEach(() => {
  configLoader.refresh(); // Reset to actual environment
});
```

## TypeScript Support

Extend the `Configuration` interface using module augmentation to add type safety for your specific configuration keys:

```typescript
// src/types/config.ts or src/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    API_URL: string;
    API_KEY: string;
    DEBUG_MODE: string;
    MAX_RETRIES: string;
    TIMEOUT: string;
    FEATURE_FLAGS: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}
```

This approach allows multiple modules or packages to extend the same configuration interface without conflicts. The loader will now provide autocompletion and type checking for these keys.

### Multiple Module Augmentation

Different parts of your application can extend the configuration independently:

```typescript
// src/api/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    API_URL: string;
    API_KEY: string;
    API_TIMEOUT: string;
  }
}

// src/database/config.ts  
declare module "@framjet/spa-config" {
  interface Configuration {
    DATABASE_URL: string;
    DATABASE_POOL_SIZE: string;
  }
}

// src/auth/config.ts
declare module "@framjet/spa-config" {
  interface Configuration {
    JWT_SECRET: string;
    JWT_EXPIRY: string;
    OAUTH_CLIENT_ID: string;
  }
}
```

## Contributing

Contributions to `@framjet/spa-config` are welcome! If you encounter any issues or have suggestions for improvements, please feel free to submit a pull request or open an issue on the project's repository.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
