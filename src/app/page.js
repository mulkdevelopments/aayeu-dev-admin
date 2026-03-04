"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/contexts/AuthContext";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";


// ✅ Form Validation Schema
const loginSchema = z.object({
  email: z.string().nonempty().email("Invalid email address"),
 
});

export default function Login() {
  const router = useRouter();
  const { login } = useAuthUser();
  const { request: loginRequest, loading: loginLoading } = useAxios();

  const { control, handleSubmit, formState: { errors } } = useForm({
    mode: "onChange",
    resolver: zodResolver(loginSchema),
  });


  // ✅ Handle Login
  const handleLogin = async (data) => {
    try {
      const payload = {
        email: data.email,
        redirectUrl: window.location.origin,
      };

      const { data: responseData, error } = await loginRequest({
        method: "POST",
        url: "/admin/send-admin-magic-link",
        payload,
      });

     if (error) throw new Error(error?.message || error);
       if(responseData.success) {
        showToast("success", responseData.message || "Login successful!");
        // Save in context
        login(responseData.data); 
        // router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      showToast("error", err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => <Input {...field} placeholder="Enter email" />}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

         

          {/* Login Button */}
          <Button type="submit" className="w-full" disabled={loginLoading}>
            {loginLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}


// "use client";

// import { useState } from "react";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useRouter } from "next/navigation";
// import { useAuthUser } from "@/contexts/AuthContext";
// import { showToast } from "@/components/_ui/toast-utils";
// import useAxios from "@/hooks/useAxios";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Eye, EyeOff } from "lucide-react";

// // ✅ Form Validation Schema
// const loginSchema = z.object({
//   email: z.string().nonempty().email("Invalid email address"),
 
// });

// export default function Login() {
//   const router = useRouter();
//   const { login } = useAuthUser();
//   const { request: loginRequest, loading: loginLoading } = useAxios();

//   const { control, handleSubmit, formState: { errors } } = useForm({
//     mode: "onChange",
//     resolver: zodResolver(loginSchema),
//   });


//   // ✅ Handle Login
//   const handleLogin = async (data) => {
//     try {
//       const payload = {
//         email: data.email,
       
//       };

//       const { data: responseData, error } = await loginRequest({
//         method: "POST",
//         url: "/admin/send-admin-magic-link",
//         payload,
//       });

//       if (error) {
//         showToast("error", error);
//       } else {
//         showToast("success", responseData.message || "Login successful!");
//         // Save in context
//         login(responseData.data); 
//         // router.push("/dashboard");
//       }
//     } catch (err) {
//       console.error(err);
//       showToast("error", "Something went wrong. Try again.");
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
//       <div className="w-full max-w-md p-6 bg-white rounded shadow">
//         <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

//         <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
//           {/* Email */}
//           <div className="space-y-1">
//             <Label>Email</Label>
//             <Controller
//               name="email"
//               control={control}
//               defaultValue=""
//               render={({ field }) => <Input {...field} placeholder="Enter email" />}
//             />
//             {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
//           </div>

         

//           {/* Login Button */}
//           <Button type="submit" className="w-full" disabled={loginLoading}>
//             {loginLoading ? "Logging in..." : "Login"}
//           </Button>
//         </form>
//       </div>
//     </div>
//   );
// }
