const express = require("express");
const { JSDOM } = require("jsdom");

const app = express();

app.use(express.json());

async function fetchTikTok(username) {
    const res = await fetch(
        `https://www.tiktok.com/@${username}`,
        {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"
            }
        }
    );

    const html = await res.text();

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const regionMatch = html.match(
        /"language":"(.*?)","region":"(.*?)"/
    );

    const jsonMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.*?)<\/script>/
    );

    let output = {
        success: true,
        username,
        title: doc.title,
        language: null,
        country: null,
        followerCount: null,
        followingCount: null,
        heartCount: null,
        videoCount: null,
        friendCount: null
    };

    if (regionMatch) {
        output.language = regionMatch[1];
        output.country = regionMatch[2];
    }

    if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1]);

        const stats =
            data.__DEFAULT_SCOPE__[
                "webapp.user-detail"
            ].userInfo.stats;

        output.followerCount =
            stats.followerCount;

        output.followingCount =
            stats.followingCount;

        output.heartCount =
            stats.heartCount;

        output.videoCount =
            stats.videoCount;

        output.friendCount =
            stats.friendCount;
    }

    return output;
}

app.post("/tiktok", async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                error: "Missing username"
            });
        }

        const data = await fetchTikTok(username);

        res.json(data);
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
