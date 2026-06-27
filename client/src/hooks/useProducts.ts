import { useState, useEffect, useCallback } from "react";
import { INITIAL_PRODUCTS, type Product } from "@/data/products";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("hores_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  let body: any;
  try {
    body = await res.json();
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verificá que esté corriendo.");
  }
  if (res.status === 401) {
    localStorage.removeItem("hores_token");
    throw new Error("Sesión expirada. Volvé a iniciar sesión.");
  }
  if (!res.ok) throw new Error(body.error ?? "Error desconocido");
  return body as T;
}

export function useProducts(includeAll = false) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const apiUrl = includeAll ? "/api/products/all" : "/api/products";

  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiRequest<Product[]>(apiUrl, {
        headers: includeAll ? authHeader() : {},
      });
      setProducts(data);
    } catch {
      // keep INITIAL_PRODUCTS as fallback
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (product: Product): Promise<Product> => {
    const created = await apiRequest<Product>("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(product),
    });
    setProducts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateProduct = useCallback(async (product: Product): Promise<Product> => {
    const updated = await apiRequest<Product>(`${"/api/products"}/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(product),
    });
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    await apiRequest<{ ok: boolean }>(`${"/api/products"}/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct };
}
