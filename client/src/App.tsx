import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Portal from "./pages/Portal";
import Empleados from "./pages/Empleados";
import Historia from "./pages/Historia";
import Calidad from "./pages/Calidad";
import ProductoDetalle from "./pages/ProductoDetalle";
import Compras from "./pages/Compras";
import Categoria from "./pages/Categoria";
import Login from "./pages/Login";
import LanguageSwitcher from "./components/LanguageSwitcher";
import WhatsAppButton from "./components/WhatsAppButton";
import { useScrollReveal } from "./hooks/useScrollReveal";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/portal"} component={Portal} />
      <Route path={"/empleados"} component={Empleados} />
      <Route path={"/historia"} component={Historia} />
      <Route path={"/calidad"} component={Calidad} />
      <Route path={"/producto/:id"} component={ProductoDetalle} />
      <Route path={"/compras"} component={Compras} />
      <Route path={"/categoria/:nombre"} component={Categoria} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  useScrollReveal();
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppInner />
            <Router />
            <LanguageSwitcher />
            <WhatsAppButton />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
