"use client";

import React, { useRef, useState, useEffect } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/_ui/spinner";
import { Input } from "@/components/ui/input";
import { showToast, showLoadingToast, dismissToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import SyncProgressTracker from "@/components/_dialogs/SyncProgressTracker";

// vendors will be fetched from API and limited to first 3

const currencyOptions = [
  { label: "EUR → Euro", value: "EUR" },
  { label: "GBP → British Pound Sterling", value: "GBP" },
  { label: "USD → United States Dollar", value: "USD" },
];

const PEPELLA_VENDOR_ID = "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed";
const BDROPPY_VENDOR_ID = "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0";

const VENDOR_SAMPLE_FILES = {
  [BDROPPY_VENDOR_ID]: {
    label: "Download BDroppy sample CSV",
    path: "/assets/samples/bidroppy_fixed_final_v3-20-products (1).csv",
  },
  [PEPELLA_VENDOR_ID]: {
    label: "Download Pepella sample CSV",
    path: "/assets/samples/papella_fixed_final_v2_10_products (1).csv",
  },
};

const ImportProduct = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [percentIncrease, setPercentIncrease] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const { request } = useAxios();

  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const { data, error } = await request({
          method: "GET",
          url: "/admin/get-vendor-list",
          authRequired: true,
        });

        if (error) {
          showToast("error", "Failed to load vendors");
          setVendors([]);
          return;
        }

        // data?.data expected to be an array of vendors
        const list = data?.data?.vendors || [];
        // Only show these three vendor IDs (in this order)
        const allowedIds = [
          // "65053474-4e40-44ee-941c-ef5253ea9fc9",
          "a6bdd96b-0e2c-4f3e-b644-4e088b1778e0",
          "b34fd0f6-815a-469e-b7c2-73f9e8afb3ed",
        ];

        // Preserve the requested order by mapping allowedIds -> vendor (if exists)
        const filtered = allowedIds
          .map((id) => list.find((v) => v.id === id))
          .filter(Boolean);

        setVendors(filtered);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load vendors");
        setVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const isValid = allowedExtensions.some((ext) => file.name.endsWith(ext));

    if (!isValid) {
      showToast("error", "Please select a valid .csv, .xlsx, or .xls file!");
      return;
    }

    setSelectedFile(file);
    showToast("success", `Selected file: ${file.name}`);
    // Clear the input value so selecting the same file again will trigger onChange
    try {
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      // ignore
    }
  };

  const ALLOWED_IMPORT_VENDOR = PEPELLA_VENDOR_ID; // Pepella

  const handleUploadClick = () => {
    if (!selectedVendor) {
      showToast("error", "Please select a vendor first.");
      return;
    }
    if (selectedVendor !== ALLOWED_IMPORT_VENDOR && selectedVendor !== BDROPPY_VENDOR_ID) {
      showToast("error", "Import is supported only for Pepella and BDroppy vendors.");
      return;
    }
    // clear previous value so onChange fires even when user re-selects same file
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selectedVendor) {
      showToast("error", "Vendor selection is required.");
      return;
    }

    if (!selectedFile) {
      showToast("error", "Please select a file before uploading!");
      return;
    }

    if (!selectedCurrency) {
      showToast("error", "Please choose a target currency.");
      return;
    }

    if (!conversionRate) {
      showToast("error", "Please provide a conversion rate.");
      return;
    }

    if(!percentIncrease){
      showToast("error", "Please provide a percentage increase.");
      return;
    }

    if (selectedVendor !== ALLOWED_IMPORT_VENDOR && selectedVendor !== BDROPPY_VENDOR_ID) {
      showToast("error", "Import API only supports Pepella and BDroppy vendors.");
      return;
    }

    // Determine which API endpoint to use based on vendor
    const apiEndpoint = selectedVendor === BDROPPY_VENDOR_ID 
      ? "/admin/import-bdroppy" 
      : "/admin/import-products";

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("vendor", selectedVendor);
    // API expects keys: currency, conversion_rate, increment_percent
    formData.append("currency", selectedCurrency);
    formData.append("conversion_rate", conversionRate);
    formData.append("increment_percent", percentIncrease || "0");

    try {
      setIsUploading(true);
      // const toastId = showLoadingToast("Uploading file...");

      // Direct fetch call for file upload (bypass axiosInstance default headers)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${apiEndpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `${JSON.parse(localStorage.getItem("authUser"))?.token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      // dismissToast(toastId);

      if (!data?.success && !data?.ok) {
        console.error("Import error:", data);
        showToast("error", data?.message || data?.error || "Upload failed");
        return;
      }

      showToast("success", data?.message || "File uploaded successfully!");
      
      // Show additional info if available (for BDroppy)
      // if (data?.note) {
      //   setTimeout(() => {
      //     showToast("info", data.note);
      //   }, 1000);
      // }
      setSelectedFile(null);
      setSelectedCurrency("");
      setConversionRate("");
      setPercentIncrease("");
      setSelectedVendor("");
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong during upload!");
    } finally {
      setIsUploading(false);
    }
  };

  const sampleDownload = VENDOR_SAMPLE_FILES[selectedVendor];

  return (
    <div className="p-6">
      <CustomBreadcrumb />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold mt-4 mb-2">Import Product</h1>
          {/* <div className="text-sm text-gray-500">
            <div>Only selected vendor can import products.</div>
            <div className="mt-1">
              API keys: `currency`, `conversion_rate`, `increment_percent`
            </div>
          </div> */}
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            className="border-yellow-700 text-yellow-700 hover:bg-yellow-700 hover:text-white"
            onClick={() => setSyncDialogOpen(true)}
          >
            Sync Luxury-Distribution Products
          </Button>
        </div>
      </div>

      {/* Vendor Selection */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>1. Select a vendor</CardTitle>
          {sampleDownload && (
            <Button
              variant="outline"
              size="lg"
              className="border-yellow-700 text-yellow-700 rounded-lg hover:bg-yellow-700 hover:text-white"
              asChild
            >
              <a href={sampleDownload.path} download>
                {sampleDownload.label}
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingVendors ? "Loading vendors..." : "Choose vendor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!selectedVendor && (
              <p className="mt-3 text-sm text-gray-500">
                Select a vendor to unlock the upload step.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Box */}
    <div className="flex gap-6 mb-6">
  {/* Upload Box */}
  <Card className="flex-1">
    <CardHeader>
      <CardTitle>2. Upload file</CardTitle>
    </CardHeader>
    <CardContent>
      <div
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition ${
          selectedVendor
            ? "border-yellow-700 bg-gray-50 hover:bg-gray-100 cursor-pointer"
            : "border-gray-300 bg-gray-100 cursor-not-allowed opacity-70"
        }`}
        onClick={handleUploadClick}
      >
        <p className="text-gray-600 text-sm mb-4 text-center">
          {selectedVendor
            ? "Drag & drop your CSV/Excel file here or click to upload"
            : "Choose a vendor before adding a file"}
        </p>

        <Button
          variant="default"
          onClick={handleUploadClick}
          className="bg-yellow-700 text-white hover:bg-yellow-800"
          disabled={!selectedVendor}
        >
          Select File
        </Button>

        <p className="mt-3 text-xs text-gray-500">
          Accepted: .csv, .xlsx, .xls
        </p>
      </div>
    </CardContent>
  </Card>

  {/* File Preview */}
  {selectedFile && (
    <Card className="w-72">
      <CardContent className="flex flex-col justify-between h-full py-6">
        <div>
          <p className="text-sm font-medium">📄 {selectedFile.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>

        <Button
          variant="destructive"
          onClick={() => setSelectedFile(null)}
          className="mt-4"
        >
          Remove
        </Button>
      </CardContent>
    </Card>
  )}
</div>

{/* Hidden file input */}
<input
  type="file"
  ref={fileInputRef}
  style={{ display: "none" }}
  accept=".csv,.xlsx,.xls"
  onChange={handleFileChange}
/>

      {/* 
      {selectedFile && (
        <div className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-yellow-700 text-white hover:bg-yellow-800 px-6 py-3"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-4 h-4 text-white" />
                Uploading...
              </div>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      )} */}

      {/* Currency & Pricing Details */}
      {selectedFile && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Currency & Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select currency
                </label>
                <div className="mt-2 max-w-sm">
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Conversion rate
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="e.g. 4.27"
                    className="mt-2"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use the latest rate from your ERP/forex provider.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    % increment (optional)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="e.g. 20"
                    className="mt-2"
                    value={percentIncrease}
                    onChange={(e) => setPercentIncrease(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank for no markup, or enter the profit margin you
                    want.
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex mt-4 items-end justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={isUploading}
                      className="w-50 bg-yellow-700 text-white hover:bg-yellow-800 px-6 py-3"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Spinner className="w-4 h-4 text-white" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <SyncProgressTracker
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
      />
    </div>
  );
};
export default ImportProduct;
