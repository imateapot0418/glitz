import { Visualization } from '../types';
import { heroesVisualization } from './heroes';

const registry: Record<string, Visualization> = {
  heroes: heroesVisualization,
};

export function getVisualization(name: string): Visualization | undefined {
  return registry[name];
}

export function getAvailableVisualizations(): string[] {
  return Object.keys(registry);
}
