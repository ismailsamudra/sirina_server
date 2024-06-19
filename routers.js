const express = require('express');
const router = express.Router();
const {queryApi} = require('./controllers/query');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
var path = require("path");
const fs = require('fs');
console.log("host : http://103.151.20.176/");
router.post('/api/:act/:id?' ,jsonParser, queryApi);

router.get('/:page?' , function(req,res){
    let params = (req.params.page)?req.params.page:'index';
    let root = './view/'+params+'.html'
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'view/'+params+'.html'));
    }else{
        res.sendFile(path.join(__dirname,'view/404.html'));
    }
});
router.get('/img/:name?' , function(req,res){
   let root = './file/'+req.params.name
   if (fs.existsSync(root)){
       res.sendFile(path.join(__dirname,'file/'+req.params.name));
   }else{
       res.sendFile(path.join(__dirname,'file/404.html'));
   }
});

module.exports = router;
