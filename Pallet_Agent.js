/**
 * Created by halder on 09-Apr-17.
 */
var Pallet_Agent = function Pallet_Agent(palletID, orderID, frameType, frameColor, screenType, screenColor, keyType, keyColor, status, port) {
    this.palletID_ = palletID;
    this.orderID_ = orderID;
    this.frameType_ = frameType;
    this.frameColor_ = frameColor;
    this.screenType_ = screenType;
    this.screenColor_ = screenColor;
    this.keyType_ = keyType;
    this.keyColor_ = keyColor;
    this.status_ = status;
    this.path_ = [];
    this.port_ = port;
    this.hostname_ = "localhost";
};

Pallet_Agent.prototype.getPort = function () {
    return this.port_;
};
Pallet_Agent.prototype.getFrameColor = function () {
    return this.frameColor_;
};

Pallet_Agent.prototype.getScreenColor = function () {
    return this.screenColor_;
};

Pallet_Agent.prototype.getKeyColor = function () {
    return this.keyColor_;
};

Pallet_Agent.prototype.setPath = function (path) {
    this.path_ = path;
};
/*
 Pallet_Agent.prototype.setStatus = function (status) {
 this.status_ = status;
 };*/

Pallet_Agent.prototype.runServer = function () {
    var express = require('express');
    var bodyParser = require('body-parser');
    var request = require('request');

    var port = this.port_;
    var hostname = this.hostname_;
    var palletID = this.palletID_;
    var orderID = this.orderID_;

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var currentPallet = {   'palletID_':this.palletID_,
        'orderID_':this.orderID_,
        'frameType_':this.frameType_,
        'frameColor_':this.frameColor_,
        'screenType_':this.screenType_,
        'screenColor_':this.screenColor_,
        'keyType_':this.keyType_,
        'keyColor_':this.keyColor_,
        'status_': this.status_,
        'path_':this.path_,
        'port_':this.port_,
        'hostname_':this.hostname_   };

    function simRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify({destUrl:'http://hostname'}),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    function palletRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(currentPallet),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }

    app.post('/'+palletID+'notifs', function (req, res) {
        //console.log('/'+palletID+'notifs');
        var event = req.body.id;
        var sender = req.body.senderID;
        var WS_ID = "WS"+sender.substr(6,2);
        var WSTempNum = parseInt(sender.substr(6,2));
        //console.log(palletID);
        if(WSTempNum<10){
            var WS_Num = '0'+WSTempNum;
        }
        else{
            WS_Num = WSTempNum;
        }
        /*if(WSTempNum==12){
         var WSNeighborNum = 1;
         }
         else{
         WSNeighborNum = WSTempNum+1;
         }*/

        switch (event){
            case "Z1_Changed": {
                request({
                    url: 'http://localhost:3000/RTU/'+sender+'/data/P3',
                    method: "GET",
                },function (err, res, body) {
                    //console.log(WS_ID, '*****Status*****', parseInt(body.substr(5,6)));
                    if(parseInt(body.substr(5,6))==0){
                        request({
                            url: 'http://localhost:3000/RTU/'+sender+'/data/P4',
                            method: "GET",
                        },function (err, res, body) {
                            //console.log(WS_ID, '*****Status*****', parseInt(body.substr(5,6)));
                            if(parseInt(body.substr(5,6))==0) {
                                if ((req.body.payload.PalletID != -1) && (req.body.payload.PalletID == palletID)) {
                                    if ((WS_ID != 'WS1') || (WS_ID != 'WS7')) {
                                        setTimeout(function () {
                                            var url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'pallet';
                                            palletRequest(url);
                                        }, 10);
                                    }
                                }
                            }
                            else{
                                if ((req.body.payload.PalletID != -1) && (req.body.payload.PalletID == palletID)) {
                                    if ((WS_ID != 'WS1') || (WS_ID != 'WS7')) {
                                        setTimeout(function () {
                                            var url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'pallet';
                                            palletRequest(url);
                                        }, 100);
                                    }
                                }
                            }
                        });
                    }
                });
                break;
            }
            case "Z2_Changed": {
                /*if ((req.body.payload.PalletID != -1)&&(req.body.payload.PalletID == palletID)) {
                 setTimeout(function () {
                 var url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                 palletRequest(url);
                 },1000);
                 }*/
                break;
            }
            case "Z3_Changed": {
                setTimeout(function () {
                    if ((req.body.payload.PalletID != -1)&&(req.body.payload.PalletID == palletID)) {
                        if((WS_ID=='WS1')||(WS_ID=='WS7')){
                            var url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                            palletRequest(url);
                            if(WS_ID=='WS1'){
                                global.palletWS1ID = req.body.payload.PalletID;
                            }
                        }
                    }
                },10);
                break;
            }
            case "PaperLoaded":{
                if(palletWS1ID == palletID){
                    currentPallet.status_ = 1;
                    var url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                    palletRequest(url);
                    url = 'http://localhost:3000/RTU/SimCNV1/services/TransZone35';
                    simRequest(url);
                }
                break;
            }
            case "DrawEndExecution":{
                if ((req.body.payload.PalletID != -1)&&(req.body.payload.PalletID == palletID)) {
                    var recipe = parseInt(req.body.payload.Recipe);
                    switch (recipe){
                        case 1:
                        case 2:
                        case 3:{
                            currentPallet.frameType_ = "done" + recipe;
                            currentPallet.status_ = 2;
                            break;
                        }
                        case 4:
                        case 5:
                        case 6:{
                            currentPallet.screenType_ = "done" + recipe;
                            currentPallet.status_=3;
                            break;
                        }
                        case 7:
                        case 8:
                        case 9:{
                            currentPallet.keyType_ = "done" + recipe;
                            currentPallet.status_ = 4;
                            break;
                        }
                    }
                    var palletStatus = currentPallet.status_;
                    switch (palletStatus) {
                        case 2: {
                            if (currentPallet.path_[2].indexOf(WS_ID) > -1) {
                                var screenType = currentPallet.screenType_;
                                url = 'http://localhost:3000/RTU/SimROB' + WSTempNum + '/services/Draw' + screenType;
                                simRequest(url);
                                url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                                palletRequest(url);
                            }
                            break;
                        }
                        case 3: {
                            if (currentPallet.path_[3].indexOf(WS_ID) > -1) {
                                var keyType = currentPallet.keyType_;
                                url = 'http://localhost:3000/RTU/SimROB' + WSTempNum + '/services/Draw' + keyType;
                                simRequest(url);
                                url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                                palletRequest(url);
                            }
                            break;
                        }
                        default:{
                            request({
                                url: 'http://localhost:3000/RTU/SimCNV'+ WSTempNum+'/data/P4',
                                method: "GET",
                            },function (err, res, body) {
                                if(parseInt(body.substr(5,6))==0){
                                    setTimeout(function () {
                                        url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone35';
                                        simRequest(url);
                                    },500)
                                }
                                else{
                                    setTimeout(function () {
                                        url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone35';
                                        simRequest(url);
                                    },2000)
                                }
                            });

                        }
                    }
                }
                break;
            }
        }
        res.end();
    });
    /*app.post('/'+palletID+'newPallet', function (req, res) {
     setPallet(req.body);
     res.end();
     });*/
    for(var i=1; i<13; i++){
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){});
    }
    request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){console.log('paper notifs');});

    app.listen(port, hostname, function(){
        console.log('PalletID: '+palletID+ ',OrderID: '+orderID+` Server running at http://${hostname}:${port}/`);
    });
};

module.exports = Pallet_Agent;