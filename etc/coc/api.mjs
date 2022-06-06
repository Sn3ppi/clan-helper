/*
*
* Clash Of Clans API
*
* Created by Richi. v1.0
*
*/
import axios from 'axios';

class COC {
    constructor(token) {
        this.token = token;
        this.api_url = "https://api.clashofclans.com/v1";
    }

    clans = {
        List: async (data=null) => { return await this.QueryConstructor(`/clans?${data}`, "GET") },
        Info: async (tag, data=null) => { return await this.QueryConstructor(`/clans/${tag}?${data}`, "GET") },
        Members: async (tag, data=null) => { return await this.QueryConstructor(`/clans/${tag}/members?${data}`, "GET") },
        CurrentWar: async (tag, data=null) => { return await this.QueryConstructor(`/clans/${tag}/currentwar?${data}`, "GET") },
        WarLog: async (tag, data=null) => { return await this.QueryConstructor(`/clans/${tag}/warlog?${data}`, "GET") },
        CWLCurrentWar: async (tag, data=null) => { return await this.QueryConstructor(`/clans/${tag}/currentwar/leaguegroup?${data}`, "GET") },
        CWLWarLog: async (tag, data=null) => { return await this.QueryConstructor(`/clanwarleagues/wars/${tag}?${data}`, "GET") }
    };

    players = {
        Info: async (tag) => { return await this.QueryConstructor(`/players/${tag}`, "GET") },
        VerifyToken:  async (tag, token) => { return await this.QueryConstructor(`/players/${tag}/verifytoken`, "POST", token) }
    };

    leagues = {
        List: async(data) => { return await this.QueryConstructor(`/leagues?${data}`, "GET") },
        ListWar: async(data) => { return await this.QueryConstructor(`/warleagues?${data}`, "GET") },
        Info: async(id) => { return await this.QueryConstructor(`/leagues/${id}`, "GET") },
        InfoWar: async(id) => { return await this.QueryConstructor(`/warleagues/${id}`, "GET") },
        Seasons: async(id, data) => { return await this.QueryConstructor(`/leagues/${id}/seasons?${data}`, "GET") },
        SeasonsRankings: async(id, season, data) => { return await this.QueryConstructor(`/leagues/${id}/seasons/${season}?${data}`, "GET") }
    };

    locations = {
        List: async() => { return await this.QueryConstructor(`/locations`, "GET") },
        Info: async(id) => { return await this.QueryConstructor(`/locations/${id}`, "GET") },
        RankingsClans: async(id, data=null) => { return await this.QueryConstructor(`/locations/${id}/rankings/clans?${data}`, "GET") },
        RankingsPlayers: async(id, data=null) => { return await this.QueryConstructor(`/locations/${id}/rankings/players?${data}`, "GET") },
        RankingsClansVersus: async(id, data=null) => { return await this.QueryConstructor(`/locations/${id}/rankings/clans-versus?${data}`, "GET") },
        RankingsPlayersVersus: async(id, data=null) => { return await this.QueryConstructor(`/locations/${id}/rankings/players-versus?${data}`, "GET") }
    };

    goldpass = {
        Current: async () => { return await this.QueryConstructor(`/goldpass/seasons/current`, "GET") }
    };

    labels = {
        Players: async (data) => { return await this.QueryConstructor(`/labels/players?${data}`, "GET") },
        Clans: async (data) => { return await this.QueryConstructor(`/labels/clans?${data}`, "GET") }
    };

    async QueryConstructor(url, method, data=null) {
        try {
            let result = await axios({
                method: method, 
                url: `${this.api_url}${url.replace('#', '%23')}`,
                data: data,
                headers: {
                    "Accept": `application/json`,
                    "authorization": `${this.token}`,
                }
            });
            return result;
        } catch(err) {
            console.log(err.response);
            return err.response; 
        }
    }
}

export { COC };
