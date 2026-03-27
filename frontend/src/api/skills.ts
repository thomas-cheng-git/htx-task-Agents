import client from './client';
import type { Skill } from '../types';

export async function getSkills(): Promise<Skill[]> {
  const response = await client.get<Skill[]>('/skills');
  return response.data;
}
