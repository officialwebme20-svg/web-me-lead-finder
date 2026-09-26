"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| server.js is inside /backend
| public is one folder above /backend
|--------------------------------------------------------------------------
*/

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| FRONTEND STATIC FILES
|--------------------------------------------------------------------------
*/

app.use(
    express.static(PUBLIC_DIR)
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        service: "Web Me Lead Finder",
        status: "online",
        time: new Date().toISOString()
    });
});

/*
|--------------------------------------------------------------------------
| SEARCH BUSINESSES
|--------------------------------------------------------------------------
*/

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

        const businesses =
            await findBusinesses({
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
            error:
                "Unable to search for businesses."
        });
    }
});

/*
|--------------------------------------------------------------------------
| RESEARCH BUSINESS
|--------------------------------------------------------------------------
*/

app.post(
    "/api/leads/research",
    async (req, res) => {
        try {
            const business =
                req.body.business;

            if (!business) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Business information is required."
                });
            }

            const research =
                await researchBusiness(
                    business
                );

            res.json({
                success: true,
                research
            });
        } catch (error) {
            console.error(
                "Research error:",
                error
            );

            res.status(500).json({
                success: false,
                error:
                    "Unable to research this business."
            });
        }
    }
);

/*
|--------------------------------------------------------------------------
| WEBSITE BRIEF
|--------------------------------------------------------------------------
*/

app.post(
    "/api/leads/website-brief",
    async (req, res) => {
        try {
            const business =
                req.body.business;

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

/*
|--------------------------------------------------------------------------
| ASK WEB ME AI
|--------------------------------------------------------------------------
*/

app.post(
    "/api/ai/ask",
    async (req, res) => {
        try {
            const {
                message,
                business
            } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Message is required."
                });
            }

            const answer =
                await askWebMe(
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
                    "Unable to process AI request."
            });
        }
    }
);

/*
|--------------------------------------------------------------------------
| EXPORT LEADS
|--------------------------------------------------------------------------
*/

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
                String(
                    format || "csv"
                ).toLowerCase();

            if (
                exportFormat === "csv"
            ) {
                const csv =
                    createCSV(leads);

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

/*
|--------------------------------------------------------------------------
| BUSINESS SEARCH ENGINE
|--------------------------------------------------------------------------
*/

async function findBusinesses({
    country,
    area,
    businessType,
    location
}) {
    const apiKey =
        process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        console.warn(
            "GOOGLE_PLACES_API_KEY is not configured."
        );

        return [];
    }

    console.log(
        "Business search request:",
        {
            country,
            area,
            businessType,
            location
        }
    );

    /*
     * Google Places API connection
     * will run here.
     */

    return [];
}

/*
|--------------------------------------------------------------------------
| BUSINESS RESEARCH ENGINE
|--------------------------------------------------------------------------
*/

async function researchBusiness(
    business
) {
    return {
        status: "Research pending",

        reason:
            "Business research request received.",

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

        opportunity: "",

        sources: [],

        researchCompleted: false
    };
}

/*
|--------------------------------------------------------------------------
| WEBSITE INTELLIGENCE
|--------------------------------------------------------------------------
*/

async function createWebsiteBrief(
    business
) {
    if (!business.website) {
        return [
            "Website Intelligence Brief",
            "",
            `Business: ${
                business.name ||
                "Unknown"
            }`,
            "",
            "No verified website was found.",
            "",
            "Opportunity:",
            "This business may be a potential website lead."
        ].join("\n");
    }

    return [
        "Website Intelligence Brief",
        "",
        `Business: ${
            business.name ||
            "Unknown"
        }`,
        `Website: ${
            business.website
        }`,
        "",
        "Website status:",
        "Website information received.",
        "",
        "Research:",
        "Website analysis will be generated by the research engine."
    ].join("\n");
}

/*
|--------------------------------------------------------------------------
| WEB ME AI
|--------------------------------------------------------------------------
*/

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
            "The AI provider has not been configured yet.",
            "",
            "Add GROQ_API_KEY to your Render environment variables."
        ].join("\n");
    }

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
        "The AI research connection is ready for implementation."
    ].join("\n");
}

/*
|--------------------------------------------------------------------------
| CSV GENERATOR
|--------------------------------------------------------------------------
*/

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
        (business) => [
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
        ]
    );

    return [
        headers,
        ...rows
    ]
        .map(
            (row) =>
                row
                    .map(csvEscape)
                    .join(",")
        )
        .join("\n");
}

/*
|--------------------------------------------------------------------------
| CSV ESCAPE
|--------------------------------------------------------------------------
*/

function csvEscape(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return '""';
    }

    return `"${String(value).replace(
        /"/g,
        '""'
    )}"`;
}

/*
|--------------------------------------------------------------------------
| FRONTEND ROUTING
|--------------------------------------------------------------------------
*/

app.use(
    (req, res, next) => {
        if (
            req.method === "GET" &&
            !req.path.startsWith(
                "/api/"
            )
        ) {
            return res.sendFile(
                INDEX_FILE
            );
        }

        next();
    }
);

/*
|--------------------------------------------------------------------------
| API 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            error:
                "API route not found."
        });
    }
);

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

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

        if (
            res.headersSent
        ) {
            return next(error);
        }

        res.status(500).json({
            success: false,
            error:
                "Internal server error."
        });
    }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "       WEB ME LEAD FINDER"
        );
        console.log(
            "======================================"
        );
        console.log(
            `Server running on port ${PORT}`
        );
        console.log(
            `Public folder: ${PUBLIC_DIR}`
        );
        console.log(
            `Frontend: ${INDEX_FILE}`
        );
        console.log(
            "======================================"
        );
        console.log("");
    }
);
