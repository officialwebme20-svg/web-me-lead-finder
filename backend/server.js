const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

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
    groq: Boolean(GROQ_API_KEY),
    webSearch: Boolean(
      GOOGLE_SEARCH_API_KEY && GOOGLE_SEARCH_ENGINE_ID
    )
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function googlePlacesRequest(body) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.name",
          "places.displayName",
          "places.formattedAddress",
          "places.shortFormattedAddress",
          "places.addressComponents",
          "places.location",
          "places.nationalPhoneNumber",
          "places.internationalPhoneNumber",
          "places.websiteUri",
          "places.googleMapsUri",
          "places.rating",
          "places.userRatingCount",
          "places.regularOpeningHours",
          "places.currentOpeningHours",
          "places.types",
          "places.primaryType",
          "places.primaryTypeDisplayName",
          "places.businessStatus",
          "places.priceLevel",
          "places.editorialSummary",
          "nextPageToken"
        ].join(",")
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places error: ${errorText}`);
  }

  return response.json();
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
      await sleep(1000);
    }

    const data = await googlePlacesRequest(body);

    if (Array.isArray(data.places)) {
      results.push(...data.places);
    }

    if (!data.nextPageToken) {
      break;
    }

    pageToken = data.nextPageToken;
  }

  const unique = [];
  const seen = new Set();

  for (const place of results) {
    const key =
      place.id ||
      `${place.displayName?.text || ""}-${place.formattedAddress || ""}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(place);
    }
  }

  return unique;
}

function getAddressComponent(place, type) {
  const component = place.addressComponents?.find(item =>
    item.types?.includes(type)
  );

  return (
    component?.longText ||
    component?.shortText ||
    ""
  );
}

function getAddressDetails(place, country, area) {
  return {
    country:
      getAddressComponent(place, "country") ||
      country ||
      "",
    region:
      getAddressComponent(place, "administrative_area_level_1") ||
      getAddressComponent(place, "administrative_area_level_2") ||
      "",
    city:
      getAddressComponent(place, "locality") ||
      getAddressComponent(place, "postal_town") ||
      getAddressComponent(place, "administrative_area_level_2") ||
      "",
    area:
      getAddressComponent(place, "sublocality") ||
      getAddressComponent(place, "sublocality_level_1") ||
      area ||
      "",
    postalCode:
      getAddressComponent(place, "postal_code") ||
      ""
  };
}

function normalizeGoogleBusiness(
  place,
  country,
  area,
  businessType
) {
  const name =
    place.displayName?.text ||
    "Unknown business";

  const location =
    getAddressDetails(
      place,
      country,
      area
    );

  const website =
    place.websiteUri || "";

  return {
    id:
      place.id ||
      `${name}-${Math.random()
        .toString(36)
        .slice(2)}`,

    name,

    type:
      place.primaryTypeDisplayName?.text ||
      businessType ||
      "Business",

    category:
      place.primaryType ||
      businessType ||
      "business",

    address:
      place.formattedAddress ||
      place.shortFormattedAddress ||
      "",

    country: location.country,
    region: location.region,
    city: location.city,
    area: location.area,
    postalCode: location.postalCode,

    phone:
      place.internationalPhoneNumber ||
      place.nationalPhoneNumber ||
      "",

    whatsapp: "",
    email: "",

    website,

    websiteStatus:
      website
        ? "website-found"
        : "no-website",

    websiteEvidence:
      website
        ? "Google Places returned a website."
        : "Google Places did not return a website.",

    websiteTitle: "",
    websiteReachable: false,
    websiteFinalUrl: "",

    googleMapsUrl:
      place.googleMapsUri ||
      "",

    rating:
      typeof place.rating === "number"
        ? place.rating
        : null,

    reviews:
      Number(place.userRatingCount || 0),

    hours:
      formatOpeningHours(
        place.regularOpeningHours ||
        place.currentOpeningHours
      ),

    currentHours:
      formatOpeningHours(
        place.currentOpeningHours
      ),

    businessStatus:
      place.businessStatus ||
      "",

    priceLevel:
      place.priceLevel ||
      "",

    latitude:
      place.location?.latitude ??
      null,

    longitude:
      place.location?.longitude ??
      null,

    editorialSummary:
      place.editorialSummary?.text ||
      "",

    services: [],

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

function cleanSearchUrl(url) {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    return parsed.href;
  } catch {
    return "";
  }
}

function extractJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {}

  const match =
    text.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function extractEmails(text) {
  if (!text) {
    return [];
  }

  const matches =
    text.match(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    ) || [];

  return [
    ...new Set(
      matches.map(email =>
        email.toLowerCase()
      )
    )
  ];
}

function classifySocialUrl(url) {
  if (!url) {
    return null;
  }

  const lower =
    url.toLowerCase();

  if (
    lower.includes("instagram.com/")
  ) {
    return "instagram";
  }

  if (
    lower.includes("facebook.com/")
  ) {
    return "facebook";
  }

  if (
    lower.includes("tiktok.com/")
  ) {
    return "tiktok";
  }

  if (
    lower.includes("linkedin.com/")
  ) {
    return "linkedin";
  }

  if (
    lower.includes("youtube.com/") ||
    lower.includes("youtu.be/")
  ) {
    return "youtube";
  }

  if (
    lower.includes("x.com/") ||
    lower.includes("twitter.com/")
  ) {
    return "x";
  }

  if (
    lower.includes("wa.me/") ||
    lower.includes("whatsapp.com/")
  ) {
    return "whatsapp";
  }

  return null;
}

function isLikelyBusinessResult(
  business,
  result
) {
  const name =
    business.name
      .toLowerCase();

  const title =
    result.title
      ?.toLowerCase() ||
      "";

  const snippet =
    result.snippet
      ?.toLowerCase() ||
      "";

  const combined =
    `${title} ${snippet}`;

  const words =
    name
      .split(/\s+/)
      .filter(word =>
        word.length >= 4
      );

  if (!words.length) {
    return false;
  }

  const matched =
    words.filter(word =>
      combined.includes(word)
    ).length;

  return (
    matched >=
    Math.max(
      1,
      Math.ceil(words.length * 0.35)
    )
  );
}

async function publicWebSearch(query) {
  if (
    !GOOGLE_SEARCH_API_KEY ||
    !GOOGLE_SEARCH_ENGINE_ID
  ) {
    return [];
  }

  const url =
    new URL(
      "https://www.googleapis.com/customsearch/v1"
    );

  url.searchParams.set(
    "key",
    GOOGLE_SEARCH_API_KEY
  );

  url.searchParams.set(
    "cx",
    GOOGLE_SEARCH_ENGINE_ID
  );

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "num",
    "10"
  );

  try {
    const response =
      await fetch(url.href);

    if (!response.ok) {
      return [];
    }

    const data =
      await response.json();

    return Array.isArray(
      data.items
    )
      ? data.items
      : [];
  } catch {
    return [];
  }
}

function addUniqueUrl(
  array,
  url
) {
  const clean =
    cleanSearchUrl(url);

  if (
    clean &&
    !array.includes(clean)
  ) {
    array.push(clean);
  }
}

async function researchPublicPresence(
  business
) {
  if (
    !GOOGLE_SEARCH_API_KEY ||
    !GOOGLE_SEARCH_ENGINE_ID
  ) {
    return business;
  }

  const location =
    [
      business.area,
      business.city,
      business.region,
      business.country
    ]
      .filter(Boolean)
      .join(", ");

  const query =
    `"${business.name}" ${location}`;

  const results =
    await publicWebSearch(
      query
    );

  const validResults =
    results.filter(result =>
      isLikelyBusinessResult(
        business,
        result
      )
    );

  const researchSources = [];

  if (business.googleMapsUrl) {
    addUniqueUrl(
      researchSources,
      business.googleMapsUrl
    );
  }

  if (business.website) {
    addUniqueUrl(
      researchSources,
      business.website
    );
  }

  const socialCandidates = {
    instagram: [],
    facebook: [],
    tiktok: [],
    linkedin: [],
    x: [],
    youtube: [],
    whatsapp: []
  };

  const otherSocials = [];
  const directories = [];

  const directoryDomains = [
    "yelp.com",
    "yellowpages.com",
    "tripadvisor.com",
    "mapquest.com",
    "foursquare.com",
    "bbb.org",
    "manta.com",
    "chamberofcommerce.com"
  ];

  for (const result of validResults) {
    const link =
      cleanSearchUrl(
        result.link
      );

    if (!link) {
      continue;
    }

    addUniqueUrl(
      researchSources,
      link
    );

    const socialType =
      classifySocialUrl(link);

    if (socialType) {
      socialCandidates[
        socialType
      ].push(link);

      continue;
    }

    const lower =
      link.toLowerCase();

    if (
      directoryDomains.some(
        domain =>
          lower.includes(domain)
      )
    ) {
      if (
        !directories.includes(link)
      ) {
        directories.push(link);
      }

      continue;
    }

    if (
      !otherSocials.includes(link)
    ) {
      otherSocials.push(link);
    }
  }

  const emailText =
    validResults
      .map(result =>
        [
          result.title,
          result.snippet,
          result.htmlSnippet
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join(" ");

  const emails =
    extractEmails(
      emailText
    );

  if (emails.length) {
    business.email =
      emails[0];
  }

  business.instagram =
    socialCandidates.instagram[0] ||
    "";

  business.facebook =
    socialCandidates.facebook[0] ||
    "";

  business.tiktok =
    socialCandidates.tiktok[0] ||
    "";

  business.linkedin =
    socialCandidates.linkedin[0] ||
    "";

  business.x =
    socialCandidates.x[0] ||
    "";

  business.youtube =
    socialCandidates.youtube[0] ||
    "";

  business.whatsapp =
    socialCandidates.whatsapp[0] ||
    "";

  business.otherSocials =
    otherSocials.slice(0, 10);

  business.directories =
    directories.slice(0, 10);

  business.researchSources =
    researchSources.slice(0, 20);

  if (!business.website) {
    const websiteCandidate =
      validResults.find(result => {
        const type =
          classifySocialUrl(
            result.link
          );

        if (type) {
          return false;
        }

        return (
          result.link &&
          !directoryDomains.some(
            domain =>
              result.link
                .toLowerCase()
                .includes(domain)
          )
        );
      });

    if (
      websiteCandidate?.link
    ) {
      const candidate =
        normalizeUrl(
          websiteCandidate.link
        );

      if (candidate) {
        business.website =
          candidate;

        business.websiteEvidence =
          "A public web search found a possible website. It will be verified separately.";
      }
    }
  }

  return business;
}

async function checkWebsite(
  url
) {
  if (!url) {
    return {
      status: "no-website",
      reachable: false,
      finalUrl: "",
      title: ""
    };
  }

  const cleanUrl =
    normalizeUrl(url);

  if (!cleanUrl) {
    return {
      status: "unknown",
      reachable: false,
      finalUrl: "",
      title: ""
    };
  }

  try {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        8000
      );

    const response =
      await fetch(
        cleanUrl,
        {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "WebMeLeadFinder/1.0"
          }
        }
      );

    clearTimeout(timeout);

    const finalUrl =
      response.url ||
      cleanUrl;

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (!response.ok) {
      return {
        status: "possible",
        reachable: false,
        finalUrl,
        title: ""
      };
    }

    let title = "";

    if (
      contentType.includes(
        "text/html"
      )
    ) {
      const html =
        await response.text();

      const match =
        html.match(
          /<title[^>]*>([\s\S]*?)<\/title>/i
        );

      if (match) {
        title =
          match[1]
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 200);
      }
    }

    return {
      status: "website-found",
      reachable: true,
      finalUrl,
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

async function analyzeBusinessWithGroq(
  business
) {
  if (!GROQ_API_KEY) {
    return {
      summary: "",
      opportunity: "",
      notes: ""
    };
  }

  const prompt = `
You are Web Me, a factual business research assistant.

Analyze only the verified information supplied below.

Do not invent:
- phone numbers
- emails
- websites
- social media accounts
- addresses
- reviews
- services
- business facts

If information is missing, explicitly say that it is unavailable.

Return valid JSON only.

Business information:

${JSON.stringify(
  business,
  null,
  2
)}

Return:

{
  "summary": "A concise factual summary.",
  "opportunity": "Explain the website opportunity only from the evidence supplied.",
  "notes": "Useful practical research notes."
}
`;

  try {
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
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content:
                  "You are Web Me. You are a factual business research assistant. Never fabricate information."
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

    const data =
      await response.json();

    const content =
      data.choices?.[0]
        ?.message
        ?.content || "";

    const parsed =
      extractJson(content);

    if (!parsed) {
      return {
        summary:
          content.slice(0, 1500),
        opportunity: "",
        notes: ""
      };
    }

    return {
      summary:
        parsed.summary || "",
      opportunity:
        parsed.opportunity || "",
      notes:
        parsed.notes || ""
    };
  } catch {
    return {
      summary: "",
      opportunity: "",
      notes: ""
    };
  }
}

async function researchBusiness(
  business
) {
  const webResearch =
    await researchPublicPresence(
      business
    );

  business =
    webResearch || business;

  const websiteResult =
    await checkWebsite(
      business.website
    );

  business.websiteStatus =
    websiteResult.status;

  business.websiteReachable =
    websiteResult.reachable;

  business.websiteFinalUrl =
    websiteResult.finalUrl;

  business.websiteTitle =
    websiteResult.title;

  if (
    websiteResult.finalUrl &&
    !business.website
  ) {
    business.website =
      websiteResult.finalUrl;
  }

  if (
    websiteResult.status ===
    "website-found"
  ) {
    business.websiteEvidence =
      `Verified reachable website: ${websiteResult.finalUrl}`;
  } else if (
    business.website
  ) {
    business.websiteEvidence =
      "A website was found, but it could not be fully verified.";
  } else {
    business.websiteEvidence =
      "No verified website was found.";
  }

  const ai =
    await analyzeBusinessWithGroq(
      business
    );

  business.researchCompleted =
    true;

  business.researchSummary =
    ai.summary;

  business.opportunity =
    ai.opportunity;

  business.aiNotes =
    ai.notes;

  return business;
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

async function researchBusinesses(
  businesses
) {
  const results = [];

  const batchSize = 5;

  for (
    let i = 0;
    i < businesses.length;
    i += batchSize
  ) {
    const batch =
      businesses.slice(
        i,
        i + batchSize
      );

    const researched =
      await Promise.all(
        batch.map(
          business =>
            researchBusiness(
              business
            )
        )
      );

    results.push(
      ...researched
    );
  }

  return results;
}

app.post(
  "/api/search",
  async (req, res) => {
    try {
      const {
        country,
        area,
        businessType,
        research = true
      } = req.body;

      if (
        !country ||
        !businessType
      ) {
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
        await googlePlacesSearch(
          query
        );

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

      const noWebsite =
        businesses.filter(
          business =>
            business.websiteStatus ===
            "no-website"
        ).length;

      const websiteFound =
        businesses.filter(
          business =>
            business.websiteStatus ===
              "website-found" ||
            business.websiteStatus ===
              "possible"
        ).length;

      const researchCompleted =
        businesses.filter(
          business =>
            business.researchCompleted
        ).length;

      res.json({
        success: true,
        query,
        count:
          businesses.length,
        totalFound:
          businesses.length,
        noWebsite,
        websiteFound,
        researchCompleted,
        webSearchEnabled:
          Boolean(
            GOOGLE_SEARCH_API_KEY &&
            GOOGLE_SEARCH_ENGINE_ID
          ),
        results:
          businesses
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
  }
);

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
Create a practical website plan for this real business.

Use only the supplied information.

Do not invent business facts.

Return valid JSON:

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
        data.choices?.[0]
          ?.message
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

app.post(
  "/api/chat",
  async (req, res) => {
    try {
      if (!GROQ_API_KEY) {
        return res.status(500).json({
          error:
            "GROQ_API_KEY is not configured."
        });
      }

      const {
        message,
        business,
        results
      } = req.body;

      if (
        !message ||
        !String(message).trim()
      ) {
        return res.status(400).json({
          error:
            "A message is required."
        });
      }

      const safeResults =
        Array.isArray(results)
          ? results.slice(0, 30)
          : [];

      const context = {
        selectedBusiness:
          business || null,
        searchResults:
          safeResults
      };

      const prompt = `
You are Web Me, the AI assistant inside Web Me Lead Finder.

The user is researching real businesses and potential website opportunities.

Answer the user's question using only the information contained in the supplied context.

You may:
- summarize businesses
- compare businesses
- explain available research
- identify missing information
- suggest research questions
- explain website opportunities
- suggest website features
- create outreach preparation
- analyze the supplied search results

You must not invent:
- business facts
- phone numbers
- emails
- social handles
- websites
- addresses
- ratings
- reviews
- services
- contact details

If the information is not available, say that it is not available in the current research.

Do not claim to have searched the internet unless the supplied context contains the search evidence.

User question:

${message}

Research context:

${JSON.stringify(
  context,
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
              temperature: 0.25,
              messages: [
                {
                  role: "system",
                  content:
                    "You are Web Me, a factual business research AI."
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
          error:
            errorText ||
            "AI request failed."
        });
      }

      const data =
        await response.json();

      const reply =
        data.choices?.[0]
          ?.message
          ?.content ||
        "Web Me could not generate a response.";

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
          "AI chat failed."
      });
    }
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Web Me Lead Finder API running on port ${PORT}`
    );
  }
);
