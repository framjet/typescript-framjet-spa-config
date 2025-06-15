import type { Configuration } from './config';

interface ConfigOptions {
  prefix?: string;
}

interface RuntimeDetection {
  isNode: boolean;
  isBrowser: boolean;
  isVite: boolean;
  isWebpack: boolean;
  isDeno: boolean;
  isBun: boolean;
}

export type ConfigKeys = keyof Configuration;

// noinspection JSUnusedGlobalSymbols
export class ConfigLoader {
  readonly #runtimeDetection: RuntimeDetection;
  #envCache: Record<string, string> = {};

  constructor() {
    this.#runtimeDetection = this.#detectRuntime();
    this.#loadEnvironmentVariables();
  }

  #detectRuntime() {
    const hasProcess = typeof process !== 'undefined';
    const hasWindow = typeof window !== 'undefined';
    const hasImportMeta =
      typeof (globalThis as any).importMeta !== 'undefined' ||
      typeof import.meta !== 'undefined';
    const hasDeno = typeof (globalThis as any).Deno !== 'undefined';
    const hasBun = typeof (globalThis as any).Bun !== 'undefined';

    return {
      isNode: hasProcess && !hasWindow && !hasDeno && !hasBun,
      isBrowser: hasWindow,
      isVite: hasImportMeta && hasWindow,
      isWebpack:
        hasWindow && typeof (window as any).__webpack_require__ !== 'undefined',
      isDeno: hasDeno,
      isBun: hasBun,
    };
  }

  #loadEnvironmentVariables(): void {
    // Node.js / Bun process.env
    if (typeof process !== 'undefined' && process.env) {
      Object.assign(this.#envCache, process.env);
    }

    // Vite import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      Object.assign(this.#envCache, (import.meta as any).env);
    }

    // Deno.env
    if (typeof (globalThis as any).Deno !== 'undefined') {
      try {
        const denoEnv = (globalThis as any).Deno.env.toObject();
        Object.assign(this.#envCache, denoEnv);
      } catch (e) {
        // Permission denied or other Deno env access issues
      }
    }

    // Browser window env (if injected)
    if (typeof window !== 'undefined') {
      // Check for common browser env patterns
      const windowEnv =
        (window as any).__ENV__ ||
        (window as any).env ||
        (window as any).process?.env;
      if (windowEnv) {
        Object.assign(this.#envCache, windowEnv);
      }
    }

    // Global env fallback
    if (typeof (globalThis as any).__ENV__ !== 'undefined') {
      Object.assign(this.#envCache, (globalThis as any).__ENV__);
    }
  }

  /**
   * Get a config value with multiple fallback strategies
   */
  get(
    key: ConfigKeys & string,
    options: ConfigOptions = {}
  ): string | undefined {
    const { prefix = '' } = options;
    const fullKey = prefix ? `${prefix}${key}` : key;

    let value: string | undefined;

    // Try different access patterns in order of preference
    value = this.#tryGetValue(fullKey);

    // If not found and no prefix was used, try with common prefixes
    if (value === undefined && !prefix) {
      const commonPrefixes = [
        'VITE_',
        'REACT_APP_',
        'VUE_APP_',
        'NEXT_PUBLIC_',
      ];
      for (const commonPrefix of commonPrefixes) {
        value = this.#tryGetValue(`${commonPrefix}${key}`);
        if (value !== undefined) break;
      }
    }

    return value;
  }

  /**
   * Get a config value with multiple fallback strategies
   */
  getTransformed<T>(
    key: ConfigKeys & string,
    transform: (value: string) => T,
    options: ConfigOptions = {}
  ): T | undefined {
    const value = this.get(key, options);

    if (value !== undefined) {
      try {
        return transform(value);
      } catch (e) {
        const { prefix = '' } = options;
        const fullKey = prefix ? `${prefix}${key}` : key;

        throw new Error(
          `Failed to transform config value for key "${fullKey}":`,
          e
        );
      }
    }

    return undefined;
  }

  #tryGetValue(key: string): string | undefined {
    // Check cache first
    if (key in this.#envCache) {
      return this.#envCache[key];
    }

    // Try process.env (Node.js, Bun)
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      const value = process.env[key];
      if (value !== undefined) {
        this.#envCache[key] = value;
        return value;
      }
    }

    // Try import.meta.env (Vite, modern bundlers)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const value = (import.meta as any).env[key];
      if (value !== undefined) {
        this.#envCache[key] = value;
        return value;
      }
    }

    // Try Deno.env
    if (typeof (globalThis as any).Deno !== 'undefined') {
      try {
        const value = (globalThis as any).Deno.env.get(key);
        if (value !== undefined) {
          this.#envCache[key] = value;
          return value;
        }
      } catch (e) {
        // Permission denied or other issues
      }
    }

    return undefined;
  }

  /**
   * Get a required config value, throws if not found
   */
  getRequired(key: ConfigKeys & string, options: ConfigOptions = {}): string {
    const value = this.get(key, options);
    if (value === undefined) {
      throw new Error(`Required config value "${key}" is not defined`);
    }
    return value;
  }

  /**
   * Get a config value with a default fallback
   */
  getWithDefault<T = string>(
    key: ConfigKeys & string,
    defaultValue: T,
    options: ConfigOptions = {}
  ): T {
    const value = this.get(key, options);
    return value !== undefined ? (value as unknown as T) : defaultValue;
  }

  /**
   * Get a boolean config value
   */
  getBoolean(
    key: ConfigKeys & string,
    options: ConfigOptions = {}
  ): boolean | undefined {
    return this.getTransformed(
      key,
      (value: string) => {
        const lower = value.toLowerCase();
        return (
          lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on'
        );
      },
      options
    );
  }

  /**
   * Get a number config value
   */
  getNumber(
    key: ConfigKeys & string,
    options: ConfigOptions = {}
  ): number | undefined {
    return this.getTransformed(
      key,
      (value: string) => {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Value "${value}" is not a valid number`);
        }
        return num;
      },
      options
    );
  }

  /**
   * Get a JSON config value
   */
  getJSON<T = any>(
    key: ConfigKeys & string,
    options: ConfigOptions = {}
  ): T | undefined {
    return this.getTransformed(
      key,
      (value: string) => JSON.parse(value),
      options
    );
  }

  /**
   * Get all config values with optional prefix filtering
   */
  getAll(prefix?: string): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(this.#envCache)) {
      if (!prefix || key.startsWith(prefix)) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Refresh the environment variables cache
   */
  refresh(): void {
    this.#envCache = {};
    this.#loadEnvironmentVariables();
  }

  /**
   * Get runtime information
   */
  getRuntime(): RuntimeDetection {
    return { ...this.#runtimeDetection };
  }

  /**
   * Set a value in the cache (for testing or runtime overrides)
   */
  set(key: ConfigKeys & string, value: string): void {
    this.#envCache[key] = value;
  }

  /**
   * Check if a key exists
   */
  has(key: ConfigKeys & string): boolean {
    return this.get(key) !== undefined;
  }
}

export const configLoader = new ConfigLoader();
export default configLoader;
