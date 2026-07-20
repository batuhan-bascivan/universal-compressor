import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <TooltipProvider>
      <Sonner />
      <Index />
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
