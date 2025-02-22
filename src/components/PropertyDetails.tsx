import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import PropertyDetailsOverview from "@/components/PropertyDetailsOverview";
import PropertyDetailsGallery from "@/components/PropertyDetailsGallery";
import PropertyDetailsLocation from "@/components/PropertyDetailsLocation";

export default function PropertyDetails({ params }) {
  const id = params?.id;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="container mx-auto"
      >
        {/* Navigation Tabs */}
        <div className="sticky top-16 z-50 pt-4 pb-2 backdrop-blur-sm">
          <div className="container mx-auto flex justify-center">
            <TabsList className="bg-transparent border-none p-1 relative">
              <div className="absolute inset-0 bg-accent/40 dark:bg-accent/20 rounded-full blur-md" />
              <motion.div
                layoutId="tab-background"
                className="absolute rounded-full bg-white dark:bg-gray-800"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                style={{
                  top: 2,
                  left: activeTab === "overview" ? 2 : activeTab === "gallery" ? "33.33%" : "66.66%",
                  width: "33.33%",
                  height: "calc(100% - 4px)",
                }}
              />
              {["overview", "gallery", "location"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className={`
                    relative px-6 capitalize z-10 transition-all duration-500
                    data-[state=active]:text-primary
                    data-[state=active]:shadow-none
                    data-[state=active]:bg-transparent
                  `}
                >
                  <span className="relative z-10">{tab}</span>
                  {activeTab === tab && (
                    <motion.div
                      layoutId="active-tab-glow"
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Content Area with seamless integration */}
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
                <PropertyDetailsLocation propertyId={id} />
              </TabsContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </>
  );
}
