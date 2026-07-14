interface MenuSlotDefinition {
  key: string;
  title: string;
  summary?: string;
  description?: string;
  [key: string]: unknown;
}

interface InventoryMenuCategoryDefinition {
  key: string;
  label: string;
  description?: string;
  slots: MenuSlotDefinition[];
  [key: string]: unknown;
}

interface EquipmentMenuCategoryDefinition {
  key: string;
  label: string;
  description?: string;
  items: MenuSlotDefinition[];
  [key: string]: unknown;
}

interface RestraintMenuCategoryDefinition {
  key: string;
  label: string;
  description?: string;
  items: MenuSlotDefinition[];
  [key: string]: unknown;
}

const unfiledInventoryCategory = {
  key: 'runtime-unfiled-inventory',
  label: '\u672a\u5f52\u6863',
  description: '\u5b58\u6863\u4e2d\u5df2\u8bb0\u5f55\uff0c\u4f46\u8fd8\u6ca1\u6709\u5728 data/global \u91cc\u8865\u9f50\u9759\u6001\u5b9a\u4e49\u7684\u7269\u54c1\u3002'
};

const unfiledEquipmentCategory = {
  key: 'runtime-unfiled-equipment',
  label: '\u672a\u5f52\u6863',
  description: '\u5b58\u6863\u4e2d\u5df2\u8bb0\u5f55\uff0c\u4f46\u8fd8\u6ca1\u6709\u5728 data/global \u91cc\u8865\u9f50\u9759\u6001\u5b9a\u4e49\u7684\u88c5\u5907\u3002'
};

const unfiledRestraintCategory = {
  key: 'runtime-unfiled-restraints',
  label: '\u672a\u5f52\u6863',
  description: '\u5b58\u6863\u4e2d\u5df2\u8bb0\u5f55\uff0c\u4f46\u8fd8\u6ca1\u6709\u5728 data/global \u91cc\u8865\u9f50\u9759\u6001\u5b9a\u4e49\u7684\u62d8\u675f\u3002'
};

function normalizePositiveAmount(amount: unknown): number {
  const normalizedAmount = typeof amount === 'number' ? amount : Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return 0;
  }

  return Math.floor(normalizedAmount);
}

function createInventorySummary(amount: number): string {
  return `\u6301\u6709 ${amount}`;
}

function createUnfiledInventorySlot(itemId: string, amount: number): MenuSlotDefinition {
  return {
    key: itemId,
    title: `\u672a\u5b9a\u4e49\u7269\u54c1\uff1a${itemId}`,
    summary: createInventorySummary(amount),
    description: '\u8fd9\u4e2a\u7269\u54c1\u5df2\u7ecf\u8fdb\u5165\u5b58\u6863\uff0c\u4f46\u8fd8\u9700\u8981\u5728 data/global \u91cc\u8865\u4e0a\u540d\u79f0\u3001\u63cf\u8ff0\u548c\u7528\u9014\u3002'
  };
}

function createUnfiledEquipmentSlot(slotId: string, itemId: string): MenuSlotDefinition {
  return {
    key: `${slotId}:${itemId}`,
    title: `\u672a\u5b9a\u4e49\u88c5\u5907\uff1a${itemId}`,
    summary: `\u5df2\u88c5\u5907\u5728 ${slotId}`,
    description: '\u8fd9\u4ef6\u88c5\u5907\u5df2\u7ecf\u8fdb\u5165\u5b58\u6863\uff0c\u4f46\u8fd8\u9700\u8981\u5728 data/global \u91cc\u8865\u4e0a\u5bf9\u5e94\u7684\u9759\u6001\u5b9a\u4e49\u3002'
  };
}

function createUnfiledRestraintSlot(restraintId: string): MenuSlotDefinition {
  return {
    key: restraintId,
    title: `\u672a\u5b9a\u4e49\u62d8\u675f\uff1a${restraintId}`,
    summary: '\u5df2\u62d8\u675f',
    description: '\u8fd9\u4e2a\u62d8\u675f\u5df2\u7ecf\u8fdb\u5165\u5b58\u6863\uff0c\u4f46\u8fd8\u9700\u8981\u5728 data/global \u91cc\u8865\u4e0a\u540d\u79f0\u3001\u63cf\u8ff0\u548c\u89e3\u9664\u6761\u4ef6\u3002'
  };
}

export function resolveInventoryMenuCategories(
  categoryDefinitions: ReadonlyArray<InventoryMenuCategoryDefinition>,
  inventory: Readonly<Record<string, number>>
): InventoryMenuCategoryDefinition[] {
  const knownItemIds = new Set<string>();

  const resolvedCategories = categoryDefinitions.map((category) => ({
    ...category,
    slots: category.slots.flatMap((slot) => {
      knownItemIds.add(slot.key);
      const amount = normalizePositiveAmount(inventory[slot.key]);

      if (amount <= 0) {
        return [];
      }

      return [
        {
          ...slot,
          summary: createInventorySummary(amount)
        }
      ];
    })
  }));

  const unfiledSlots = Object.entries(inventory)
    .map(([itemId, amount]) => [itemId.trim(), normalizePositiveAmount(amount)] as const)
    .filter(([itemId, amount]) => itemId && amount > 0 && !knownItemIds.has(itemId))
    .map(([itemId, amount]) => createUnfiledInventorySlot(itemId, amount));

  if (unfiledSlots.length === 0) {
    return resolvedCategories;
  }

  return [
    ...resolvedCategories,
    {
      ...unfiledInventoryCategory,
      slots: unfiledSlots
    }
  ];
}

export function resolveEquipmentMenuCategories(
  categoryDefinitions: ReadonlyArray<EquipmentMenuCategoryDefinition>,
  equipment: Readonly<Record<string, string>>
): EquipmentMenuCategoryDefinition[] {
  const knownSlotIds = new Set<string>();
  const knownEquippedPairs = new Set<string>();

  const resolvedCategories = categoryDefinitions.map((category) => {
    knownSlotIds.add(category.key);
    const equippedItemId = equipment[category.key]?.trim() ?? '';

    return {
      ...category,
      items: category.items.map((item) => {
        const isEquipped = equippedItemId && item.key === equippedItemId;

        if (isEquipped) {
          knownEquippedPairs.add(`${category.key}:${equippedItemId}`);
        }

        return {
          ...item,
          summary: isEquipped ? '\u5df2\u88c5\u5907' : item.summary
        };
      })
    };
  });

  const unfiledItems = Object.entries(equipment)
    .map(([slotId, itemId]) => [slotId.trim(), itemId.trim()] as const)
    .filter(([slotId, itemId]) => slotId && itemId && !knownEquippedPairs.has(`${slotId}:${itemId}`))
    .map(([slotId, itemId]) => createUnfiledEquipmentSlot(slotId, itemId));

  if (unfiledItems.length === 0) {
    return resolvedCategories;
  }

  return [
    ...resolvedCategories,
    {
      ...unfiledEquipmentCategory,
      items: unfiledItems
    }
  ];
}

export function resolveRestraintMenuCategories(
  categoryDefinitions: ReadonlyArray<RestraintMenuCategoryDefinition>,
  restraints: ReadonlyArray<string>
): RestraintMenuCategoryDefinition[] {
  const activeRestraintIds = new Set(restraints.map((item) => item.trim()).filter(Boolean));
  const knownRestraintIds = new Set<string>();

  const resolvedCategories = categoryDefinitions.map((category) => ({
    ...category,
    items: category.items.map((item) => {
      knownRestraintIds.add(item.key);

      return {
        ...item,
        summary: activeRestraintIds.has(item.key) ? '\u5df2\u62d8\u675f' : item.summary
      };
    })
  }));

  const unfiledItems = [...activeRestraintIds]
    .filter((restraintId) => !knownRestraintIds.has(restraintId))
    .map((restraintId) => createUnfiledRestraintSlot(restraintId));

  if (unfiledItems.length === 0) {
    return resolvedCategories;
  }

  return [
    ...resolvedCategories,
    {
      ...unfiledRestraintCategory,
      items: unfiledItems
    }
  ];
}
