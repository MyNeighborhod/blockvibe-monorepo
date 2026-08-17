import React from "react"

export const NogJsonLd: React.FC = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: "North of Grand Neighborhood Association",
    alternateName: ["North Of Grand", "NOG Neighborhood Association", "NOG"],
    url: "https://northofgrandneighborhood.org",
    logo: "https://northofgrandneighborhood.org/favicon-nog.png",
    description:
      "We are an active neighborhood association located just west of downtown Des Moines, Iowa, bounded by Grand Avenue, Interstate 235, 31st Street, and 42nd Street.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Des Moines",
      addressRegion: "IA",
      postalCode: "50312",
      addressCountry: "US",
    },
    sameAs: [
      "https://www.northofgranddsm.org",
      "https://northofgrandneighborhood.org",
    ],
    areaServed: {
      "@type": "AdministrativeArea",
      name: "North of Grand Historic District, Des Moines, Iowa",
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "North of Grand Neighborhood Association",
    url: "https://northofgrandneighborhood.org",
    publisher: {
      "@type": "NGO",
      name: "North of Grand Neighborhood Association",
    },
  }

  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "About",
        description: "Learn about the North of Grand neighborhood in Des Moines, Iowa.",
        url: "https://northofgrandneighborhood.org/about",
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Membership",
        description: "General membership and registration in the North of Grand Neighborhood Association.",
        url: "https://northofgrandneighborhood.org/membership",
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "Yearly Calendar",
        description: "Upcoming events, neighborhood meetings, and community activities.",
        url: "https://northofgrandneighborhood.org/yearly-calendar",
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "Archives and Documents",
        description: "Meeting minutes, neighborhood bylaws, newsletters, and historic archives.",
        url: "https://northofgrandneighborhood.org/archives-and-documents",
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "Businesses",
        description: "Directory of local businesses in the North of Grand neighborhood.",
        url: "https://northofgrandneighborhood.org/businesses",
      },
      {
        "@type": "SiteNavigationElement",
        position: 6,
        name: "Contact",
        description: "Get in touch with the North of Grand Neighborhood Association.",
        url: "https://northofgrandneighborhood.org/contact",
      },
    ],
  }

  const faqBoundariesSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the boundaries of the North of Grand neighborhood?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The North of Grand (NOG) neighborhood is located just west of downtown Des Moines, Iowa between 31st Street and 42nd Street, stretching from Grand Avenue (South boundary) to Interstate 235 (North boundary).",
        },
      },
      {
        "@type": "Question",
        name: "What is the mission of the North of Grand Neighborhood Association?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our mission is to strengthen relationships and improve quality of life for all residents and businesses in the North of Grand neighborhood through civic engagement, historic preservation, and community events.",
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteNavigationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqBoundariesSchema) }}
      />
    </>
  )
}
