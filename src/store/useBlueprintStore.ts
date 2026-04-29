import { create } from 'zustand';
import { Blueprint, Group, Subgroup } from '../@types/blueprint';

interface BlueprintState {
  // Estado
  blueprint: Blueprint | null;
  isLoading: boolean;

  // Ações principais
  setBlueprint: (blueprint: Blueprint | null) => void;
  setLoading: (loading: boolean) => void;

  // Ações de manipulação
  addGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
  addSubgroup: (groupId: string, subgroup: Subgroup) => void;
}

export const useBlueprintStore = create<BlueprintState>((set) => ({
  blueprint: null,
  isLoading: true,

  setBlueprint: (blueprint) => set({ blueprint }),
  
  setLoading: (isLoading) => set({ isLoading }),

  addGroup: (group) => 
    set((state) => {
      if (!state.blueprint) return state;
      return {
        blueprint: {
          ...state.blueprint,
          groups: [...state.blueprint.groups, group],
        },
      };
    }),

  removeGroup: (groupId) =>
    set((state) => {
      if (!state.blueprint) return state;
      return {
        blueprint: {
          ...state.blueprint,
          groups: state.blueprint.groups.filter((g) => g.id !== groupId),
        },
      };
    }),

  addSubgroup: (groupId, subgroup) =>
    set((state) => {
      if (!state.blueprint) return state;
      return {
        blueprint: {
          ...state.blueprint,
          groups: state.blueprint.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                subgroups: [...group.subgroups, subgroup],
              };
            }
            return group;
          }),
        },
      };
    }),
}));