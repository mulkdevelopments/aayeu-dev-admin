"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import { Spinner } from "@/components/_ui/spinner";

const updateSchema = z.object({
  mrp: z.coerce.number().min(1, "MRP is required"),
  sale_price: z.coerce.number().min(1, "Sale Price is required"),
});


export default function UpdateProductModal({ product, onSuccess }) {
  const [open, setOpen] = useState(false);
  const { request, loading } = useAxios();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateSchema),
  });

  // ✅ Prefill values when modal opens
  useEffect(() => {
    if (product) {
      reset({
        mrp: product.variants?.[0]?.mrp?.toString() || "",
        sale_price: product.variants?.[0]?.sale_price?.toString() || "",
      });
    }
  }, [product, reset]);

  // const onSubmit = async (data) => {
  //   try {
  //     const payload = {
  //       mrp: data.mrp,
  //       sale_price: data.sale_price,
  //       product_id: product.id || product.product_id,
  //     };

  //     const { data: res, error } = await request({
  //       method: "PATCH",
  //       url: `/admin/update-product-price`,
  //       payload,
  //       authRequired: true,
  //     });

  //     if (error) throw new Error(error.message || "Update failed");

  //     showToast("success", res?.message || "Product updated successfully!");
  //     setOpen(false);
  //   } catch (err) {
  //     console.error("Error updating product:", err);
  //     showToast("error", err.message);
  //   }
  // };

const onSubmit = async (data) => {
  try {
    // ❗ Custom validation using JS (no browser validation)
    if (isNaN(Number(data.mrp)) || isNaN(Number(data.sale_price))) {
      showToast("error", "Please enter valid numeric values!");
      return;
    }

    const payload = {
      mrp: data.mrp,
      sale_price: data.sale_price,
      product_id: product.id || product.product_id,
    };

    const { data: res, error } = await request({
      method: "PATCH",
      url: `/admin/update-product-price`,
      payload,
      authRequired: true,
    });

    if (error) throw new Error(error.message || "Update failed");

    showToast("success", res?.message || "Product updated successfully!");
    setOpen(false);
    
    // Call onSuccess callback to refresh the product data
    if (onSuccess) {
      onSuccess();
    }

  } catch (err) {
    console.error("Error updating product:", err);
    showToast("error", err.message);
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
        // className="bg-gradient-to-r from-[#F3BE69] to-[#A77C00] hover:from-[#A77C00] hover:to-[#F3BE69] text-black font-semibold rounded-[8px] px-3 py-1"
        >
          Edit Price 
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            Edit Product Price
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3">
          <div>
            <label className="text-sm text-gray-700 font-medium mb-1 block">
             Our MRP
            </label>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              {...register("mrp")}
              placeholder="Enter MRP"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 font-medium mb-1 block">
              Our Sale Price
            </label>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              {...register("sale_price")}
              placeholder="Enter Sale Price"
            />
          </div>

          <Button
            type="submit"
            // className="w-full bg-gradient-to-r from-[#F3BE69] to-[#A77C00] hover:from-[#A77C00] hover:to-[#F3BE69] text-black font-bold py-2 rounded-[8px]"
            disabled={loading}
          >
            {loading ? <Spinner className="w-4 h-4" /> : "Update Price"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
