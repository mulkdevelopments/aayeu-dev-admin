"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

export default function HeroSlideProductsPage() {
  const params = useParams();
  const router = useRouter();
  const slideId = params?.id;
  const { request } = useAxios();
  const requestRef = useRef(request);
  requestRef.current = request;

  const [slideTitle, setSlideTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]); // [{ product_id, name, image? }]
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
        setSelectedProducts(arr.map((r) => ({
          product_id: r.product_id,
          name: r.product_name || r.name || `Product ${(r.product_id || "").slice(0, 8)}...`,
          image: r.product_img || r.variants?.[0]?.images?.[0] || null,
        })));
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
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const req = requestRef.current;
        const { data, error } = await req({
          method: "GET",
          url: `/admin/get-products?page=1&limit=20&light=1&q=${encodeURIComponent(searchQuery)}`,
          authRequired: true,
        });
        if (cancelled) return;
        if (error) return setSearchResults([]);
        const products = data?.data?.products ?? data?.products ?? [];
        setSearchResults(Array.isArray(products) ? products : []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery]);

  const getProductImage = (product) =>
    product?.product_img ?? product?.variants?.[0]?.images?.[0] ?? null;

  const addProduct = (product) => {
    const id = product.id ?? product.product_id;
    if (!id) return;
    if (selectedProducts.some((p) => p.product_id === id)) {
      showToast("info", "Already in list");
      return;
    }
    const name = product.name ?? product.title ?? product.product_sku ?? id;
    const image = getProductImage(product);
    setSelectedProducts((prev) => [...prev, { product_id: id, name, image }]);
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
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
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
            {searching && (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <ul className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                {searchResults.map((product) => {
                  const id = product.id ?? product.product_id;
                  const name = product.name ?? product.title ?? product.product_sku ?? id;
                  const img = getProductImage(product);
                  return (
                    <li key={id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                      <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                        {img ? (
                          <Image
                            src={img}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">No img</div>
                        )}
                      </div>
                      <span className="text-sm truncate flex-1 min-w-0">{name}</span>
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
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
                    className="flex items-center gap-3 rounded-lg border px-3 py-2 bg-gray-50"
                  >
                    <span className="text-gray-500 w-6">{index + 1}.</span>
                    <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">—</div>
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm min-w-0">{item.name}</span>
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
