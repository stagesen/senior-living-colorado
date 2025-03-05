import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchBar from "@/components/SearchBar";
import ResourceWizard from "@/components/ResourceWizard";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    setLocation(`/resources?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <section className="text-center py-16 space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Find Senior Living & Healthcare Resources
          <br />
          <span className="text-primary">in Colorado's Front Range</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with senior living communities, healthcare providers, and support services 
          in your area.
        </p>

        <Tabs defaultValue="quick-search" className="max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick-search">Quick Search</TabsTrigger>
            <TabsTrigger value="guided">Guided Search</TabsTrigger>
          </TabsList>

          <TabsContent value="quick-search" className="pt-6">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for facilities or resources..."
            />
          </TabsContent>

          <TabsContent value="guided" className="pt-6">
            <ResourceWizard />
          </TabsContent>
        </Tabs>
      </section>

      <section className="grid md:grid-cols-2 gap-8 py-12">
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Senior Living Facilities</h2>
          <p className="text-gray-600 mb-6">
            Browse assisted living, nursing homes, and retirement communities in the Front Range area.
          </p>
          <Link href="/resources?type=facilities">
            <Button size="lg">View Facilities</Button>
          </Link>
        </div>

        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Healthcare Resources</h2>
          <p className="text-gray-600 mb-6">
            Find healthcare providers, support services, and community resources for seniors.
          </p>
          <Link href="/resources?type=resources">
            <Button size="lg">View Resources</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}