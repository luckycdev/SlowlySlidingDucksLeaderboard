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
        const { p, pp } = req.query;
        
        let url = 'https://www.tunnelvision.it/API/leaderboard.php';
        const params = new URLSearchParams();
        
        if (p) params.append('p', p);
        if (pp) params.append('pp', pp);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(500).json({
                success: false,
                data: [],
                noMoreData: true,
                error: 'Failed to fetch from external API'
            });
        }

        const text = await response.text();

        if (text.trim() === "Error" || text.trim() === "") {
            return res.status(200).json({
                success: true,
                data: [],
                noMoreData: true
            });
        }

        const cleaned = text.trim().replace(/^\d+\s*/, ''); // remove page number
        const regex = /([^,<>]+),(\d+)/g; // seperate name,xp and take out any < and >s 
        let match;
        const results = [];

        while ((match = regex.exec(cleaned)) !== null) {
            results.push({
                name: match[1].trim(),
                xp: parseInt(match[2])
            });
        }

        const noMoreData = results.length === 0;

        return res.status(200).json({
            success: true,
            data: results,
            noMoreData: noMoreData
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            data: [],
            noMoreData: true,
            error: error.message
        });
    }
}