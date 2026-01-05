"use client";

import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react"; // For back icon

export default function ProfilePage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState("https://res.cloudinary.com/dxppgyuwt/image/upload/v1766337357/hero/xe7k3ywclxhe917mnipn.png");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "Shibin sha",
      email: "Shibin@mulkholdings.com",
      phone: "7012975494",
      address: "kochi, kerala",
    },
  });

  const onSubmit = (data) => {
    console.log("Updated Profile:", data);
    alert("Profile updated successfully!");
  };

  return (
    <div>
      {/* Breadcrumb */}
      <CustomBreadcrumb />

      {/* Heading + Back Button */}
      <div className="flex flex-col sm:flex-row items-center  justify-between my-4 ">
        <h1 className="text-xl font-bold text-yellow-700  uppercase dark:text-white mb-4 sm:mb-0">
          Profile Settings
        </h1>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft size={16} /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1  md:grid-cols-3 gap-8 md:mt-6">
        {/* Left Card - Profile Info */}
        <div className="col-span-1 flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 shadow-lg">
            <Image
              src={profileImage}
              alt="Profile"
              width={158}
              height={158}
              className="w-full h-half object-cover rounded-full"
            />
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="fileUpload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setProfileImage(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
          <label
            htmlFor="fileUpload"
            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Change Photo
          </label>

          <div className="mt-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Shibin sha
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admin</p>
          </div>
        </div>

        {/* Right Card - Form */}
        <div className="col-span-2 bg-gray-50 dark:bg-gray-800  rounded-xl shadow-md">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Name */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-semibold">Name</label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter your name" className="mt-1" />
                )}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-semibold">Email</label>
              <Controller
                name="email"
                control={control}
                rules={{ required: "Email is required" }}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter your email" className="mt-1" />
                )}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-semibold">Phone</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter phone number" className="mt-1" />
                )}
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-semibold">Address</label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter your address" className="mt-1" />
                )}
              />
            </div>

            {/* Submit */}
            <div className="col-span-2 flex justify-end mt-4">
              <Button
                type="submit"
                className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
