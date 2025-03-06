import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import ResourceDirectory from "@/pages/ResourceDirectory";
import FacilityDetail from "@/pages/FacilityDetail";
import ResourceDetail from "@/pages/ResourceDetail";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <main className="flex-1 pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/resources" component={ResourceDirectory} />
          <Route path="/facility/:id" component={FacilityDetail} />
          <Route path="/resource/:id" component={ResourceDetail} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;