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
  fetchBlueprint: (familyId: string) => Promise<void>;
  addGroup: (group: Group, familyId: string) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  addSubgroup: (groupId: string, subgroup: Subgroup) => Promise<void>;
  removeSubgroup: (groupId: string, subgroupId: string) => Promise<void>;
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  blueprint: null,
  isLoading: true,

  setBlueprint: (blueprint) => set({ blueprint }),
  setLoading: (isLoading) => set({ isLoading }),

  fetchBlueprint: async (familyId) => {
    set({ isLoading: true });
    try {
      const bp = await blueprintService.getBlueprint(familyId);
      set({ blueprint: bp });
    } catch (error) {
      console.error("Erro ao buscar Blueprint:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addGroup: async (group, familyId) => {
    const currentState = get();

    // Se o Blueprint não existir, criamos a estrutura base do zero
    const currentBlueprint: Blueprint = currentState.blueprint || {
      id: crypto.randomUUID(),
      familyId: familyId,
      monthYear: new Date().toISOString(),
      groups: [],
      updatedAt: new Date().toISOString(),
    };

    // Injetamos o novo pote na lista
    const updatedGroups = [...currentBlueprint.groups, group];
    const updatedBlueprint = { ...currentBlueprint, groups: updatedGroups };

    // Atualizamos a tela
    set({ blueprint: updatedBlueprint });

    // Salvamos no Firebase em segundo plano
    try {
      await blueprintService.syncGroups(updatedBlueprint.familyId, updatedGroups);
    } catch (error) {
      console.error("Falha ao salvar no banco:", error);
      toast.error("Erro ao sincronizar na nuvem.");
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

  removeSubgroup: async (groupId, subgroupId) => {
    const currentState = get();
    if (!currentState.blueprint) return;

    const updatedGroups = currentState.blueprint.groups.map((group) => {
      if (group.id === groupId) {
        // Filtra os subgrupos, removendo o que tem o ID correspondente
        return {
          ...group,
          subgroups: group.subgroups.filter((sub) => sub.id !== subgroupId),
        };
      }
      return group;
    });

    set({ blueprint: { ...currentState.blueprint, groups: updatedGroups } });

    try {
      await blueprintService.syncGroups(currentState.blueprint.familyId, updatedGroups);
    } catch (error) {
      console.error("Falha ao remover subgrupo no banco:", error);
    }
  },
}));