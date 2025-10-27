import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import NavigationBar from "@/components/NavigationBar";

const TravelMenuPage = lazy(() => import("@/pages/TravelMenuPage"));
const ItineraryPage = lazy(() => import("@/pages/ItineraryPage"));
const EntityPage = lazy(() => import("@/pages/EntityPage"));
const ClusterPage = lazy(() => import("@/pages/ClusterPage"));

function App() {
  return (
    <div className="min-h-screen pb-24 bg-mist">
      <Suspense fallback={<div className="p-8 text-steel-gray">Loading Bay Area Travel Menu…</div>}>
        <Routes>
          <Route path="/" element={<TravelMenuPage />} />
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/entity/:id" element={<EntityPage />} />
          <Route path="/cluster/:id" element={<ClusterPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <NavigationBar />
      <Toaster position="bottom-center" richColors />
    </div>
  );
}

export default App;
