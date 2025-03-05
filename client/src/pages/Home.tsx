import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import ResourceWizard from "@/components/ResourceWizard";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    setLocation(`/resources?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <section className="py-16 space-y-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            Find Senior Resources
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              in Colorado's Front Range
            </span>
          </h1>

          <p className="text-xl text-gray-600 mt-6 mb-12">
            Let us help you discover the perfect senior living communities, healthcare providers, 
            and support services tailored to your needs.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <ResourceWizard />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8 py-12">
        <div className="bg-primary/5 rounded-lg p-8 text-center transform hover:scale-105 transition-transform">
          <h2 className="text-2xl font-bold mb-4">Senior Living Facilities</h2>
          <p className="text-gray-600 mb-6">
            Browse assisted living, nursing homes, and retirement communities in the Front Range area.
          </p>
          <Link href="/resources?type=facilities">
            <Button size="lg" className="w-full md:w-auto">View Facilities</Button>
          </Link>
        </div>

        <div className="bg-primary/5 rounded-lg p-8 text-center transform hover:scale-105 transition-transform">
          <h2 className="text-2xl font-bold mb-4">Healthcare Resources</h2>
          <p className="text-gray-600 mb-6">
            Find healthcare providers, support services, and community resources for seniors.
          </p>
          <Link href="/resources?type=resources">
            <Button size="lg" className="w-full md:w-auto">View Resources</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}