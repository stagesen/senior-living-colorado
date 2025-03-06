import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import ResourceWizard from "@/components/ResourceWizard";
import { MapPin, Users, Home as HomeIcon, Heart } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-secondary/50 to-background pt-16 pb-24">
        <div className="container max-w-5xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Senior Resources
              <br />
              <span className="text-gradient">
                in Colorado's Front Range
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Let us help you discover the perfect senior living communities, healthcare providers, 
              and support services tailored to your needs.
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-md p-8 border border-border">
            <ResourceWizard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing container">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card rounded-lg p-8 text-center card-shadow border border-border">
            <div className="bg-primary/5 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <HomeIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Senior Living</h3>
            <p className="text-muted-foreground mb-6">
              Find the perfect home with assisted living, nursing homes, and retirement communities.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 text-center card-shadow border border-border">
            <div className="bg-primary/5 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Health Services</h3>
            <p className="text-muted-foreground mb-6">
              Access quality healthcare providers specializing in senior care and wellness.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 text-center card-shadow border border-border">
            <div className="bg-primary/5 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-accent-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Community Support</h3>
            <p className="text-muted-foreground mb-6">
              Connect with social programs and activities designed for active seniors.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 text-center card-shadow border border-border">
            <div className="bg-primary/5 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Local Resources</h3>
            <p className="text-muted-foreground mb-6">
              Discover nearby amenities and services to enhance senior living experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Categories Section */}
      <section className="section-spacing bg-secondary/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Explore Our Resources</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-8 text-center hover:shadow-lg transition-all border border-border">
              <h3 className="text-2xl font-bold mb-4">Senior Living Facilities</h3>
              <p className="text-muted-foreground mb-6">
                Browse assisted living, nursing homes, and retirement communities in the Front Range area.
              </p>
              <Link href="/resources?type=facilities">
                <Button size="lg" className="w-full md:w-auto">View Facilities</Button>
              </Link>
            </div>

            <div className="bg-card rounded-lg p-8 text-center hover:shadow-lg transition-all border border-border">
              <h3 className="text-2xl font-bold mb-4">Healthcare Resources</h3>
              <p className="text-muted-foreground mb-6">
                Find healthcare providers, support services, and community resources for seniors.
              </p>
              <Link href="/resources?type=resources">
                <Button size="lg" className="w-full md:w-auto">View Resources</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="section-spacing container">
        <div className="bg-primary/5 rounded-xl p-8 md:p-12 border border-border">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our Users Say</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <p className="italic text-muted-foreground mb-4">
                "Finding the right assisted living facility for my mother was so much easier with this resource. Thank you!"
              </p>
              <div className="font-medium">— Sarah T.</div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <p className="italic text-muted-foreground mb-4">
                "The comprehensive information helped us make an informed decision for our dad's care. Invaluable resource."
              </p>
              <div className="font-medium">— Michael R.</div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <p className="italic text-muted-foreground mb-4">
                "As a healthcare provider, I often recommend this site to families looking for senior living options."
              </p>
              <div className="font-medium">— Dr. Lisa M.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}