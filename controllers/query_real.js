const { Client , LocalAuth , MessageMedia } = require('whatsapp-web.js');
const qrCmd = require('qrcode-terminal')
const DB = require('./JsonCrudDB');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const tgl = require('date-and-time');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const schema = {id: { type: "string", required: true }};
let s = process.env.SECRET;
let m = process.env.KEY_EXPIRE;
let consUrl = process.env.CONS_URL;
let consId = process.env.CONS_ID;
let consSecret = process.env.CONS_SECRET;
let modulId = process.env.CONS_MODUL_ID;
let status = "NOT READY";
let qrcode = null;
console.log(moment("2024-07-31","YYYY-MM-DD").format("DD-MM-YYYY"));
const client = new Client({
    webVersionCache: {
    type: "remote",
    remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true,
    puppeteer: { 
        headless: true,
        args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu'
        ]
    }
});
client.initialize();
//--------------------------------------------- START
client.once('ready', () => {
    status = "READY";
    console.log('Client is ready!');
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('qr', (qr) => {
    qrcode = qr;
    // console.log('QRCODE ON : ');
    // qrCmd.generate(qr, {small: true});
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('authenticated', () => {
console.log('WhatsApp Web On : AUTHENTICATED');
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('auth_failure', msg => {
console.error('AUTHENTICATION FAILURE', msg);
client.initialize();
status = "NOT READY";
console.log('WhatsApp Web On : '+status);
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('change_state', state => {
console.log('WhatsApp Web On : CHANGE STATE', state );
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('disconnected', (reason) => {
console.log('Client was logged out', reason);
client.initialize();
console.log('WhatsApp Web On : '+status);
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('message', message  => {
    let msg = message.body;
    // axios
    // .post(consUrl+'api/reply_'+modulId, {msg},{
    //     headers:{
    //       "X-Token": btoa(consId)
    //     }
    // }).then( res => {
    //     if(res.data.msg!=''){
    //       if(res.data.file=='' || res.data.file==null){
    //         if(res.data.msg!=null){
    //           message.reply(res.data.msg);
    //         }
    //       }else{
    //         let caption = res.data.msg;
    //         let base64 = res.data.file;
    //         let mimetype = res.data.mime;
    //           const media = new MessageMedia(mimetype, base64, 'Media');
    //           client.sendMessage(message.from, media, {
    //             caption: caption
    //           });
    //       }
    //     }
    // });
  });
//--------------------------------------------- END
//--------------------------------------------- START
setInterval(async () => {
    const db = new DB("./db/cronjobs.json");
    const te = new DB("./db/tempjobs.json");
    var r30 = await db.find({ON:'ENABLE',job:date('YYYYMMDDHHmm'),'temp':'temp30'},false);
    if(r30.length>0){
        var i30 = 0;
        while(i30<r30.length){
            let response ='';
            try {
                if(r30[i30].url){
                    var e = await axios.get(r30[i30].url);
                    response = (e.status)?'('+e.status+') : '+e.statusText:'(500) BadRequest';
                }
                var t30 = await te.findOne({id:'temp30'});
                if(t30){
                    var text = t30.text;
                    text = text.replaceAll("#NAMA#",r30[i30].nama);
                    text = text.replaceAll("#TGL#",moment(r30[i30].date,"YYYY-MM-DD").format("DD-MM-YYYY"));
                    var dt = moment(r30[i30].date).subtract(15, "days").format("YYYY-MM-DD");
                    var job =date('YYYYMMDDHHmm',dt+' '+r30[i30].time);
                    var x = await db.update({id:r30[i30].id,'temp':'temp30'},{'temp':'temp15',job,"status":"WAITING",response});
                    if(x>0){
                        if(status == "READY"){
                            if(t30.base64){
                                var res = await send_base64(r30[i30].hp,text,t30.base64,t30.mime);
                            }else{
                                var res = await send(r30[i30].hp,text);
                            }
                            console.log(res);
                        }
                    }
                }
            } catch (error) {}
            i30++;
        }
    }
    var r15 = await db.find({ON:'ENABLE',job:date('YYYYMMDDHHmm'),'temp':'temp15'},false);
    if(r15.length>0){
        var i15 = 0;
        while(i15<r15.length){
            let response ='';
            try {
                if(r15[i15].url){
                    var e = await axios.get(r15[i15].url);
                    response = (e.status)?'('+e.status+') : '+e.statusText:'(500) BadRequest';
                }
                var t15 = await te.findOne({id:'temp15'});
                if(t15){
                    var text = t15.text;
                    text = text.replaceAll("#NAMA#",r15[i15].nama);
                    text = text.replaceAll("#TGL#",moment(r15[i15].date,"YYYY-MM-DD").format("DD-MM-YYYY"));
                    var job =date('YYYYMMDDHHmm',r15[i15].date+' '+r15[i15].time);
                    var x = await db.update({id:r15[i15].id,'temp':'temp15'},{'temp':'temp00',job,"status":"WAITING",response});
                    if(x>0){
                        if(status == "READY"){
                            if(t15.base64){
                                var res = await send_base64(r15[i15].hp,text,t15.base64,t15.mime);
                            }else{
                                var res = await send(r15[i15].hp,text);
                            }
                            console.log(res);
                        }
                    }
                }   
            } catch (error) {}
            i15++;
        }
    }
    var r00 = await db.find({ON:'ENABLE',job:date('YYYYMMDDHHmm'),'temp':'temp00'},false);
    if(r00.length>0){
        var i00 = 0;
        while(i00<r00.length){
            let response ='';
            try {
                if(r00[i00].url){
                    var e = await axios.get(r00[i00].url);
                    response = (e.status)?'('+e.status+') : '+e.statusText:'(500) BadRequest';
                }
                var t00 = await te.findOne({id:'temp00'});
                if(t00){
                    var text = t00.text;
                    text = text.replaceAll("#NAMA#",r00[i00].nama);
                    text = text.replaceAll("#TGL#",moment(r00[i00].date,"YYYY-MM-DD").format("DD-MM-YYYY"));
                    var x = await db.update({id:r00[i00].id,'temp':'temp00'},{'temp':'temp',"status":"TIMEOUT",response});
                    if(x>0){
                        if(status == "READY"){
                            if(t00.base64){
                                var res = await send_base64(r00[i00].hp,text,t00.base64,t00.mime);
                            }else{
                                var res = await send(r00[i00].hp,text);
                            }
                            console.log(res);
                        }
                    }
                }
            } catch (error) {}
            i00++;
        }
    }
}, 1000);
//--------------------------------------------- END
const queryApi = async (req,res)=>{
    var act = req.params.act;
    if(cekReq(req)==false){return res.status(204).json("");}
    if(consVerify(req.header('X-Signature'),res)==false){return;}
    var fungsi = req.params.id;let iLog = {index:1};
    iLog.id=md5();
    const lo = new DB("./db/log.json");
    if(act=='cronjobs'){
        const db = new DB("./db/cronjobs.json");
        const co = new DB("./db/config.json");
        const te = new DB("./db/tempjobs.json");
        if(fungsi=='find'){
            const results = await db.find(req.body,false);
            let data ={total:results.length,rows:results}
            res.status(200).json(data)
        }else if(fungsi=='findOne'){
            const results = await db.findOne(req.body);
            res.status(200).json(results)
        }else if(fungsi=='upconfig'){
            if(req.body.time){
                const r = await co.update({id:"time_tempjobs"},{val:req.body.time});
                if(r>0){
                    var dt = await db.find({index:1},false);var i = 0;
                    if(dt){
                        while(i<dt.length){
                            var d = kalkulasi(dt[i].date,req.body.time)
                            let job = d.job ;
                            let status = d.status;
                            let temp = d.template;
                            let time = req.body.time;
                              await db.update({id:dt[i].id},{time,job,status,temp});
                            i++;
                        }
                    }
                }
            }else if(req.body.replace){
                await co.update({id:"replace_tempjobs"},{val:req.body.replace});
            }else{
                return res.status(412).json({msg : getRes(412)});
            }
            return res.status(200).json({msg:"Update Success"});
        }else if(fungsi=='uptemplate'){
            if(req.body.id){
                await te.update({id:req.body.id},req.body);
            }else{
                return res.status(412).json({msg : getRes(412)});
            }
            return res.status(200).json({msg:"Update Success"});
        }else if(fungsi=='crud'){
            var time_tempjobs = await co.findOne({id:'time_tempjobs'});
            if(time_tempjobs){
                let msg;
                req.body.index=1;
                req.body.createdAt=date("DD-MM-YYYY HH:mm");
                req.body.ON=(req.body.ON)?req.body.ON:'ENABLE';
                req.body.date=(date('YYYY-MM-DD',req.body.date))?date('YYYY-MM-DD',req.body.date):date("YYYY-MM-DD");
                req.body.time=(time_tempjobs.val)?time_tempjobs.val:"00:00";
                let dt = kalkulasi(req.body.date,req.body.time);
                req.body.job=dt.job;
                req.body.status=dt.status;
                req.body.temp=dt.template;
                req.body.response='';
                if(!req.body.delete){
                    if(!req.body.nama || !req.body.hp){
                    return res.status(412).json({
                            code : 412,
                            msg : getRes(412)
                            });
                    }
                }
                if(req.body.insert==true){
                    try { 
                        req.body.id=(req.body.id)?req.body.id:md5();
                        var num = await db.find({id:req.body.id},false);
                        if(num.length>0){
                        return res.status(412).json({
                                code : 412,
                                msg : getRes(412)
                            });
                        }
                        await db.insert(req.body);
                        msg = 'insert success.';
                    } catch (e) {return res.status(200).json('Insert Failed');}
                }else if(req.body.delete==true){
                    try {                    
                        await db.remove({id:req.body.id});
                        msg = 'delete success.';
                    } catch (e) {return res.status(200).json('Delete Failed');}
                }else{
                    var id = req.body.id;
                    req.body.updatedAt=date("DD-MM-YYYY HH:mm");
                    await db.update({id},req.body);
                    msg = 'Update success.';
                }
                iLog.time=date("DD-MM-YYYY HH:mm");
                iLog.msg=msg;
                iLog.text=req.body.nama+" | "+req.body.hp;
                await lo.insert(iLog);
                return res.status(200).json({
                    code : 200,
                    msg,
                    id : req.body.id
                });
            }else{
                return res.status(412).json({
                    code : 412,
                    msg : getRes(412)
                   });
            }
        }else if(fungsi=='backupdb_base64'){
            const contents = fs.readFileSync("./db/cronjobs.json", {encoding: 'base64'});
            iLog.id=md5();
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg="Backup Success.";
            iLog.text="data : cronjobs.json";
            await lo.insert(iLog);
            return res.status(200).json({
                 code : 200,
                 msg : 'data:application/json;base64,'+contents
             });
        }else if(fungsi=='import'){
            var time_tempjobs = await co.findOne({id:'time_tempjobs'});
            try { 
                if(time_tempjobs){
                    req.body.index=1;
                    req.body.id=(req.body.id)?req.body.id:md5();
                    req.body.createdAt=date("DD-MM-YYYY HH:mm");
                    req.body.ON=(req.body.ON)?req.body.ON:'ENABLE';
                    req.body.date=(date('YYYY-MM-DD',req.body.date))?date('YYYY-MM-DD',req.body.date):date("YYYY-MM-DD");
                    req.body.time=(time_tempjobs.val)?time_tempjobs.val:"00:00";
                    let dt = kalkulasi(req.body.date,req.body.time);
                    req.body.job=dt.job;
                    req.body.status=dt.status;
                    req.body.temp=dt.template;
                    req.body.response='';
                    await db.insert(req.body);
                    iLog.id=md5(req.body.id);
                    iLog.time=date("DD-MM-YYYY HH:mm");
                    iLog.msg='Import success.';
                    iLog.text=req.body.nama+" | "+req.body.hp;
                    await lo.insert(iLog);
                    return res.status(200).json({
                        code : 200,
                        msg:'Import success.',
                        id:req.body.id
                    });
                }else{
                    iLog.id=md5(req.body.id);
                    iLog.time=date("DD-MM-YYYY HH:mm");
                    iLog.msg='import Failed';
                    iLog.text=req.body.nama+" | "+req.body.hp;
                    await lo.insert(iLog);
                    return res.status(200).json('import Failed');
                }
            } catch (e) {
                iLog.id=md5(req.body.id);
                iLog.time=date("DD-MM-YYYY HH:mm");
                iLog.msg='import Failed';
                iLog.text=req.body.nama+" | "+req.body.hp;
                await lo.insert(iLog);
                return res.status(200).json('import Failed');
            }
        }else if(fungsi=='truncate'){
            const r = await db.remove({'index':1});
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg="Truncate Success.";
            iLog.text="Count data : "+r;
            await lo.insert(iLog);
            return res.status(200).json('truncate data : '+r);
        }else{
            return res.status(200).json('Not Function');
        }
    }else if(act=='log'){
        if(fungsi=='find'){
            const results = await lo.find({index:1},false);
            let data ={total:results.length,rows:results}
           return res.status(200).json(data)
        }else if(fungsi=='delete'){
            try {                    
                await lo.remove({id:req.body.id});
                return res.status(200).json('Delete success');
            } catch (e) {return res.status(200).json('Delete Failed');}
        }else if(fungsi=='truncate'){
            const r = await lo.remove({'index':1});
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg="Truncate log Success.";
            iLog.text="Count data : "+r;
            await lo.insert(iLog);
            return res.status(200).json('truncate data : '+r);
        }else if(fungsi=='backupdb_base64'){
            const contents = fs.readFileSync("./db/log.json", {encoding: 'base64'});
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg="Download Log Success.";
            iLog.text="data : log.json";
            await lo.insert(iLog);
            return res.status(200).json({
                 code : 200,
                 msg : 'data:application/json;base64,'+contents
             });
        }else{
            return res.status(200).json('Not Function');
        }
    }else if(act=='wabot'){
        if(fungsi=='qr'){
            res.status(200).json({
                code: 200,
                msg: "OK",
                qr: qrcode
            });
        }else if(fungsi=='status'){
            let name ='';
            let number ='';
            if(status=="READY"){
                inc = (client.info)?client.info:false;
                if(inc){
                    nomor = inc.wid.user;
                    name = inc.pushname;
                    number = nomor.replace('62','0')
                }else{
                    name = 'Private';
                    number = 'Hidden';
                }
            }
            res.status(200).json({
                code: 200,
                msg: status,
                name,
                number
            });
        }else if(fungsi=='logout'){
            if(status=='READY'){
                status="NOT READY";
                await client.logout().then(()=>{
                  client.initialize();
                });
                console.log('WhatsApp Web On : LOGOUT');
                iLog.time=date("DD-MM-YYYY HH:mm");
                iLog.msg="Berhasil Keluar";
                iLog.text=status;
                await lo.insert(iLog);
                return res.status(200).json({
                code: 200,
                msg:"Berhasil Keluar"
                });
            }else{
                res.status(200).json({
                    code: 200,
                    msg: status
                });
            }
        }else if(fungsi=='cek_nomor'){
            var number = req.body.number;
            let msg = 'SERVER NOT READY';
            if(number){
                if(status=="READY"){
                    const hp = filterNo(number);
                    const isRegisteredNumber = await client.isRegisteredUser(hp);
                    if(!isRegisteredNumber){
                    msg = 'NO.HP BELUM TERDAFTAR WhatsApp';
                    } else{
                    msg = "OK"
                    }
                }
            }else{
                msg = 'PRECONDITION_FAILED';
            }
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg=msg;
            iLog.text=number;
            await lo.insert(iLog)
            return res.status(200).json({
            code: 200,
            msg
            });
        }else if(fungsi=='send'){
            let msg = 'SEND_FAILED';
            if(status=="READY"){
                if(req.body.number && req.body.message){
                    msg = await send(req.body.number,req.body.message);
                }else{
                    msg = 'PRECONDITION_FAILED';
                }
            }
            iLog.id=md5();
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg=msg;
            iLog.text=JSON.stringify(req.body.number);
            await lo.insert(iLog);
           return res.status(200).json({
             code: 200,
            msg
            });
        }else if(fungsi=='send_base64'){
            let msg = 'SEND_FAILED';
            if(status=="READY"){
                if(req.body.number && req.body.caption && req.body.base64 && req.body.mime){
                  msg = await send_base64(req.body.number,req.body.caption,req.body.base64,req.body.mime);
                }else{
                    msg = 'PRECONDITION_FAILED';
                }   
            }
            iLog.id=md5();
            iLog.time=date("DD-MM-YYYY HH:mm");
            iLog.msg=msg;
            iLog.text=JSON.stringify(req.body.number);
            await lo.insert(iLog);
           return res.status(200).json({
            code: 200,
            msg
            });
        }else{
            return res.status(200).json('Not Function');
        }
    }else{
        return res.status(204).json('Not Function');
    }
}
//============================================= STAR
async function send(num,text){
    const number = filterNo(num);
    const message = text;
    const isRegisteredNumber = await client.isRegisteredUser(number);
    if(isRegisteredNumber){
     //==== KIRIM PESAN
       client.sendMessage(number, message)
       return 'SEND_SUCCESS';
    }else{
       return 'NO.HP BELUM TERDAFTAR WhatsApp';
    }
}
//============================================= END
//============================================= STAR
async function send_base64(n,caption,base64,mime){
    const number = filterNo(n);
    //==== CEK NO WA
    const isRegisteredNumber = await client.isRegisteredUser(number);
    if(isRegisteredNumber){
        //==== KIRIM PESAN
        const media = new MessageMedia(mime, base64, 'Media');
        client.sendMessage(number, media, {caption: caption})
        return 'SEND_SUCCESS';
    }else{
        return 'NO.HP BELUM TERDAFTAR WhatsApp';
    }
}
//============================================= END
function cekReq(req){
    // console.log(req.get('host'));
    switch (req.get('host')) {
        case 'localhost:4000': return req.get('host');break;
        case '127.0.0.1:4000': return req.get('host');break;
        case '103.151.20.176': return req.get('host');break;
        default:return false;
      }
}
//============================================= STAR
function consVerify(token,res){
    let code;
    try {      
        var rand = jwt.verify(token, consSecret);
        if(rand.cons_id==consId){
            var tm = new Date();
            if(tgl.format(tm,'YYYYMMDDHHmmss')<=rand.tstamp){code = null;}else{code = 408;}
        }else{code = 501;}
    } catch (e) {code = 503;}
    if(code){
        res.status(code).json({
        code: code,
        msg: getRes(code),
        });
        return false;
    }else{
        return true;
    }
}
//============================================= END
function kalkulasi(dt,tm){
    let data={};
    var job=date('YYYYMMDDHHmm',dt+' '+tm);
    var date15 = moment(dt).subtract(15, "days").format("YYYY-MM-DD");
    var job15 = date('YYYYMMDDHHmm',date15+' '+tm);
    var date30 = moment(dt).subtract(30, "days").format("YYYY-MM-DD");
    var job30 = date('YYYYMMDDHHmm',date30+' '+tm);
    var now = date('YYYYMMDDHHmm');
    if(now<=job30){
       data.job = job30;
       data.status = 'WAITING';
       data.template='temp30';
    }else if(now>job30 && now<=job15){
        data.job = job15;
        data.status = 'WAITING';
        data.template='temp15';
    }else if(now>job15 && now<=job){
        data.job = job;
        data.status = 'WAITING';
        data.template='temp00';
    }else{
        data.job = job;
        data.status = 'TIMEOUT';
        data.template='temp';
    }
    return data;
}
function deCode(code,sec){
    return (sec)?jwt.verify(code, sec):jwt.verify(code, s);
}
function enCode(code,sec){
    return (sec)?jwt.sign(code, sec):jwt.sign(code, s);
}
function date(dt,val){
    return moment(val).format(dt);
}
const time = function(dt,val){
    return moment(val).unix(dt);
}
const filterNo = function(number) {
let formatted = number.replace(/\D/g, '');
if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substr(1);
    }
    if (!formatted.endsWith('@c.us')) {
        formatted += '@c.us';
    }
        return formatted;
}
const getRes = function(code){
    switch (code) {
      case 200: return "OK";break;
      case 500: return "INTERNAL_SERVER_ERROR";break;
      case 501: return "CONSUMER_ID_SALAH";break;
      case 503: return "INVALID_SIGNATURE";break;
      case 401: return "UNAUTHORIZED";break;
      case 408: return "REQUEST_TIMEOUT";break;
      case 424: return "FAILED_DEPENDENCY";break;
      case 412: return "PRECONDITION_FAILED";break;
      case 204: return "NO_CONTENT";break;
      default:return false;
    }
}
function md5(code){
return (code)?crypto.createHash('md5').update(code.toString()).digest("hex"):crypto.createHash('md5').update(time().toString()).digest("hex");
}
function uuid(){
return uuidv4();
}
function bearer(token){
var bearer = token.split(' ');
    return bearer[1];
}
function makeId(f,length) {
    let result = '';
    const characters = xCha(f);
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
function xCha(code){
    switch (code) {
      case 'number': return "0123456789";break;
      case 'A__': return "ABCDEFGHIJKLMNOPQRSTUVWXYZ";break;
      case 'a__': return "abcdefghijklmnopqrstuvwxyz";break;
      case 'An_': return "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";break;
      case 'an_': return "abcdefghijklmnopqrstuvwxyz0123456789";break;
      case 'Aa_': return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";break;
      case 'Aan': return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";break;
      default:return '0123456789';
    }
}
module.exports = {queryApi};