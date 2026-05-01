import { create } from 'zustand';
import type { Blueprint, Group, Subgroup } from '@/types/blueprint';
import { blueprintService } from '@/services/blueprintService';
import { toast } from 'sonner';

interface BlueprintState {
  // Estado
  blueprint: Blueprint | null;
  isLoading: boolean;

  // Ações principais
  setBlueprint: (blueprint: Blueprint | null) => void;
  setLoading: (loading: boolean) => void;

  // Ações de manipulação
  addGroup: (group: Group) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  addSubgroup: (groupId: string, subgroup: Subgroup) => Promise<void>;
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: null,
  isLoading: true,

  setBlueprint: (blueprint) => set({ blueprint }),
  setLoading: (isLoading) => set({ isLoading }),

  addGroup: async (group) => {
    const currentState = get();
    if (!currentState.blueprint) return;

    const updatedGroups = [...currentState.blueprint.groups, group];

    set({
      blueprint: {
        ...currentState.blueprint,
        groups: updatedGroups,
      },
    });

    try {
      await blueprintService.syncGroups(currentState.blueprint.familyId, updatedGroups);
    } catch (error) {
      console.error("Falha ao salvar no banco:", error);
      toast.error("Ocorreu um erro ao salvar na nuvem, mas o dado está salvo no seu dispositivo.");
    }
  },

  removeGroup: async (groupId) => {
    const currentState = get();
    if (!currentState.blueprint) return;

    const updatedGroups = currentState.blueprint.groups.filter((g) => g.id !== groupId);

    set({
      blueprint: {
        ...currentState.blueprint,
        groups: updatedGroups,
      },
    });

    try {
      await blueprintService.syncGroups(currentState.blueprint.familyId, updatedGroups);
    } catch (error) {
      console.error("Falha ao remover no banco:", error);
    }
  },

  addSubgroup: async (groupId, subgroup) => {
    const currentState = get();
    if (!currentState.blueprint) return;

    const updatedGroups = currentState.blueprint.groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          subgroups: [...group.subgroups, subgroup],
        };
      }
      return group;
    });

    set({
      blueprint: {
        ...currentState.blueprint,
        groups: updatedGroups,
      },
    });

    try {
      await blueprintService.syncGroups(currentState.blueprint.familyId, updatedGroups);
    } catch (error) {
      console.error("Falha ao adicionar subgrupo no banco:", error);
    }
  },
}));