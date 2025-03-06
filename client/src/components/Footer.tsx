import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Discover",
      links: [
        { label: "Resource Directory", href: "/resources" },
        { label: "Cost Calculator", href: "/cost-calculator" },
        { label: "Care Types Guide", href: "/care-types" },
        { label: "Senior Living Blog", href: "/blog" },
      ],
    },
    {
      title: "Front Range",
      links: [
        { label: "Denver Communities", href: "/locations/denver" },
        { label: "Boulder Communities", href: "/locations/boulder" },
        { label: "Fort Collins Communities", href: "/locations/fort-collins" },
        { label: "Colorado Springs Communities", href: "/locations/colorado-springs" },
      ],
    },
    {
      title: "Care Types",
      links: [
        { label: "Independent Living", href: "/care-types/independent-living" },
        { label: "Assisted Living", href: "/care-types/assisted-living" },
        { label: "Memory Care", href: "/care-types/memory-care" },
        { label: "Skilled Nursing", href: "/care-types/skilled-nursing" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Mail, href: "#", label: "Email Newsletter" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>
                      <a className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social links and copyright */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.label}</span>
                </a>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Senior Living Colorado. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
