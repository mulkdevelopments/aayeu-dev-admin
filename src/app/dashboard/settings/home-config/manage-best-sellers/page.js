"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useAxios from "@/hooks/useAxios";
import { debounce, set } from "lodash";
import { showToast } from "@/components/_ui/toast-utils";
import Image from "next/image";
import { useEffect } from "react";
import SectionToggle from "@/components/_ui/sectiontoggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import { Trash, Trash2 } from "lucide-react"; // for delete icon
import CustomBreadcrumb from "@/components/_ui/breadcrumb";

export default function AddBestSeller() {
  const { request } = useAxios();

  const [searchValue, setSearchValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Product form
   const [bestSellers, setBestSellers] = useState([]);
   const [showBestsellerTable, setShowBestsellerTable] = useState(true);
   const [isEdit, setIsEdit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [sectionActive,setSectionActive]=useState(false);
  const [sectionData,setSectionData]=useState({});
    const [errors, setErrors] = useState({
  startAt: "",
  endAt: "",
});


  const [formFields, setFormFields] = useState({
    startAt: "",
    endAt: "",
    badge: "",
    promoText: "",
    rank: "",
  });
  // Fetch best sellers
  useEffect(() => {
    fetchBestSellers();
   fetchStatus();
  }, []);

  // useEffect(()=>{
  //    
  // },[sectionActive])
      

     const fetchStatus = async () => {
      try {
        const endpoint = "/admin/section-by-key?key=best_seller";
        const response = await request({
          method: "GET",
          url: endpoint,
          authRequired: true,
        });

        // Destructure with default empty object to avoid null
        const { data = {}, error } = response;

        if (error) {
            console.log(error, "error")
          return;
        }

        // Safe check for data and its properties
        if (data && data.success === true && data.data) {
          setSectionActive(data.data.active || false);
          setSectionData(data);
        } else {
          // Handle case when data is not in expected format
          console.log("Received unexpected data format:", data);
          setSectionActive(false);
          setSectionData(null);
        }
      } catch (err) {
        console.error("Error in fetchStatus:", err);
        showToast("error", "Error fetching section status");
      } finally {
        setLoading(false);
      }
     }
   const fetchBestSellers = async () => {
    try {
       setLoading(true);
     const  endpoint="/admin/list-best-sellers?include_inactive=true"
      const { data, error } = await request({ method: "GET", url: endpoint, authRequired:true });
      
      if (error) {
          showToast("error", "Failed to fetch products");
          return;
        }
          
      setBestSellers(data?.data?.items || []);
    } catch (err) {
      console.error(err);
    }finally {
        setLoading(false);
      }
  };
  // Debounced search
  const debounceSearch = useCallback(
    debounce((val) => {setSearchQuery(val)
      
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    debounceSearch(val);
    if (!val) setProducts([]);
  };

  // Fetch products list by searchQuery
  React.useEffect(() => {
    if (!searchQuery) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const endpoint = `/admin/get-products?page=1&q=${searchQuery}`;
        const { data, error } = await request({ method:"GET", url: endpoint, authRequired:true });

        if (error) {
          showToast("error", "Failed to fetch products");
          return;
        }

         setProducts(data?.data?.products || []);
      } catch (err) {
        showToast("error", "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  // Fetch product details by ID when user selects
  const handleSelectProduct = async (productId) => {
    try {
      setLoading(true);
      const endpoint = `/admin/get-product-by-id?productId=${productId}`;
      const { data, error } = await request({ method: "GET", url: endpoint, authRequired:true });

      if (error) {
        showToast("error", "Failed to fetch product details");
        return;
      }

      setSelectedProduct(data?.data); // Fill form
      setProducts([]); // Hide product list
      setSearchValue(""); // Clear search box
      setFormFields({
        startAt: "",
        endAt: "",
        badge: "",
        promoText: "",
        rank: "",
      });
    } catch (err) {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeField = (field, value) => {
    setFormFields((prev) => ({ ...prev, [field]: value }));
  };

 const handleRemove = async (id) => {
  try {
    console.log("Deleting best seller with id:", id);
    const endpoint = `/admin/remove-best-seller?id=${id}`; // adjust if needed
    const { data, error } = await request({ method: "PUT", url: endpoint ,payload: {}, authRequired:true });

    if (error) {
      showToast("error", "Failed to Remove Best Seller");
      return;
    }

    showToast("success", "Best Seller Removed successfully!");
    setBestSellers((prev) => prev.filter((item) => item.id !== id));
  } catch (err) {
    console.error(err);
    showToast("error", "Something went wrong while Removing Best Seller");
  }
};
 
 const handleEdit = (item) => {
    setIsEdit(true);
  setShowBestsellerTable(false);
  setSelectedProduct(
    item
    // product_img: item.product_img || item.product?.product_img, // fallback
  );
  setFormFields({
    id: item.id || "",
    name: item.product_name || "-",
    startAt: item.start_at ? item.start_at.split("T")[0] : "",
    endAt: item.end_at ? item.end_at.split("T")[0] : "",
    badge: item.meta?.badge || "",
    promoText: item.meta?.promo_text || "",
    rank: item.rank || "",

  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({ startAt: "", endAt: "" });

  let hasError = false;
  const newErrors = { startAt: "", endAt: "" };
  if (!formFields.startAt) { newErrors.startAt = "Start date is required"; hasError = true; }
  if (!formFields.endAt) { newErrors.endAt = "End date is required"; hasError = true; }
  if (hasError) { setErrors(newErrors); return; }

  try {
    const isEdit = !!selectedProduct.id && bestSellers.some(bs => bs.id === selectedProduct.id);
    const payload = {
      id: isEdit ? selectedProduct.id : undefined,
      product_id: selectedProduct.id,
      rank: Number(formFields.rank),
      meta: { badge: formFields.badge, promo_text: formFields.promoText },
      start_at: new Date(formFields.startAt).toISOString(),
      end_at: new Date(formFields.endAt).toISOString(),
      active: true,
    };
      
    const endpoint = isEdit ? "/admin/update-best-seller" : "/admin/add-best-seller";
    const method = isEdit ? "PUT" : "POST";
     console.log("Payload is ",payload)
    const { data, error } = await request({ method, url: endpoint, payload, authRequired: true });

    if (error) { showToast("error", "Failed to add/update best seller"); return; }
    showToast("success", `Best Seller ${isEdit ? "updated" : "added"} successfully!`);


    setSelectedProduct(null);
    setSearchQuery("");
    setShowBestsellerTable(true);
    setIsEdit(false);
    await fetchBestSellers();
  } catch (err) {
    showToast("error", "Something went wrong");
  }
};

// Table filter
const filteredBestSellers = bestSellers.filter((item) => {
  const matchesSearch =
    item.product_name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    item.product_sku?.toLowerCase().includes(tableSearch.toLowerCase()) ||
    item.meta?.promo_text?.toLowerCase().includes(tableSearch.toLowerCase());

  const matchesStatus =
    statusFilter === "all"
      ? true
      : statusFilter === "active"
      ? item.active === true
      : item.active === false;

  return matchesSearch && matchesStatus;
});
 
 
const handleToggle=async()=>{
    // const statusToFeed=sectionData.data.active;
    // console.log("statusto feed ",statusToFeed);
    try{  
      const endpoint="/admin/update-section";
      const payload={
        key:"best_seller",
  active: !sectionActive,
  label: sectionData?.data?.label,
  meta: sectionData?.data?.meta,
  rank: sectionData?.data?.rank
      }
      
      const {data,error}=await request(
        {method:"PUT",
        url:endpoint,
        payload,
        authRequired:true,
      }
      )
      if(error){
        console.log(error);
      }

      setSectionActive(!sectionActive);
    }catch(error){
      console.log("failed to change status",error)
    }
      
}
  return (
    <div className="p-6">
      <CustomBreadcrumb/>
      <h1 className="text-2xl font-bold mb-4"> {isEdit ? "Edit Best Seller" : "Add Best Seller"}</h1>

      {/* Search */}
     {/* Add Best Seller Button */}
{!selectedProduct && (
  <>
     <div className="flex flex-row w-full justify-between items-center">
    <Button
      variant="default"
      className="mb-4"
      onClick={() => setIsModalOpen(true)}
    >
      + Add Best Seller
    </Button>

    
      <div className="flex items-center gap-3">
      <SectionToggle sectionActive={sectionActive} handleToggle={handleToggle} />
      <span className="text-sm font-medium">
        {sectionActive ? "Section Active" : "Section Inactive"}
      </span>
    </div>
    </div>

    {/* Modal */}
    <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Search Product</AlertDialogTitle>
          <AlertDialogDescription>
            Search and select a product to add as Best Seller
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-2 max-h-80 overflow-y-auto">
          <Input
            type="text"
            value={searchValue}
            placeholder="Search product..."
            className=" mb-4 "
            onChange={handleSearchChange}
          />

          {loading && <p>Loading...</p>}
          {!loading && searchQuery && products.length === 0 && (
            <p>No products found</p>
          )}

          <ul>
            {products.map((product) => {
              const alreadyAdded = bestSellers.some(
                (bs) => bs.product_id === product.id
              );
              {/* console.log(`alreadyadded ${alreadyAdded} ,,bestSellers ${bestSellers} ,, product ${product} `) */}

              return (
                <li
                  key={product.id}
                  className="border p-2 mb-2 flex justify-between items-center hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    {product.product_img && (
                      <img
                        className="w-10 h-10 object-cover rounded border"
                        src={product.product_img || "/placeholder.png"}
                        alt={product.name}
                      />
                    )}
                    <span className="font-medium">{product.name}</span>
                  </div>

                  {alreadyAdded ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-gray-200 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      Already Added
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleSelectProduct(product.id);
                        setIsModalOpen(false);
                      }}
                    >
                      Select
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {setIsModalOpen(false); setSearchValue(""); setShowBestsellerTable(true); setSearchQuery("") ;   }}>
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
)}

        {/*bestseller  table  */}
       {bestSellers && !searchQuery &&showBestsellerTable && (
          <div className="mt-6">
           <div className="flex justify-end mb-3 gap-2 flex-col  sm:flex-row">
         <Select
    value={statusFilter}
    onValueChange={(val) => setStatusFilter(val)}
  >
    <SelectTrigger className="">
      <SelectValue placeholder="Filter by status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
      <Input
        type="text"
        placeholder="Search in best sellers..."
        className="w-[250px]"
        value={tableSearch}
        onChange={(e) => setTableSearch(e.target.value)}
      />
    </div>
        <div className="overflow-x-auto border rounded-xl shadow-sm mt-4">
        
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Promo Text</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {bestSellers.length > 0 ? (
              filteredBestSellers.length===0?(<TableRow>
    <TableCell colSpan={8} className="text-center py-6">
      No matching results
    </TableCell>
  </TableRow>) :( filteredBestSellers.map((item,index) => (
                  <TableRow key={item.id || index} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {item.product_name}
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.product_sku}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {item.meta?.promo_text}
                    </TableCell>
                    <TableCell>
                      {item?.product_img?<img
                        src={item.product_img}
                        alt={item.product_name}
                        className="h-14 w-14 object-cover rounded-md border"
                      />:<p className="text-center">--</p>}
                    </TableCell>
                    <TableCell>
                      {item.active==true? (
                        <Badge variant="success" className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className={"flex gap-2 justify-center"}>
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleEdit(item)}
  >
    Edit
  </Button>

                       <AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>

  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove Best Seller?</AlertDialogTitle>
      <AlertDialogDescription>
         Are you sure you want to remove this Best Seller?
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleRemove(item.id)}
        className="bg-red-600 hover:bg-red-700"
      >
        Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

                  </TableCell>
                  </TableRow>
                )))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No Best Sellers Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div></div>
      )}
        {/* selected product card */}
        {selectedProduct && ( <div className="flex flex-col md:flex-row items-center gap-4 mb-6 border-b pb-4">
            <img
              src={selectedProduct?.product_img || "/placeholder.png"}
              alt={selectedProduct?.name?.charAt(0).toUpperCase() || "Selected Product"}
              className="w-28 h-28 object-cover rounded-md border"
            />
            <div className="flex flex-col gap-1 w-full">
              <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
              <p className="text-sm text-gray-600">
                Brand: {selectedProduct.brand_name || "-"}
              </p>
              <p className="text-sm text-gray-600">
                vendorId: {selectedProduct.vendor_id || "-"}
              </p>
              <p className="text-sm text-gray-600">
                SKU: {selectedProduct.product_sku || "-"}
              </p>
              <p className="text-sm text-gray-600">
                Price: ₹{selectedProduct.price || "0"}
              </p>
              <p className="text-sm text-gray-600">
                Category: {selectedProduct.category_name || "-"}
              </p>
            </div>
          </div>)}

      {/* Product Form */}
      
      {selectedProduct && (

        <form onSubmit={handleSubmit} className="border p-4 rounded-md">
          <div className="mb-2">
            <label className="inline font-medium">ID:</label>
            <Input value={selectedProduct.id} readOnly />
          </div>

          <div className="mb-2  mt-4 flex flex-col md:flex-row justify-start items-start gap-8">
           <div>
            <label className="inline font-medium">Name:</label>
            <Input value={selectedProduct.name} readOnly />
           </div>
              <div>
            <label className="inline font-medium">SKU:</label>
            <Input value={selectedProduct.product_sku || "-"} readOnly />
              </div>
          <div className=" ">
            <label className="inline-block font-medium">Brand:</label>
            <Input value={selectedProduct.brand_name || "-"} readOnly />
          </div>
          </div>


            <div className="mb-2 mt-4  flex flex-col md:flex-row justify-start items-start gap-8">
            <div>
            <label className=" font-medium">Start Date:</label>
            <Input
              type="date"
              value={formFields.startAt}
              onChange={(e) => handleChangeField("startAt", e.target.value)}
            /> 
            {errors.startAt && <p className="text-red-500 text-sm mt-1">{errors.startAt}</p>}
            </div>
             
             <div>
            <label className="font-medium">End Date:</label>
            <Input
              type="date"
              value={formFields.endAt}
              onChange={(e) => handleChangeField("endAt", e.target.value)}
            /> 
            {errors.endAt && <p className="text-red-500 text-sm mt-1">{errors.endAt}</p>}
            </div>
          </div>

        
          <div className="mb-2 flex flex-col md:flex-row justify-start items-start gap-8" >
          <div className="">
            <label className="inline font-medium">Badge:</label>
            <Input
              value={formFields.badge}
              onChange={(e) => handleChangeField("badge", e.target.value)}
            />
          </div>

          <div className="">
            <label className="font-medium">Promo Text:</label>
            <Input
               
              value={formFields.promoText}
              onChange={(e) => handleChangeField("promoText", e.target.value)}
            />
          </div>

          <div className="relative">
            <label className="font-medium block">Rank:</label>
           <select
             value={formFields.rank}
             onChange={(e) => handleChangeField("rank", e.target.value)}
             className="border  block rounded-xl px-4 py-2 box-border appearance-none ">
              
            {[...Array(10)].map((_, i) => (
           <option className="bg-gray-200 rounded-xl  border hover:bg-white text-bold font-sans" key={i} value={i + 1}>Rank {i + 1}</option>
            ))}
</select>
            {/* Custom arrow */}
  <div className="pointer-events-none absolute inset-y-0 right-2 ml-1 mt-[30%] flex items-center">
    <svg
      className="h-4 w-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

          </div>
          
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" variant="default"
             >
              {isEdit ? "Edit BestSeller" : "Add BestSeller"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {setSelectedProduct(null);  setIsEdit(false);
                          setShowBestsellerTable(true);setSearchQuery("");
                          }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
