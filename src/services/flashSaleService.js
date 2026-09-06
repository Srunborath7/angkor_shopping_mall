import { api } from "../api/api";

const FLASH_SALE_STORAGE_KEY = "admin_flash_sales";

export const getFlashSalesFromStorage = () => {
  try {
    const saved = localStorage.getItem(FLASH_SALE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
};

export const saveFlashSalesToStorage = (sales, notify = true) => {
  try {
    localStorage.setItem(FLASH_SALE_STORAGE_KEY, JSON.stringify(sales));
  } catch {
    // ignore
  }
  if (notify) {
    window.dispatchEvent(new Event("flash-sale-updated"));
  }
};

/**
 * Normalize a single flash sale item coming from the API.
 * The API now returns `product` as a joined object with images inside it.
 * We flatten those into the flat fields the UI expects.
 */
const normalizeFlashSaleItem = (item) => {
  const prod = item.product;
  // Resolve the best available image
  const productImage =
    (prod?.images || []).find((i) => i.is_primary)?.image_url ||
    (prod?.images || [])[0]?.image_url ||
    prod?.image_url ||
    item.image ||
    null;

  return {
    ...item,
    // Always string for category
    category:
      typeof item.category === "string"
        ? item.category
        : item.category?.name ?? prod?.category?.name ?? "General",
    // Use product image when flash sale has no own image stored
    image: productImage,
    name: item.name || prod?.name || "Flash Deal",
    // Expose product_id convenience
    product_id: item.product_id || prod?.id,
    // Strip the nested object so it never reaches JSX directly
    product: undefined,
  };
};

/**
 * Check whether a flash sale item is actively valid and not expired by duration/end_time.
 */
export const isFlashSaleActive = (item) => {
  if (!item) return false;
  if (item.status && item.status !== "active") return false;
  const now = Date.now();
  let end = null;
  if (item.endTime || item.end_time) {
    end = new Date(item.endTime || item.end_time).getTime();
  } else if (item.created_at || item.createdAt) {
    end = new Date(item.created_at || item.createdAt).getTime() + (item.durationHours || 24) * 3600 * 1000;
  }
  if (end && !isNaN(end) && end <= now) return false;
  return true;
};

export const getFlashSalesApi = async () => {
  try {
    const res = await api("/api/flash-sales", "get");
    const raw = res?.data?.data !== undefined ? res.data.data : (res?.data !== undefined ? res.data : (Array.isArray(res) ? res : null));
    if (Array.isArray(raw)) {
      const normalized = raw.map(normalizeFlashSaleItem);
      const activeList = [];
      const expiredList = [];

      normalized.forEach((item) => {
        if (isFlashSaleActive(item)) {
          activeList.push(item);
        } else {
          expiredList.push(item);
        }
      });

      // Automatically clean up expired items from backend database
      if (expiredList.length > 0) {
        expiredList.forEach(async (exp) => {
          try {
            if (exp.id) await api(`/api/flash-sales/${exp.id}`, "delete");
          } catch (e) {
            console.debug("Auto-cleanup expired flash sale notice:", e?.message);
          }
        });
      }

      // Always sync active list (including empty array when all expired/deleted)
      saveFlashSalesToStorage(activeList, false);
      return activeList;
    }
  } catch (err) {
    console.warn("Failed to fetch flash sales from API:", err);
  }
  const cached = getFlashSalesFromStorage();
  return Array.isArray(cached) ? cached.filter(isFlashSaleActive) : [];
};

/**
 * Create a flash sale.
 * Only `product_id` is required — the API will auto-fill name/image/category/price.
 * You can still override any field explicitly.
 */
export const createFlashSaleApi = async (data) => {
  let created = null;
  try {
    const res = await api("/api/flash-sales", "post", data);
    created = res?.data?.data || res?.data || res;
  } catch (err) {
    console.warn("API create flash sale failed, syncing locally:", err);
  }

  // Normalize the API response
  const newItem = created && created.id
    ? normalizeFlashSaleItem(created)
    : {
        id: `fs-${Date.now()}`,
        claimedPct: data.claimedPct || 0,
        status: "active",
        endTime: data.endTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        ...data,
      };

  const current = getFlashSalesFromStorage();
  const updated = [newItem, ...current];
  saveFlashSalesToStorage(updated);
  return newItem;
};

export const updateFlashSaleApi = async (id, data) => {
  try {
    const res = await api(`/api/flash-sales/${id}`, "put", data);
    const updated_item = res?.data?.data || res?.data;
    if (updated_item) {
      const normalized = normalizeFlashSaleItem(updated_item);
      const current = getFlashSalesFromStorage();
      const updated = current.map((item) =>
        String(item.id) === String(id) ? { ...item, ...normalized } : item
      );
      saveFlashSalesToStorage(updated);
      return updated;
    }
  } catch (err) {
    console.warn("API update flash sale failed, syncing locally:", err);
  }

  const current = getFlashSalesFromStorage();
  const updated = current.map((item) =>
    String(item.id) === String(id) ? { ...item, ...data } : item
  );
  saveFlashSalesToStorage(updated);
  return updated;
};

export const deleteFlashSaleApi = async (id) => {
  try {
    await api(`/api/flash-sales/${id}`, "delete");
  } catch (err) {
    console.warn("API delete flash sale failed, syncing locally:", err);
  }

  const current = getFlashSalesFromStorage();
  const updated = current.filter((item) => String(item.id) !== String(id));
  saveFlashSalesToStorage(updated);
  return true;
};
