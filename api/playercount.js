// for vercel serverless
export default async function handler(req, res) {
    // for cors
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const appIds = ["2485410", "4156670", "3743720"]; // main game, demo, playtest
        let totalCount = 0;
        
        const fetchPromises = appIds.map(appId =>
            fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`)
                .then(res => res.json())
                .catch(err => {
                    console.error(`Failed to fetch appid ${appId}:`, err);
                    return null;
                })
        );
        
        const results = await Promise.all(fetchPromises);
        
        results.forEach(data => {
            if (data && data.response && data.response.player_count) {
                totalCount += data.response.player_count;
            }
        });

        return res.status(200).json({
            success: true,
            count: totalCount
        });

    } catch (error) {
        console.error('Player count API Error:', error);
        return res.status(500).json({
            success: false,
            count: 0,
            error: error.message
        });
    }
}