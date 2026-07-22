// hooks/useMenu.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';
import {
  GetItemsFilters,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
} from '@/types/menu';

export function useMenuCategories() {
  return useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuService.getCategories(),
    meta: { errorMessage: 'Could not load categories' },
  });
}

export function useMenuItems(filters: GetItemsFilters = {}) {
  return useQuery({
    queryKey: ['menu', 'items', filters],
    queryFn: () => menuService.getItems(filters),
    meta: { errorMessage: 'Could not load menu items' },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: CreateMenuItemPayload; files: File[] }) =>
      menuService.createItem(payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
    },
    meta: { successMessage: 'Dish added', errorMessage: 'Could not add dish' },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMenuItemPayload }) =>
      menuService.updateItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
    },
    meta: { successMessage: 'Dish updated', errorMessage: 'Could not update dish' },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
    },
    meta: { successMessage: 'Dish removed', errorMessage: 'Could not remove dish' },
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
    },
    meta: { successMessage: 'Availability updated', errorMessage: 'Could not update availability' },
  });
}

// NOT YET LIVE on backend — silent failure until endpoint exists (see backend request, Menu #3)
export function useUpdateMenuItemImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      menuService.updateItemImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'items'] });
    },
    retry: false,
    meta: { errorMessage: null },
  });
}