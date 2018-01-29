const Discord = require("discord.js");
const client = new Discord.Client();
var CryptoJS = require("crypto-js");
var http = require('http');
var cron = require('node-cron');
var config = require('./config.json')

client.on('ready', () => {
  console.log(`Ready to serve, ${client.user.tag}`);
});

  //runs everyday
  cron.schedule('15 8 * * *', function(){
    getTodayEvents();
  });

function getTodayEvents(){

  var mushkey = config.mushkey;
  var channelID = config.channelID;

  var start = new Date();
  start.setHours(0,0,0,0);

  var end = new Date();
  end.setHours(23,59,59,999);

  var start = Date.parse(start)/1000;
  var end = Date.parse(end)/1000;

  var param = "/events/index/start:" +start+"/end:"+end;

  var hmac = CryptoJS.HmacSHA1(param,mushkey);
  var params = param + "/key:"+ hmac; // add the secret key to the request

  var url = config.url + "/api" + params + ".json";
  console.log(url);

  http.get(url, res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      body = JSON.parse(body);

      var channel = client.channels.get(channelID);

      if(body.events.length == 0){
        channel.send(":robot: No events found for today.");
        return false;
      };

      var fields = [];

      var t = {"name": "Trial:","value" : body.events[0].Dungeon.title};
      fields.push(t);

      //invite format
      var d = new Date(body.events[0].Event.time_invitation);
      var smin = (d.getUTCMinutes() == 0 ) ? "00" : d.getUTCMinutes();
      var s = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getUTCFullYear() + " - " + d.getUTCHours() + ":" + smin;

      var t = {"name": "Invitation:","value" : "[UTC] " + s };
      fields.push(t);

      //starttime format
      var d = new Date(body.events[0].Event.time_start);
      var smin = (d.getUTCMinutes() == 0 ) ? "00" : d.getUTCMinutes();
      var s = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getUTCFullYear() + " - " + d.getUTCHours() + ":" + smin;
      var t = {"name": "Start:","value" : "[UTC] " + s };
      fields.push(t);

      var embed = {
        "description" : "",
        "title" : body.events[0].Event.title,
        "thumbnail" : {"url": config.url +body.events[0].Game.logo},
        "fields" : fields,
        "color" : 12745742
      };

      channel.send({"embed" : embed });

    });
  });

}

client.on('message', msg => {
  if (msg.content === '!f') {
    getTodayEvents();
  };
  if (msg.content === '!time') {
    var t = new Date();
    var smin = (t.getUTCMinutes() == 0 ) ? "00" : t.getUTCMinutes();
    msg.reply("current UTC time is " + t.getUTCHours() + ":" + smin + ".");
  }
});

client.login(config.discord);
