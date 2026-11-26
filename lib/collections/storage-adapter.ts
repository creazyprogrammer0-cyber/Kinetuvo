import { PersonalCollection, SavedParameterPreset } from '@/types/encyclopedia';

const STORAGE_KEY = 'dde_personal_collection_v1';

export const DEFAULT_COLLECTION: PersonalCollection = {
  id: 'col-foundation-bookmarks',
  name: 'Foundation Study Collection',
  description: 'Saved interactive design concepts and customized parameter presets.',
  resourceSlugs: ['material-3-semantic-token-hierarchy', 'damped-harmonic-spring-choreography'],
  savedPresets: [],
  updatedAtIso: '2026-11-24T00:00:00.000Z',
};

export function loadPersonalCollection(): PersonalCollection {
  if (typeof window === 'undefined') {
    return DEFAULT_COLLECTION;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLLECTION;
    const parsed = JSON.parse(raw) as PersonalCollection;
    if (!parsed || !Array.isArray(parsed.resourceSlugs)) {
      return DEFAULT_COLLECTION;
    }
    return parsed;
  } catch {
    return DEFAULT_COLLECTION;
  }
}

export function savePersonalCollection(collection: PersonalCollection): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch {
    // Quota or private browsing fallback
  }
}

export function toggleBookmarkInCollection(
  current: PersonalCollection,
  resourceSlug: string
): PersonalCollection {
  const exists = current.resourceSlugs.includes(resourceSlug);
  const nextSlugs = exists
    ? current.resourceSlugs.filter((slug) => slug !== resourceSlug)
    : [...current.resourceSlugs, resourceSlug];

  const updated: PersonalCollection = {
    ...current,
    resourceSlugs: nextSlugs,
    updatedAtIso: new Date().toISOString(),
  };
  savePersonalCollection(updated);
  return updated;
}

export function addParameterPresetToCollection(
  current: PersonalCollection,
  preset: Omit<SavedParameterPreset, 'id' | 'createdAtIso'>
): PersonalCollection {
  const newPreset: SavedParameterPreset = {
    ...preset,
    id: `preset-${Date.now()}`,
    createdAtIso: new Date().toISOString(),
  };
  const updated: PersonalCollection = {
    ...current,
    savedPresets: [newPreset, ...current.savedPresets].slice(0, 12),
    updatedAtIso: new Date().toISOString(),
  };
  savePersonalCollection(updated);
  return updated;
}

export function removeParameterPresetFromCollection(
  current: PersonalCollection,
  presetId: string
): PersonalCollection {
  const updated: PersonalCollection = {
    ...current,
    savedPresets: current.savedPresets.filter((p) => p.id !== presetId),
    updatedAtIso: new Date().toISOString(),
  };
  savePersonalCollection(updated);
  return updated;
}
