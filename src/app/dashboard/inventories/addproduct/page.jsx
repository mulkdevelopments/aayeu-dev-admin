
"use client";

import React, { useState, useEffect } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import FileUploader from "@/components/comman/FileUploader";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
// import e from "express";
const AddProductPage = () => {
  const { request } = useAxios();
  const router = useRouter();

  const [product, setProduct] = useState({
    name: "",
    title: "",
    short_description: "",
    description: "",
    brand_name: "",
    gender: "",
    product_sku: "",
    default_category_id: "",
    delivery_time: "",
    cod_available: true,
    country_of_origin: "",
    is_active: true,
    product_img: "",
    videos: [],
  });

  const [variants, setVariants] = useState([
    {
      sku: "",
      price: "",
      mrp: "",
      sale_price: "",
      stock: "",
      variant_color: "",
      variant_size: "",
      weight: "",
      images: [],

      videos: [],
    },
  ]);

  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [productVideos, setProductVideos] = useState([]);
  const [variantImages, setVariantImages] = useState([[]]);
  const [variantVideos, setVariantVideos] = useState([[]]);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];

    if (["price", "mrp", "sale_price", "stock", "weight"].includes(name)) {
      newVariants[index][name] = value === "" ? "" : Math.max(0, Number(value));
    } else {
      newVariants[index][name] = value;
    }

    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        price: "",
        mrp: "",
        sale_price: "",
        stock: "",
        variant_color: "",
        variant_size: "",
        weight: "",
        images: [],
        videos: [],
      },
    ]);
    setVariantImages((prev) => [...prev, []]);
    setVariantVideos((prev) => [...prev, []]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
    setVariantVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeProductImage = (index) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeProductVideo = (index) => {
    setProductVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVariantImage = (vIndex, index) => {
    const newImages = [...variantImages];
    newImages[vIndex] = newImages[vIndex].filter((_, i) => i !== index);
    setVariantImages(newImages);
  };

  const removeVariantVideo = (vIndex, index) => {
    const newVideos = [...variantVideos];
    newVideos[vIndex] = newVideos[vIndex].filter((_, i) => i !== index);
    setVariantVideos(newVideos);
  };

  const handleSubmit = async () => {
    if (!product.name || !product.title || !product.default_category_id) {
      showToast("error", "Please fill in required fields");
      return;
    }

    const variantsPayload = variants.map((v, i) => ({
      ...v,
      images: variantImages[i] || [],
      videos: variantVideos[i] || [],
    }));

    const payload = {
      product: {
        ...product,
        product_img: productImages[0] || "",
        videos: productVideos,
      },
      variants: variantsPayload,
      category_ids: [product.default_category_id],
      dynamic_filters: [
        { filter_type: "brand", filter_name: product.brand_name },
        { filter_type: "size", filter_name: variants[0]?.variant_size || "" },
      ],
    };

    try {
      const { data, error } = await request({
        method: "POST",
        url: "/admin/create-product",
        payload,
        authRequired: true,
      });
      if (error) throw new Error(error);

      if (data.success) showToast("success", data.message);


      // Reset all fields
      setProduct({
        name: "",
        title: "",
        short_description: "",
        description: "",
        brand_name: "",
        gender: "",
        product_sku: "",
        default_category_id: "",
        delivery_time: "",
        cod_available: true,
        country_of_origin: "",
        is_active: true,
        product_img: "",
        videos: [],
      });
      setVariants([
        {
          sku: "",
          price: "",
          mrp: "",
          sale_price: "",
          stock: "",
          variant_color: "",
          variant_size: "",
          weight: "",
          images: [],
          videos: [],
        },
      ]);
      setProductImages([]);
      setProductVideos([]);
      setVariantImages([[]]);
      setVariantVideos([[]]);

      router.push("/dashboard/inventories");
    } catch (err) {
      showToast("error", err.message || "Failed to add product");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-categories",
          authRequired: true,
        });

        if (error) throw new Error(error?.message || error);

        if (data?.success && Array.isArray(data.data)) {
          setCategories(data.data);
          showToast("success", data.message);
        }
      } catch (err) {
        console.error(err);
        showToast("error", err.message || "Failed to fetch categories");
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />
      <h1 className="text-3xl font-bold">Add Product</h1>

      {/* Product Info */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <h2 className="text-xl font-semibold border-b border-gray-200 pb-2">
          Product Info
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="name"
            value={product.name}
            onChange={handleProductChange}
            placeholder="Product Name"
          />
          <Input
            name="title"
            value={product.title}
            onChange={handleProductChange}
            placeholder="Title"
          />
          <Input
            name="short_description"
            value={product.short_description}
            onChange={handleProductChange}
            placeholder="Short Description"
          />
          <Input
            name="description"
            value={product.description}
            onChange={handleProductChange}
            placeholder="Full Description"
          />
          <Input
            name="brand_name"
            value={product.brand_name}
            onChange={handleProductChange}
            placeholder="Brand Name"
          />
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={product.gender || ""}
              onValueChange={(value) =>
                setProduct((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            name="product_sku"
            value={product.product_sku}
            onChange={handleProductChange}
            placeholder="SKU"
          />
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={product.default_category_id || ""}
              onValueChange={(value) =>
                setProduct((prev) => ({ ...prev, default_category_id: value }))
              }
            >
              <SelectTrigger className="w-full h-11">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            name="delivery_time"
            value={product.delivery_time}
            onChange={handleProductChange}
            placeholder="Delivery Time"
          />
          <Input
            name="country_of_origin"
            value={product.country_of_origin}
            onChange={handleProductChange}
            placeholder="Country of Origin"
          />
        </div>

        {/* Product Images */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Product Images
          </label>
          <FileUploader
            url="/admin/upload-images"
            maxFiles={5}
            fieldName="images"
            onSuccess={(res) => {
              const urls = res?.data?.uploaded?.map((file) => file.url) || [];
              if (urls.length) setProductImages((prev) => [...prev, ...urls]);
              showToast("success", "Images uploaded successfully");
            }}
            onError={() => showToast("error", "Image upload failed")}
          />
          <div className="flex flex-wrap gap-3 mt-2">
            {productImages.map((img, idx) => (
              <div
                key={idx}
                className="relative w-24 h-24 border rounded-lg overflow-hidden"
              >
                <Image
                  src={img}
                  width={122}
                  height={122}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeProductImage(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Videos */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Product Videos
          </label>
          <FileUploader
            url="/admin/upload-images"
            maxFiles={5}
            fieldName="images"
            onSuccess={(res) => {
              const urls = res?.data?.imageUrls;
              if (urls) setProductVideos((prev) => [...prev, ...urls]);
              showToast("success", "Videos uploaded successfully");
            }}
            onError={() => showToast("error", "Video upload failed")}
          />
          <div className="flex flex-wrap gap-3 mt-2">
            {productVideos.map((vid, idx) => (
              <div
                key={idx}
                className="relative w-24 h-24 border rounded-lg flex items-center justify-center bg-gray-100"
              >
                <img src="/video-icon.png" alt="video" className="w-10 h-10" />
                <button
                  type="button"
                  onClick={() => removeProductVideo(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Variants */}
      {variants.map((v, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <h3 className="font-semibold text-lg">Variant {i + 1}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              name="sku"
              value={v.sku}
              onChange={(e) => handleVariantChange(i, e)}
              placeholder="SKU"
            />
            {["price", "mrp", "sale_price", "stock", "weight"].map((field) => (
              <Input
                key={field}
                name={field}
                value={v[field]}
                onChange={(e) => handleVariantChange(i, e)}
                placeholder={field.replace("_", " ").toUpperCase()}
                type="number"
              />
            ))}
            <Input
              name="variant_color"
              value={v.variant_color}
              onChange={(e) => handleVariantChange(i, e)}
              placeholder="Color"
            />
            <Input
              name="variant_size"
              value={v.variant_size}
              onChange={(e) => handleVariantChange(i, e)}
              placeholder="Size"
            />

            {/* Variant Images */}
            <div className="space-y-3 col-span-full">
              <label className="text-sm font-medium text-gray-700">
                Variant Images
              </label>
              <FileUploader
                url="/admin/upload-images"
                maxFiles={5}
                fieldName="images"
                onSuccess={(res) => {
                  // 1. map all uploaded files to get URLs
                  const urls = res?.data?.uploaded?.map(file => file.url) || [];

                  if (urls.length) {
                    // 2. update the correct variant index
                    setVariantImages((prev) => {
                      const newImages = [...prev];
                      newImages[i] = [...(newImages[i] || []), ...urls]; // append new images
                      return newImages;
                    });
                    showToast("success", "Variant Images uploaded successfully");
                  }
                }}
                onError={() => showToast("error", "Variant image upload failed")}
              />

              <div className="flex flex-wrap gap-3 mt-2">
                {variantImages[i]?.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 border rounded-lg overflow-hidden"
                  >
                    <Image
                      src={img}
                      width={122}
                      height={122}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      onClick={() => removeVariantImage(i, idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      X
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Variant Videos */}
            <div className="space-y-3 col-span-full">
              <label className="text-sm font-medium text-gray-700">
                Variant Videos
              </label>
              <FileUploader
                url="/admin/upload-images"
                maxFiles={5}
                fieldName="images"
                onSuccess={(res) => {
                  const urls = res?.data?.imageUrls;
                  if (urls) {
                    const newVideos = [...variantVideos];
                    newVideos[i] = [...(newVideos[i] || []), ...urls];
                    setVariantVideos(newVideos);
                    showToast("success", "Variant videos uploaded");
                  }
                }}
                onError={() =>
                  showToast("error", "Variant video upload failed")
                }
              />
              <div className="flex flex-wrap gap-3 mt-2">
                {variantVideos[i]?.map((vid, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 border rounded-lg flex items-center justify-center bg-gray-100"
                  >
                    <img
                      src="/video-icon.png"
                      alt="video"
                      className="w-10 h-10"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantVideo(i, idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeVariant(i)}
          >
            Remove Variant
          </Button>
        </div>
      ))}

      <div className="flex flex-col md:flex-row gap-2">
        <Button onClick={addVariant} className="w-full md:w-auto">
          Add Variant
        </Button>
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Submit Product
        </Button>
      </div>
    </div>
  );
};

export default AddProductPage;
