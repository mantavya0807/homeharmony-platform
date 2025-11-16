import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import PropertyDetailsOverview from "@/components/PropertyDetailsOverview";
import PropertyDetailsGallery from "@/components/PropertyDetailsGallery";
import PropertyDetailsLocation from "@/components/PropertyDetailsLocation";

export default function PropertyDetails({ params }: { params: { id: string } }) {
  const id = params?.id;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="container mx-auto">
        {/* Navigation Tabs */}
        <div className="sticky top-16 z-50 pt-4 pb-2 backdrop-blur-sm">
          <div className="container mx-auto flex justify-center">
            <TabsList className="flex justify-center bg-transparent border-none p-1">
              {["overview", "gallery", "location"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="px-6 py-2 rounded-full transition-colors hover:bg-blue-100 focus:outline-none data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-16"
            >
              <TabsContent value="overview" className="focus-visible:outline-none">
                <PropertyDetailsOverview propertyId={id} />
              </TabsContent>
            </motion.div>
          )}
          {activeTab === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-16"
            >
              <TabsContent value="gallery" className="focus-visible:outline-none">
                <PropertyDetailsGallery propertyId={id} />
              </TabsContent>
            </motion.div>
          )}
          {activeTab === "location" && (
            <motion.div
              key="location"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="pt-16"
            >
              <TabsContent value="location" className="focus-visible:outline-none">
                <PropertyDetailsLocation />
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </>
  );
}
