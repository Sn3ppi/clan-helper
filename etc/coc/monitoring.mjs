String.prototype.padding = function(n, c)
{
    var val = this.valueOf();
    if ( Math.abs(n) <= val.length ) { return val; }
    var m = Math.max((Math.abs(n) - this.length) || 0, 0);
    var pad = Array(m + 1).join(String(c || ' ').charAt(0));
    return (n < 0) ? pad + val : val + pad;
};

class Monitor {
    constructor(api_handler, tag) {
        this.api = api_handler;
        this.clan_tag = tag;
    }

    start(rate) {}
  async getClanPlayersInfo() {
    const data = (await this.api.clans.Members(this.clan_tag)).data;
    var result = "";
    if(data.reason) {
        switch(data["reason"]) {
            default:
                result = `Произошла ошибка, код PLAYER-1: (${data["reason"]})`;
                break;
        }
    } else if(data.items) {
        result += `👥 Список игроков:\n`;
        for (const ind in data["items"]) {
            result += `${Number(ind)+1}. ${await this.fixText(data["items"][ind].name)} (<a href="https://link.clashofclans.com/ru?action=OpenPlayerProfile&tag=${data["items"][ind]["tag"].replace('#', '')}">${data["items"][ind]["tag"]}</a>)\n`;
        }
    return {"result": result, "data": data};
        }
    }   
    // 
    async getWarInfo() {
        const data = (await this.api.clans.CurrentWar(this.clan_tag)).data;
        var result = "";
        if(data.reason) {
            switch(data["reason"]) {
                case "notFound":
                    result = `Клан не проводит КВ в данный момент.`;
                    break;
                case "accessDenied":
                    result = `Просмотр хода войны запрещён!\nРазрешите его в настройках клана.`;
                    break;
                default:
                    result = `Произошла ошибка, код: WAR-2. (${data["reason"]})`;
                    break;
            }
        } else if(data.state) {
            var out = "", 
                clan_types = ["clan", "opponent"];
            switch(data.state) {
                case "notInWar":
                    result += "  В данный момент происходит поиск войны.";
                    break;
                case "preparation":
                    out +=  `🕑 В данный момент происходит подготовка к войне\n` +
                            `📝 Краткая информация:\n\n` +
                            `⚔️ Кол-во атак на человека: ${data.attacksPerMember}.\n\n` +
                            `Выступающие кланы:\n`;
                    for(const type in clan_types) {
                        let th_list = {}, 
                            members = data[clan_types[type]].members.sort(function(a, b){  return a.townhallLevel+b.townhallLevel});
                        out += `🏯 ${await this.fixText(data[clan_types[type]].name)} [${data[clan_types[type]].clanLevel} LVL]\n`;
                        for(const member in members) {
                            if(!th_list[members[member].townhallLevel]) { 
                                th_list[members[member].townhallLevel] = 0;
                            }
                            th_list[members[member].townhallLevel] += 1;
                        }
                        for(const th in th_list) {
                            out += `- ${th} ТХ: ${th_list[th]} шт.\n`;
                        }
                        out += "\n";
                    }
                    result = out;
                    break;
                case "inWar":
                    for(const type in clan_types) {
                        let members = data[clan_types[type]].members.sort(function(a, b){  return a.mapPosition-b.mapPosition});
                        out += `🏰 Клан: ${await this.fixText(data[clan_types[type]].name)}\n` +
                               `⚔️ ${data[clan_types[type]].attacks}/${data.teamSize*data.attacksPerMember} | 🌟 ${data[clan_types[type]].stars}/${data.teamSize * 3}\n` +
                               `💥 Разрушения: ${data[clan_types[type]].destructionPercentage.toFixed(2).toString().replace('.', "\.")}%\n` +
                               `🗺 Карта:\n`;
                        for(let i=0; i < members.length; i++) {
                            let nickname = await this.fixText(members[i].name),
                                TH = members[i].townhallLevel,
                                attack_status = (members[i].attacks)?((members[i].attacks.length == data.attacksPerMember)?'[✅]':`[${members[i].attacks.length}/${data.attacksPerMember}]`):'[❌]';
                            out += `<code>${((i != members.length - 1)?'├':'└')} ${nickname}`.padding(24) + `[${TH<10?' ':''}${TH} TH] ${attack_status}</code>\n`;
                        }
                        out += "\n";
                    }
                    result = out;
                    break;
                case "warEnded":
                    var not_attack_members = [];
                    result =   `Война кланов закончилась!\n` +
                               `Итоги войны:\n\n`;
                    for(const type in clan_types) {
                        if(data[clan_types[type]].tag == this.clan_tag) {
                            for(const member in data[clan_types[type]].members) {
                                if(!data[clan_types[type]].members[member].attacks) {
                                    not_attack_members.push({ 
                                        name: data[clan_types[type]].members[member].name,
                                        tag: data[clan_types[type]].members[member].tag
                                    });
                                }
                            }
                        }
                        result += `🏯 Клан: ${await this.fixRTL(data[clan_types[type]].name)}\n` +
                                `⚔️ ${data[clan_types[type]].attacks}/${data.teamSize*data.attacksPerMember} | 🌟 ${data[clan_types[type]].stars}/${data.teamSize * 3}\n` +
                                `💥 Разрушения: ${data[clan_types[type]].destructionPercentage.toFixed(2).toString().replace('.', "\.")}%\n\n`;
                    }
                    if(not_attack_members.length > 0) {
                        result += "- - - - - - - - - - -\nВнимание! Следующие игроки не атаковали:\n";
                        for(const member in not_attack_members) {
                            result += `- <code>${not_attack_members[member].name} [${not_attack_members[member].tag}]</code>\n`;
                        }
                    }
                    break;
                default:
                    result = `Произошла ошибка, код: WAR-1. (State: ${data.state})`;
                    break;
            }
        } else {
            result = `Произошла ошибка, код: WAR-0.`;
        }
        return {"result": result, "data": data};
    }

    async getCWLInfo() {
        const data = (await this.api.clans.CWLCurrentWar(this.clan_tag)).data;
        var result;
        if(data.reason) {
            switch(data["reason"]) {
                case "notFound":
                    result = `Клан не проводит ЛВК в данный момент.`;
                    break;
                default:
                    result = `Произошла ошибка, код: CWL-2.`;
                    break;
            }
        } else if(data.state) {
            switch(data.state) {
                case "inWar":
                    var out = "", round_data = ["clan", "opponent"], round, war_data;
		    for(let i=data.rounds.length - 1; i >= 0; i--) {
			if(data.rounds[i].warTags[0] != "#0") {
			    round = i;
			    break;
			}
		    }
                    for(let i=0; i < data.rounds[ round ].warTags.length; i++){
                        war_data = (await this.api.clans.CWLWarLog(data.rounds[ round ].warTags[i])).data;
                        if(war_data.clan.tag == this.clan_tag || war_data.opponent.tag == this.clan_tag) { break; }
                    }
                    for(const clan in round_data) {
                        let members = war_data[round_data[clan]].members.sort(function(a, b){  return a.mapPosition-b.mapPosition});
                        out += `🏰 Клан: ${await this.fixText(war_data[round_data[clan]].name)}\n` +
                               `⚔️ ${war_data[round_data[clan]].attacks}/${war_data.teamSize} | 🌟 ${war_data[round_data[clan]].stars}/${war_data.teamSize * 3}\n` +
                               `💥 Разрушения: ${war_data[round_data[clan]].destructionPercentage.toFixed(2).toString().replace('.', "\.")}%\n` +
                               `🗺 Карта:\n`;
                        for(let i=0; i < members.length; i++) {
                            let nickname = await this.fixText(members[i].name),
                                TH = members[i].townhallLevel,
                                attack_status = (members[i].attacks)?'[✅]':'[❌]';
                            out += `<code>${((i != members.length - 1)?'├':'└')} ${nickname}`.padding(24) + `[${TH<10?' ':''}${TH} TH] ${attack_status}</code>\n`;
                        }
                        out += "\n";
                    }
                    result = out;
                    break;
                case "ended":
                    result = `Лига Войн Кланов закончилась.`;
                    break;
                default:
                    result = `Произошла ошибка, код: CWL-1. (State: ${data.state})`;
                    break;
            }
        } else {
            return result = `Произошла ошибка, код: CWL-0.`;
        }
        return {"result": result, "data": data};
    }

    async fixText(s) {
        var rtlChars = '\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC', text;
        
        text = new RegExp('^[^'+rtlChars+']*?['+rtlChars+']').test(s) ? '[ RTL TEXT ]':s; 
        text = text.replace(/[<>]/g, function (m) { return `\\${m}`; });
        return text;
    }
}

export { Monitor };
