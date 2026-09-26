"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");

/* =========================
   MIDDLEWARE
========================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);

app.use(
    express.static(PUBLIC_DIR)
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        service: "Web Me Lead Finder",
        status: "online",
        time: new Date().toISOString()
    });
});

/* =========================
   BUSINESS SEARCH
========================= */

app.post("/api/leads/search", async (req, res) => {
    try {
        const {
            country,
            area,
            businessType
        } = req.body;

        if (!country) {
            return res.status(400).json({
                success: false,
                error: "Country is required."
            });
        }

        if (!businessType) {
            return res.status(400).json({
                success: false,
                error: "Business type is required."
            });
        }

        const location = [
            area,
            country
        ]
            .filter(Boolean)
            .join(", ");

        const businesses = await findBusinesses({
            country,
            area,
            businessType,
            location
        });

        res.json({
            success: true,
            count: businesses.length,
            businesses
        });
    } catch (error) {
        console.error(
            "Business search error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Unable to search for businesses."
        });
    }
});

/* =========================
   BUSINESS RESEARCH
========================= */

app.post("/api/leads/research", async (req, res) => {
    try {
        const business = req.body.business;

        if (!business) {
            return res.status(400).json({
                success: false,
                error: "Business information is required."
            });
        }

        const research = await researchBusiness(
            business
        );

        res.json({
            success: true,
            research
        });
    } catch (error) {
        console.error(
            "Business research error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Unable to research this business."
        });
    }
});

/* =========================
   WEBSITE BRIEF
========================= */

app.post(
    "/api/leads/website-brief",
    async (req, res) => {
        try {
            const business = req.body.business;

            if (!business) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Business information is required."
                });
            }

            const brief =
                await createWebsiteBrief(
                    business
                );

            res.json({
                success: true,
                brief
            });
        } catch (error) {
            console.error(
                "Website brief error:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Unable to generate website brief."
            });
        }
    }
);

/* =========================
   WEB ME AI
========================= */

app.post("/api/ai/ask", async (req, res) => {
    try {
        const {
            message,
            business
        } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        const answer = await askWebMe(
            message,
            business
        );

        res.json({
            success: true,
            answer
        });
    } catch (error) {
        console.error(
            "AI error:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                "Unable to process your AI request."
        });
    }
});

/* =========================
   EXPORT LEADS
========================= */

app.post(
    "/api/leads/export",
    async (req, res) => {
        try {
            const {
                format,
                leads
            } = req.body;

            if (!Array.isArray(leads)) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Leads must be an array."
                });
            }

            const exportFormat =
                String(format || "csv")
                    .toLowerCase();

            if (exportFormat === "csv") {
                const csv = createCSV(leads);

                res.setHeader(
                    "Content-Type",
                    "text/csv; charset=utf-8"
                );

                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="web-me-leads.csv"'
                );

                return res.send(csv);
            }

            return res.status(400).json({
                success: false,
                error:
                    "This export format is not available yet."
            });
        } catch (error) {
            console.error(
                "Export error:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Unable to export leads."
            });
        }
    }
);

/* =========================
   GOOGLE PLACES SEARCH
========================= */

async function findBusinesses({
    country,
    area,
    businessType,
    location
}) {
    const apiKey =
        process.env.GOOGLE_PLACES_API_KEY;

    /*
     * API key is intentionally kept
     * on the server.
     */

    if (!apiKey) {
        console.warn(
            "GOOGLE_PLACES_API_KEY is not configured."
        );

        return [];
    }

    /*
     * Google Places integration
     * will be connected here.
     *
     * The frontend should never
     * receive your private API key.
     */

    console.log(
        "Business search:",
        {
            country,
            area,
            businessType,
            location
        }
    );

    return [];
}

/* =========================
   BUSINESS RESEARCH
========================= */

async function researchBusiness(business) {
    const website =
        business.website || "";

    const research = {
        status: "Research pending",

        reason:
            "Public business research has been received and is ready for the research engine.",

        description:
            business.description || "",

        services:
            Array.isArray(
                business.services
            )
                ? business.services
                : [],

        businessStatus:
            business.businessStatus || "",

        priceLevel:
            business.priceLevel || "",

        opportunity:
            "",

        sources:
            [],

        website: website,

        researchCompleted: false
    };

    return research;
}

/* =========================
   WEBSITE INTELLIGENCE
========================= */

async function createWebsiteBrief(
    business
) {
    if (!business.website) {
        return [
            "Website Intelligence Brief",
            "",
            `Business: ${
                business.name || "Unknown"
            }`,
            "",
            "No verified website was found for this business.",
            "",
            "Opportunity:",
            "This business may be a potential website lead."
        ].join("\n");
    }

    return [
        "Website Intelligence Brief",
        "",
        `Business: ${
            business.name || "Unknown"
        }`,

        `Website: ${
            business.website
        }`,

        "",

        "Website status:",
        "Website information received.",

        "",

        "Research:",
        "A full public-web website analysis will be generated when the website research engine is connected."
    ].join("\n");
}

/* =========================
   WEB ME AI
========================= */

async function askWebMe(
    message,
    business
) {
    const groqKey =
        process.env.GROQ_API_KEY;

    if (!groqKey) {
        return [
            "Web Me",

            "",

            "The AI provider is not configured yet.",

            "",

            "Add GROQ_API_KEY to your .env file to connect Web Me to the AI research engine."
        ].join("\n");
    }

    /*
     * Groq AI integration will be
     * connected here.
     *
     * The API key remains on
     * the server.
     */

    return [
        "Web Me received your request.",

        "",

        `Question: ${message}`,

        "",

        business
            ? `Business: ${
                  business.name ||
                  "Selected business"
              }`
            : "No business selected.",

        "",

        "The live AI research provider is ready to be connected to this endpoint."
    ].join("\n");
}

/* =========================
   CSV EXPORT
========================= */

function createCSV(leads) {
    const headers = [
        "Business",
        "Type",
        "Address",
        "Phone",
        "Email",
        "Website",
        "Rating",
        "Reviews",
        "Instagram",
        "Facebook",
        "TikTok",
        "LinkedIn",
        "X",
        "YouTube",
        "WhatsApp",
        "Research Completed"
    ];

    const rows = leads.map(
        business => {
            return [
                business.name,
                business.type,
                business.address,
                business.phone,
                business.email,
                business.website,
                business.rating,
                business.reviews,

                business.social?.instagram,
                business.social?.facebook,
                business.social?.tiktok,
                business.social?.linkedin,
                business.social?.x,
                business.social?.youtube,

                business.whatsapp,

                business.researchCompleted
                    ? "Yes"
                    : "No"
            ];
        }
    );

    return [
        headers,
        ...rows
    ]
        .map(row =>
            row
                .map(csvEscape)
                .join(",")
        )
        .join("\n");
}

/* =========================
   CSV ESCAPE
========================= */

function csvEscape(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return '""';
    }

    const text = String(value);

    return `"${text.replace(
        /"/g,
        '""'
    )}"`;
}

/* =========================
   FRONTEND FALLBACK
========================= */

app.use((req, res, next) => {
    if (
        req.method === "GET" &&
        !req.path.startsWith("/api/")
    ) {
        return res.sendFile(
            path.join(
                PUBLIC_DIR,
                "index.html"
            )
        );
    }

    next();
});

/* =========================
   API 404
========================= */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "API route not found."
    });
});

/* =========================
   ERROR HANDLER
========================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        console.error(
            "Server error:",
            error
        );

        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            success: false,
            error:
                "Internal server error."
        });
    }
);

/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    () => {
        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "      WEB ME LEAD FINDER"
        );
        console.log(
            "======================================"
        );
        console.log(
            `Server: http://localhost:${PORT}`
        );
        console.log(
            `Health: http://localhost:${PORT}/api/health`
        );
        console.log(
            "Frontend: public/index.html"
        );
        console.log(
            "JavaScript: public/app.js"
        );
        console.log(
            "======================================"
        );
        console.log("");
    }
);
