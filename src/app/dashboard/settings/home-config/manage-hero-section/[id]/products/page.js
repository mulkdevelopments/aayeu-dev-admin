"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function HeroSlideProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slideId = params?.id;
  const { request } = useAxios();

  const [slideTitle, setSlideTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ product_id, name }]
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!slideId) return;
    const fetchSlideAndProducts = async () => {
      try {
        setLoading(true);
        const [slideRes, productsRes] = await Promise.all([
          request({ method: "GET", url: "/admin/hero-slides", authRequired: true }),
          request({ method: "GET", url: `/admin/hero-slides/${slideId}/products`, authRequired: true }),
        ]);
        const slides = slideRes?.data?.data ?? slideRes?.data ?? [];
        const slide = Array.isArray(slides) ? slides.find((s) => s.id === slideId) : null;
        if (slide) setSlideTitle(slide.title || "Hero slide");

        const list = productsRes?.data?.data ?? productsRes?.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setSelectedProducts(arr.map((r) => ({ product_id: r.product_id, name: r.product_name || r.name || `Product ${(r.product_id || "").slice(0, 8)}...` })));
      } catch (err) {
        showToast("error", "Failed to load");
        setSelectedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlideAndProducts();
  }, [slideId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: `/admin/get-products?page=1&limit=20&q=${encodeURIComponent(searchQuery)}`,
          authRequired: true,
        });
        if (error) return setSearchResults([]);
        const products = data?.data?.products ?? data?.products ?? [];
        setSearchResults(Array.isArray(products) ? products : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, request]);

  const addProduct = (product) => {
    const id = product.id ?? product.product_id;
    if (!id) return;
    if (selectedProducts.some((p) => p.product_id === id)) {
      showToast("info", "Already in list");
      return;
    }
    const name = product.name ?? product.title ?? product.product_sku ?? id;
    setSelectedProducts((prev) => [...prev, { product_id: id, name }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProduct = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.product_id !== productId));
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    setSelectedProducts((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    if (index >= selectedProducts.length - 1) return;
    setSelectedProducts((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const product_ids = selectedProducts.map((p) => p.product_id);
      const { error } = await request({
        method: "PUT",
        url: `/admin/hero-slides/${slideId}/products`,
        payload: { product_ids },
        authRequired: true,
      });
      if (error) {
        showToast("error", error || "Failed to save");
        return;
      }
      showToast("success", `Saved ${product_ids.length} products`);
    } catch (err) {
      showToast("error", "Request failed");
    } finally {
      setSaving(false);
    }
  };

  if (!slideId) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/home-config/manage-hero-section">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Manage products: {slideTitle || "Hero slide"}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Add 20+ hand-picked products for this collection. Shop Now will show these on the frontend.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <label className="text-sm font-medium">Search and add products</label>
            <Input
              placeholder="Search by name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            {searchResults.length > 0 && (
              <ul className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {searchResults.map((product) => {
                  const id = product.id ?? product.product_id;
                  const name = product.name ?? product.title ?? product.product_sku ?? id;
                  return (
                    <li key={id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                      <span className="text-sm truncate flex-1">{name}</span>
                      <Button size="sm" variant="outline" onClick={() => addProduct(product)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-xs text-gray-500">No products found</p>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Selected products ({selectedProducts.length})</h2>
              <Button onClick={handleSave} disabled={saving || selectedProducts.length === 0}>
                {saving ? "Saving..." : "Save order"}
              </Button>
            </div>
            {selectedProducts.length === 0 ? (
              <p className="text-sm text-gray-500">No products yet. Search above to add.</p>
            ) : (
              <ul className="space-y-2">
                {selectedProducts.map((item, index) => (
                  <li
                    key={item.product_id}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 bg-gray-50"
                  >
                    <span className="text-gray-500 w-6">{index + 1}.</span>
                    <span className="flex-1 truncate text-sm">{item.name}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => moveUp(index)} disabled={index === 0}>
                        ↑
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveDown(index)} disabled={index === selectedProducts.length - 1}>
                        ↓
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeProduct(item.product_id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
