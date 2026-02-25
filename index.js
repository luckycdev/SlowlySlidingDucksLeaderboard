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
        const response = await fetch('/api/playercount');
        const json = await response.json();
        
        if (json.success && json.count) {
            if (playerCountDiv) {
                playerCountDiv.innerText = `${json.count.toLocaleString()} Ducks Online`;
            }
        } else {
            if (playerCountDiv) {
                playerCountDiv.innerText = "";
            }
        }
    } catch (err) {
        if (playerCountDiv) {
            playerCountDiv.innerText = "";
        }
        console.error("Failed to fetch player count:", err);
    }
}

fetchPlayerCount();

async function fetchPage(page = null, perPage = null) {
    let url = '/api/leaderboard';
    const params = new URLSearchParams();
    
    if (page !== null) params.append('p', page);
    if (perPage !== null) params.append('pp', perPage);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("HTTP error: " + response.status);

    const json = await response.json();

    if (!json.success) {
        return { data: [], noMoreData: true };
    }

    return { data: json.data, noMoreData: json.noMoreData };
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
        const page0 = await fetchPage();
        const page1 = await fetchPage(1);

        await appendLeaderboard([...page0.data, ...page1.data]);

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
        const result = await fetchPage(currentPage);

        if (result.noMoreData || result.data.length === 0) {
            loadMoreMessage.innerText = "No more leaderboard data or failed to load";
            loadMoreButton.style.display = "none";
            return;
        }

        await appendLeaderboard(result.data);
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
        const result = await fetchPage(null, 20000); // load top 20k players
        await appendLeaderboard(result.data);

        if (loadingDiv) loadingDiv.style.display = "none";
        if (leaderboardTable) leaderboardTable.style.display = "table";

    } catch (err) {
        if (loadingDiv) loadingDiv.innerText = "Failed to load full leaderboard";
        console.error(err);
    }
}

loadMoreButton?.addEventListener("click", loadMoreLeaderboard);