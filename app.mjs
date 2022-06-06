import { Bot } from "grammy";
import { COC } from "./etc/coc/api.mjs";
import { Monitor } from "./etc/coc/monitoring.mjs"; 
import { Tokener } from "./etc/coc/token.mjs";
import express from "express";
const app = express();

const tokener = new Tokener(process.env.E_MAIL, process.env.PASSWORD, 'https://developer.clashofclans.com/api');
async function getAPIToken() {
  try {
    return await tokener.getToken();
  } catch(err) {
    console.log("Произошла ошибка. Возможно, неверно введены логин и пароль или через этот IP-адрес невозможно выполнить запрос.");
    process.exit(1);
  }};
const TOKEN = await getAPIToken();
const COC_Api = new COC( TOKEN );
const chats = ["-1001362045877", "-1001490392727"];
const clans = {
  "golden": { "tag": "#2290R8QUC" },
  "silver": { "tag": "#2YULYY0QQ" }
};

var Monitors = {};
for(const clan in clans) {
  Monitors[clan] = new Monitor( COC_Api, clans[clan].tag );
  Monitors[clan].start(process.env.MONITOR_RATE); 
}

const TG_Bot = new Bot(process.env.BOT_TOKEN); 

TG_Bot.command(['start', 'help'], async(ctx)=>{
  if(!(await checkUser(ctx.update.message.from.id))) { return; }
  await sendMessage(ctx.update.message.chat.id, 
      `Приветствую тебя, ${ctx.update.message.from.first_name}!\n` +
      `Мои команды: \n\n` +
      `/cwl - Посмотреть статус ЛВК.\n` +
      `/war - Посмотреть статус КВ.\n` +
      `/members - Посмотреть список игроков.\n` +
      `Код: <a href="https://github.com/Sn3ppi/helper-rose">ссылка</a>`                         
  )
});

TG_Bot.command(['cwl', 'war', 'members'], async(ctx)=>{
  //console.log(ctx);
  try {
    if(!(await checkUser(ctx.update.message.from.id))) { return; }
    const split = ctx.update.message.text.split(' ');
    var out, info, command = ctx.update.message.text.split(' ')[0].replace('/','');
    
    if(split.length > 1 && split.length < 4 && clans[split[1]]) {
      switch(command) {
        case "cwl":
          info = await Monitors[split[1]].getCWLInfo();
          break;
        case "war":
          info = await Monitors[split[1]].getWarInfo();
          break;
        case "members":
          info = await Monitors[split[1]].getClanPlayersInfo();
      }
      out = info.result;
      if(split[2] && split[2] == "debug") {
        ctx.reply(JSON.stringify(info.data));
      }
    } else {
      out = `Используйте: /${command} [клан].\n\nТекущие доступные кланы:\n`;
      for(const clan in clans) { out += `- ${clan} (<a href="https://link.clashofclans.com/ru?action=OpenClanProfile&tag=${clans[clan].tag.replace('#', '')}">${clans[clan].tag}</a>)\n`; }
    }
    return await sendMessage(ctx.update.message.chat.id, out);
  } catch (e) {
    //console.error(e);
  }
});

TG_Bot.start();
                                  
async function sendMessage(chat, text, reply_to = false, parse_mode="HTML", disable_web_page_preview="true") {
  try {
    if(text.length > 4096) {
      for (let i = 0; i < text.length; i += text.lastIndexOf('\n', i + 4096)) {await sendMessage(chat, text.slice(i, i + text.lastIndexOf('\n', i + 4096)), { parse_mode: parse_mode, disable_web_page_preview: disable_web_page_preview }); };
    } else {
      return await TG_Bot.api.sendMessage(chat, text, { 
        reply_to_message_id: ((!reply_to)?null:reply_to), 
        parse_mode: parse_mode,
        disable_web_page_preview: disable_web_page_preview
      });
    }
  } catch (error) {
      console.log(`[ E R R O R ] Внимание! Не удалось отправить сообщение для ${chat}.`);
      console.log(text);
      if(error.error_code == 429) {
        console.log(`[ E R R O R ] Блокировка отправки сообщений на ${error.parameters.retry_after} с.`);
        setTimeout(
          async()=>{ await sendMessage(chat, text, reply_to, parse_mode, disable_web_page_preview); }, 
          error.parameters.retry_after*1000
        );
      } else {
        await sendMessage(chat, `[ ERROR ] Не смог отправить сообщение... [${error}]`);
      }
  }
}

async function checkUser(id) {
  for(const chat in chats) {
    try {
      await TG_Bot.api.getChatMember(chats[chat], id);
      return true;
    } catch (e) {}
  }
  return false;
}

app.get("/", function (req, res) {
  res.send(`Clash of Clans parser bot by Sneppi and 0xRichi`);
 });

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
    console.log(`Server is running at port ${PORT}`);
});