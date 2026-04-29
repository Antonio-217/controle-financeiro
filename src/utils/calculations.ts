// Calcula o total de um subgrupo
export const getSubgroupTotal = (subgroup: Subgroup) => {
  return subgroup.items.reduce((acc, item) => acc + item.amount, 0);
};

// Calcula o total do grupo inteiro (soma dos subgrupos)
export const getGroupTotal = (group: Group) => {
  return group.subgroups.reduce((acc, subgroup) => {
    return acc + getSubgroupTotal(subgroup);
  }, 0);
};