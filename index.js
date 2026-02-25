let totalPlayers = 0;
let currentPage = 2; // first 2 pages already loaded

const leaderboardTable = document.querySelector("#leaderboard");
const tbody = leaderboardTable ? leaderboardTable.querySelector("tbody") : null;
const loadMoreButton = document.getElementById("loadMoreButton");
const loadMoreMessage = document.getElementById("loadMoreMessage");
const loadingDiv = document.getElementById("loading");
const playerCountDiv = document.getElementById("playerCount");

async function fetchPlayerCount() {
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
        
        if (playerCountDiv) {
            playerCountDiv.innerText = `${totalCount.toLocaleString()} Ducks Online`;
        }
    } catch (err) {
        if (playerCountDiv) {
            playerCountDiv.innerText = "";
        }
        console.error("Failed to fetch player count:", err);
    }
}

fetchPlayerCount();

async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error: " + response.status);

    const text = await response.text();

    if (text.trim() === "Error") return [];

    const cleaned = text.trim().replace(/^\d+\s*/, ''); // remove page number
    const regex = /([^,<>]+),(\d+)/g; // seperate name,xp and take out any < and >s
    let match;
    const results = [];

    while ((match = regex.exec(cleaned)) !== null) {
        results.push({ name: match[1].trim(), xp: parseInt(match[2]) });
    }

    if (results.length === 0) return [];

    return results;
}

async function appendLeaderboard(players) {
    if (!tbody) return;

    players.forEach((player) => {
        const row = document.createElement("tr");
        totalPlayers++;
        row.innerHTML = `
            <td>${totalPlayers}</td>
            <td>${player.name}</td>
            <td>${player.xp.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadInitialLeaderboard() {
    if (!tbody) return;

    try {
        const page0 = await fetchPage("https://www.tunnelvision.it/API/leaderboard.php");
        const page1 = await fetchPage("https://www.tunnelvision.it/API/leaderboard.php?p=1");

        await appendLeaderboard([...page0, ...page1]);

        if (loadingDiv) loadingDiv.style.display = "none";
        if (leaderboardTable) leaderboardTable.style.display = "table";
        if (loadMoreButton) loadMoreButton.style.display = "inline-block";

    } catch (err) {
        if (loadingDiv) loadingDiv.innerText = "Failed to load leaderboard";
        console.error(err);
    }
}

async function loadMoreLeaderboard() {
    if (!loadMoreMessage || !loadMoreButton) return;

    loadMoreMessage.innerText = "";

    try {
        const nextPage = await fetchPage(`https://www.tunnelvision.it/API/leaderboard.php?p=${currentPage}`);

        if (nextPage.length === 0) {
            loadMoreMessage.innerText = "No more leaderboard data or failed to load";
            loadMoreButton.style.display = "none";
            return;
        }

        await appendLeaderboard(nextPage);
        currentPage++;
    } catch (err) {
        loadMoreMessage.innerText = "No more leaderboard data or failed to load";
        loadMoreButton.style.display = "none";
        console.error(err);
    }
}

async function loadFullLeaderboard() {

    if (loadingDiv) loadingDiv.innerText = "Loading full leaderboard...";

    try {
        const players = await fetchPage("https://www.tunnelvision.it/API/leaderboard.php?pp=20000"); // load top 20k players
        await appendLeaderboard(players);

        if (loadingDiv) loadingDiv.style.display = "none";
        if (leaderboardTable) leaderboardTable.style.display = "table";

    } catch (err) {
        if (loadingDiv) loadingDiv.innerText = "Failed to load full leaderboard";
        console.error(err);
    }
}

loadMoreButton?.addEventListener("click", loadMoreLeaderboard);