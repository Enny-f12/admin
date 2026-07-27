// services/morning-count.service.mock.ts
import {
  MorningCountSheet,
  MorningCountItem,
  MorningCountCategory,
  UpdateItemCurrentPayload,
  UpdateItemUomPayload,
} from '@/types/morning-count.types';

let mockSheet: MorningCountSheet = seedMockSheet();

const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

function computeStatus(current: number | null): MorningCountItem['status'] {
  if (current === null) return 'Pending';
  if (current === 0) return 'Out of stock';
  return 'Updated';
}

export const morningCountService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSheet: async (_outletId: string, _date: string) => {
    await delay();
    return mockSheet;
  },

  saveDraft: async (_sheetId: string) => {
    await delay();
    mockSheet = { ...mockSheet, draftSavedAt: new Date().toISOString() };
    return { draftSavedAt: mockSheet.draftSavedAt! };
  },

  updateItemCurrent: async (_sheetId: string, itemId: string, payload: UpdateItemCurrentPayload) => {
    await delay(150);
    let updatedItem: MorningCountItem | undefined;
    mockSheet = {
      ...mockSheet,
      categories: mockSheet.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== itemId) return item;
          updatedItem = { ...item, current: payload.current, status: computeStatus(payload.current) };
          return updatedItem;
        }),
      })),
    };
    return updatedItem!;
  },

  updateItemUom: async (_sheetId: string, itemId: string, payload: UpdateItemUomPayload) => {
    await delay(150);
    let updatedItem: MorningCountItem | undefined;
    mockSheet = {
      ...mockSheet,
      categories: mockSheet.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== itemId) return item;
          updatedItem = { ...item, unit: payload.unit, packSize: payload.packSize };
          return updatedItem;
        }),
      })),
    };
    return updatedItem!;
  },

  submitCategory: async (_sheetId: string, categoryId: string) => {
    await delay();
    let updatedCategory: MorningCountCategory | undefined;
    mockSheet = {
      ...mockSheet,
      categories: mockSheet.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        updatedCategory = { ...cat, submitted: true, submittedAt: new Date().toISOString(), submittedBy: 'You' };
        return updatedCategory;
      }),
    };
    return updatedCategory!;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPendingCategories: async (_outletId: string, _date: string) => {
    await delay();
    return {
      categories: mockSheet.categories
        .filter((c) => !c.submitted)
        .map((c) => ({ id: c.id, name: c.name })),
    };
  },
};

function seedMockSheet(): MorningCountSheet {
  // TODO: paste your INITIAL_CATEGORIES here, reshaped into
  // { id, outletId, outletName, date, counterStaffId, counterStaffName,
  //   time, draftSavedAt, categories: [...], summary: {...} }
  throw new Error('seedMockSheet not implemented — port INITIAL_CATEGORIES in here');
}