import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { RouterProvider } from "react-router";
import { AuthProvider } from "@/auth/AuthProvider";
import { createQueryClient } from "@/query/queryClient";
import { router } from "@/routes/router";
import { ScriptBagProvider } from "@/scriptbag/ScriptBagProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ScriptBagProvider>
            <RouterProvider router={router} />
          </ScriptBagProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
