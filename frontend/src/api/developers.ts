import client from './client';
import type { Developer } from '../types';

export async function getDevelopers(skillIds?: number[]): Promise<Developer[]> {
  const params = skillIds && skillIds.length > 0 ? { skillIds: skillIds.join(',') } : {};
  const response = await client.get<Developer[]>('/developers', { params });
  return response.data;
}
