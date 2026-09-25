const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Web Me Lead Finder API",
    status: "online"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    googlePlaces: Boolean(GOOGLE_MAPS_API_KEY),
    groq: Boolean(GROQ_API_KEY)
  });
});

async function googlePlacesSearch(textQuery) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.shortFormattedAddress",
          "places.location",
          "places.nationalPhoneNumber",
          "places.internationalPhoneNumber",
          "places.websiteUri",
          "places.googleMapsUri",
          "places.rating",
          "places.userRatingCount",
          "places.regularOpeningHours",
          "places.types",
          "places.primaryType",
          "places.primaryTypeDisplayName"
        ].join(",")
      },
      body: JSON.stringify({
        textQuery,
        languageCode: "en",
        pageSize: 20
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places error: ${errorText}`);
  }

  return response.json();
}

function normalizeGoogleBusiness(place, country, area, businessType) {
  const name = place.displayName?.text || "Unknown business";

  return {
    id: place.id || `${name}-${Math.random().toString(36).slice(2)}`,
    name,
    type:
      place.primaryTypeDisplayName?.text ||
      businessType ||
      "Business",
    address:
      place.formattedAddress ||
      place.shortFormattedAddress ||
      "",
    country,
    region: "",
    city: "",
    area,
    phone:
      place.internationalPhoneNumber ||
      place.nationalPhoneNumber ||
      "",
    whatsapp: "",
    email: "",
    website: place.websiteUri || "",
    websiteStatus: place.websiteUri
      ? "website-found"
      : "possible",
    websiteEvidence: place.websiteUri
      ? "Google Places returned a website"
      : "Google Places did not return a website",
    googleMapsUrl: place.googleMapsUri || "",
    rating: place.rating || null,
    reviews: place.userRatingCount || 0,
    hours: formatOpeningHours(place.regularOpeningHours),
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
    x: "",
    youtube: "",
    otherSocials: [],
    directories: [],
    researchSources: [],
    researchCompleted: false,
    researchSummary: "",
    opportunity: "",
    aiNotes: "",
    category:
      place.primaryType ||
      businessType ||
      "business",
    image: ""
  };
}

function formatOpeningHours(hours) {
  if (!hours?.weekdayDescriptions) {
    return [];
  }

  return hours.weekdayDescriptions;
}

function normalizeUrl(url) {
  if (!url) return "";

  try {
    return new URL(url).href;
  } catch {
    return "";
  }
}

async function checkWebsite(url) {
  if (!url) {
    return {
      status: "no-website",
      reachable: false,
      finalUrl: "",
      title: ""
    };
  }

  const cleanUrl = normalizeUrl(url);

  if (!cleanUrl) {
    return {
      status: "unknown",
      reachable: false,
      finalUrl: "",
      title: ""
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(cleanUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "WebMeLeadFinder/1.0"
      }
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      return {
        status: "possible",
        reachable: false,
        finalUrl: response.url || cleanUrl,
        title: ""
      };
    }

    let title = "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

      if (match) {
        title = match[1]
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 200);
      }
    }

    return {
      status: "website-found",
      reachable: true,
      finalUrl: response.url || cleanUrl,
      title
    };
  } catch {
    return {
      status: "possible",
      reachable: false,
      finalUrl: cleanUrl,
      title: ""
    };
  }
}

function extractJson(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {}

  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function analyzeBusinessWithGroq(business) {
  if (!GROQ_API_KEY) {
    return {
      summary: "",
      opportunity: "",
      notes: ""
    };
  }

  const prompt = `
You are a business research assistant for Web Me Lead Finder.

Analyze only the information provided below.

Do not invent:
- phone numbers
- emails
- websites
- social media accounts
- addresses
- reviews
- business facts

Return valid JSON only.

Business:
${JSON.stringify(business, null, 2)}

Return:
{
  "summary": "A concise factual summary of the business.",
  "opportunity": "Explain whether there appears to be a website opportunity based only on the evidence. If the evidence is insufficient, say so.",
  "notes": "Useful practical research notes for someone considering creating a website for this business."
}
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are a factual business research assistant. Never fabricate information."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    if (!response.ok) {
      return {
        summary: "",
        opportunity: "",
        notes: ""
      };
    }

    const data = await response.json();

    const content =
      data.choices?.[0]?.message?.content || "";

    const parsed = extractJson(content);

    if (!parsed) {
      return {
        summary: content.slice(0, 1000),
        opportunity: "",
        notes: ""
      };
    }

    return {
      summary: parsed.summary || "",
      opportunity: parsed.opportunity || "",
      notes: parsed.notes || ""
    };
  } catch {
    return {
      summary: "",
      opportunity: "",
      notes: ""
    };
  }
}

function buildSearchQuery(country, area, businessType) {
  return [businessType, area, country]
    .filter(Boolean)
    .join(", ");
}

async function researchBusiness(business) {
  const websiteResult = await checkWebsite(business.website);

  business.websiteStatus = websiteResult.status;

  business.websiteEvidence = websiteResult.reachable
    ? `Website reachable at ${websiteResult.finalUrl}`
    : business.website
      ? "Website was listed but could not be fully verified"
      : "No website was returned by Google Places";

  if (websiteResult.finalUrl && !business.website) {
    business.website = websiteResult.finalUrl;
  }

  const ai = await analyzeBusinessWithGroq(business);

  business.researchCompleted = true;
  business.researchSummary = ai.summary;
  business.opportunity = ai.opportunity;
  business.aiNotes = ai.notes;

  return business;
}

app.post("/api/search", async (req, res) => {
  try {
    const {
      country,
      area,
      businessType,
      research = true
    } = req.body;

    if (!country || !businessType) {
      return res.status(400).json({
        error: "Country and business type are required."
      });
    }

    const query = buildSearchQuery(
      country,
      area,
      businessType
    );

    const placesData = await googlePlacesSearch(query);

    let businesses = (placesData.places || []).map(place =>
      normalizeGoogleBusiness(
        place,
        country,
        area,
        businessType
      )
    );

    if (research) {
      const researched = [];

      for (const business of businesses) {
        const result = await researchBusiness(business);
        researched.push(result);
      }

      businesses = researched;
    }

    businesses = businesses.filter(
      business => business.websiteStatus !== "website-found"
    );

    res.json({
      success: true,
      query,
      count: businesses.length,
      results: businesses
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message || "Search failed."
    });
  }
});

app.post("/api/research/website-plan", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is not configured."
      });
    }

    const business = req.body.business;

    if (!business) {
      return res.status(400).json({
        error: "Business information is required."
      });
    }

    const prompt = `
Create a practical website plan for this real business using only the supplied information.

Do not invent business facts.

Return JSON:

{
  "websiteConcept": "",
  "pages": [],
  "homepageSections": [],
  "features": [],
  "contentNeeded": [],
  "designDirection": "",
  "conversionGoals": []
}

Business:
${JSON.stringify(business, null, 2)}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You create practical website plans from verified business information."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        error: errorText
      });
    }

    const data = await response.json();

    const content =
      data.choices?.[0]?.message?.content || "";

    const plan = extractJson(content);

    res.json({
      success: true,
      plan: plan || {
        websiteConcept: content
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message || "Website plan generation failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Web Me Lead Finder API running on port ${PORT}`);
});
