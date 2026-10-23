import prisma from '../lib/prisma';
import cache from '../lib/cache';
import { config } from '../config';

export class SettingService {
  private static CACHE_KEY = 'system_settings';

  static async getAll(): Promise<Record<string, string>> {
    const cached = cache.get<Record<string, string>>(this.CACHE_KEY);
    if (cached) return cached;

    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = { ...config.settingsDefaults } as any;

    for (const s of settings) {
      map[s.key] = s.value;
    }

    cache.set(this.CACHE_KEY, map, 300); // 5 minutes cache
    return map;
  }

  static async getNumber(key: string, defaultValue: number): Promise<number> {
    const all = await this.getAll();
    if (all[key] !== undefined) {
      const parsed = parseFloat(all[key]);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultValue;
  }

  static async updateSettings(newSettings: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(newSettings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }

    cache.del(this.CACHE_KEY);
    return this.getAll();
  }
}
