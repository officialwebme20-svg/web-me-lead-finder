const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json({ limit: "4mb" }));

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

const GOOGLE_FIELD_MASK = [
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
  "places.primaryTypeDisplayName",
  "nextPageToken"
].join(",");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function googlePlacesSearch(textQuery) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  const results = [];
  let pageToken = "";

  for (let page = 0; page < 3; page++) {
    const body = {
      textQuery,
      languageCode: "en",
      pageSize: 20
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    let response;

    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": GOOGLE_FIELD_MASK
          },
          body: JSON.stringify(body)
        }
      );

      if (response.ok) {
        break;
      }

      const errorText = await response.text();

      if (
        pageToken &&
        errorText.includes("INVALID_ARGUMENT") &&
        attempt < 3
      ) {
        await sleep(1500);
        continue;
      }

      throw new Error(`Google Places error: ${errorText}`);
    }

    const data = await response.json();

    if (Array.isArray(data.places)) {
      results.push(...data.places);
    }

    pageToken = data.nextPageToken || "";

    if (!pageToken) {
      break;
    }

    await sleep(1200);
  }

  const unique = [];
  const seen = new Set();

  for (const place of results) {
    const key =
      place.id ||
      `${place.displayName?.text || ""}|${place.formattedAddress || ""}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(place);
  }

  return unique;
}

function normalizeGoogleBusiness(place, country, area, businessType) {
  const name = place.displayName?.text || "Unknown business";

  return {
    id:
      place.id ||
      `${name}-${Math.random().toString(36).slice(2)}`,
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
      : "no-website",
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
  if (!url) {
    return "";
  }

  try {
    return new URL(url).href;
  } catch {
    return "";
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const match = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  return match
    ? cleanText(
        match[1]
          .replace(/<[^>]+>/g, " ")
      ).slice(0, 200)
    : "";
}

function absoluteUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return "";
  }
}

function extractWebsiteResearch(html, baseUrl) {
  const result = {
    email: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    linkedin: "",
    x: "",
    youtube: "",
    otherSocials: []
  };

  const links = [];
  const linkRegex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;

  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = absoluteUrl(match[1], baseUrl);

    if (url) {
      links.push(url);
    }
  }

  const emailMatch = html.match(
    /mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
  );

  if (emailMatch) {
    result.email = emailMatch[1];
  }

  if (!result.email) {
    const textEmailMatch = html.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
    );

    if (textEmailMatch) {
      result.email = textEmailMatch[0];
    }
  }

  for (const url of links) {
    const lower = url.toLowerCase();

    if (
      !result.instagram &&
      lower.includes("instagram.com/")
    ) {
      result.instagram = url;
      continue;
    }

    if (
      !result.facebook &&
      lower.includes("facebook.com/")
    ) {
      result.facebook = url;
      continue;
    }

    if (
      !result.tiktok &&
      lower.includes("tiktok.com/")
    ) {
      result.tiktok = url;
      continue;
    }

    if (
      !result.linkedin &&
      lower.includes("linkedin.com/")
    ) {
      result.linkedin = url;
      continue;
    }

    if (
      !result.youtube &&
      (lower.includes("youtube.com/") ||
        lower.includes("youtu.be/"))
    ) {
      result.youtube = url;
      continue;
    }

    if (
      !result.x &&
      (
        lower.includes("twitter.com/") ||
        lower.includes("x.com/")
      )
    ) {
      result.x = url;
      continue;
    }

    if (
      !result.whatsapp &&
      (
        lower.includes("wa.me/") ||
        lower.includes("whatsapp.com/")
      )
    ) {
      result.whatsapp = url;
      continue;
    }

    if (
      !lower.startsWith("mailto:") &&
      !lower.includes("instagram.com/") &&
      !lower.includes("facebook.com/") &&
      !lower.includes("tiktok.com/") &&
      !lower.includes("linkedin.com/") &&
      !lower.includes("youtube.com/") &&
      !lower.includes("youtu.be/") &&
      !lower.includes("twitter.com/") &&
      !lower.includes("x.com/") &&
      !lower.includes("wa.me/") &&
      !lower.includes("whatsapp.com/")
    ) {
      if (
        !url.startsWith(baseUrl) &&
        result.otherSocials.length < 10
      ) {
        result.otherSocials.push(url);
      }
    }
  }

  return result;
}

async function checkWebsite(url) {
  if (!url) {
    return {
      status: "no-website",
      reachable: false,
      finalUrl: "",
      title: "",
      html: "",
      research: null
    };
  }

  const cleanUrl = normalizeUrl(url);

  if (!cleanUrl) {
    return {
      status: "unknown",
      reachable: false,
      finalUrl: "",
      title: "",
      html: "",
      research: null
    };
  }

  let timeout;

  try {
    const controller = new AbortController();

    timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    const response = await fetch(cleanUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WebMeLeadFinder/1.0)"
      }
    });

    clearTimeout(timeout);

    const finalUrl = response.url || cleanUrl;
    const contentType =
      response.headers.get("content-type") || "";

    if (!response.ok) {
      return {
        status: "possible",
        reachable: false,
        finalUrl,
        title: "",
        html: "",
        research: null
      };
    }

    let html = "";
    let title = "";
    let research = null;

    if (contentType.includes("text/html")) {
      html = await response.text();

      title = extractTitle(html);

      research = extractWebsiteResearch(
        html,
        finalUrl
      );
    }

    return {
      status: "website-found",
      reachable: true,
      finalUrl,
      title,
      html: "",
      research
    };
  } catch {
    if (timeout) {
      clearTimeout(timeout);
    }

    return {
      status: "possible",
      reachable: false,
      finalUrl: cleanUrl,
      title: "",
      html: "",
      research: null
    };
  }
}

function extractJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {}

  const match = text.match(
    /\{[\s\S]*\}/
  );

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
You are Web Me, a factual business research assistant.

Analyze only the information supplied below.

Never invent:
- phone numbers
- emails
- websites
- social media accounts
- addresses
- reviews
- business facts

If something is missing, say it is missing.

Business:

${JSON.stringify(business, null, 2)}

Return valid JSON only:

{
  "summary": "A concise factual summary.",
  "opportunity": "Explain the website opportunity using only the evidence.",
  "notes": "Useful practical research notes."
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
                "You are Web Me, a factual business research assistant. Never fabricate information."
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

function buildSearchQuery(
  country,
  area,
  businessType
) {
  return [
    businessType,
    area,
    country
  ]
    .filter(Boolean)
    .join(", ");
}

async function researchBusiness(business) {
  const websiteResult =
    await checkWebsite(business.website);

  business.websiteStatus =
    websiteResult.status;

  business.websiteEvidence =
    websiteResult.reachable
      ? `Website reachable at ${websiteResult.finalUrl}`
      : business.website
        ? "Website was listed but could not be fully verified"
        : "No website was returned by Google Places";

  if (
    websiteResult.finalUrl &&
    !business.website
  ) {
    business.website =
      websiteResult.finalUrl;
  }

  if (websiteResult.research) {
    const research =
      websiteResult.research;

    business.email =
      research.email || business.email;

    business.whatsapp =
      research.whatsapp || business.whatsapp;

    business.instagram =
      research.instagram || business.instagram;

    business.facebook =
      research.facebook || business.facebook;

    business.tiktok =
      research.tiktok || business.tiktok;

    business.linkedin =
      research.linkedin || business.linkedin;

    business.x =
      research.x || business.x;

    business.youtube =
      research.youtube || business.youtube;

    business.otherSocials =
      research.otherSocials || [];

    if (business.website) {
      business.researchSources.push(
        business.website
      );
    }
  }

  const ai =
    await analyzeBusinessWithGroq(
      business
    );

  business.researchCompleted = true;
  business.researchSummary = ai.summary;
  business.opportunity = ai.opportunity;
  business.aiNotes = ai.notes;

  return business;
}

async function researchBusinesses(businesses) {
  const results = [];
  const concurrency = 5;

  for (
    let i = 0;
    i < businesses.length;
    i += concurrency
  ) {
    const batch =
      businesses.slice(
        i,
        i + concurrency
      );

    const researched =
      await Promise.all(
        batch.map(business =>
          researchBusiness(business)
        )
      );

    results.push(...researched);
  }

  return results;
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
        error:
          "Country and business type are required."
      });
    }

    const query =
      buildSearchQuery(
        country,
        area,
        businessType
      );

    const places =
      await googlePlacesSearch(query);

    let businesses =
      places.map(place =>
        normalizeGoogleBusiness(
          place,
          country,
          area,
          businessType
        )
      );

    if (research) {
      businesses =
        await researchBusinesses(
          businesses
        );
    }

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
      error:
        error.message ||
        "Search failed."
    });
  }
});

app.post(
  "/api/research/website-plan",
  async (req, res) => {
    try {
      if (!GROQ_API_KEY) {
        return res.status(500).json({
          error:
            "GROQ_API_KEY is not configured."
        });
      }

      const business =
        req.body.business;

      if (!business) {
        return res.status(400).json({
          error:
            "Business information is required."
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

${JSON.stringify(
  business,
  null,
  2
)}
`;

      const response =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model:
                "llama-3.3-70b-versatile",
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
        const errorText =
          await response.text();

        return res.status(500).json({
          error: errorText
        });
      }

      const data =
        await response.json();

      const content =
        data.choices?.[0]?.message
          ?.content || "";

      const plan =
        extractJson(content);

      res.json({
        success: true,
        plan:
          plan || {
            websiteConcept:
              content
          }
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error:
          error.message ||
          "Website plan generation failed."
      });
    }
  }
);

app.post("/api/ai/chat", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error:
          "GROQ_API_KEY is not configured."
      });
    }

    const messages =
      Array.isArray(req.body.messages)
        ? req.body.messages
        : [];

    const business =
      req.body.business || null;

    const searchResults =
      Array.isArray(req.body.searchResults)
        ? req.body.searchResults
        : [];

    if (!messages.length) {
      return res.status(400).json({
        success: false,
        error:
          "At least one message is required."
      });
    }

    const businessContext =
      business
        ? `
Currently selected business:

${JSON.stringify(
  business,
  null,
  2
)}
`
        : "No individual business is currently selected.";

    const searchContext =
      searchResults.length
        ? `
Current search results:

${JSON.stringify(
  searchResults.slice(0, 60),
  null,
  2
)}
`
        : "There are no current search results attached.";

    const systemPrompt = `
You are Web Me, the AI assistant inside Web Me Lead Finder.

You help the user research businesses, understand leads, inspect collected evidence, discuss website opportunities, and work with the current search results.

Use only the information provided in the conversation and attached business/search data.

Never invent:
- business facts
- phone numbers
- emails
- websites
- social media accounts
- ratings
- addresses
- reviews
- claims about a business that are not supported by the supplied information

If information is missing, clearly say it is missing.

You are not a generic chatbot. Your purpose is to help the user work with Web Me Lead Finder.

${businessContext}

${searchContext}
`;

    const response =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model:
              "llama-3.3-70b-versatile",
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              ...messages.slice(-20)
            ]
          })
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      return res.status(500).json({
        success: false,
        error: errorText
      });
    }

    const data =
      await response.json();

    const reply =
      data.choices?.[0]?.message
        ?.content || "";

    res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "AI request failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Web Me Lead Finder API running on port ${PORT}`
  );
});
