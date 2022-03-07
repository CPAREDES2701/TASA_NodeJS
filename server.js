'use strict';

const oauthClient = require('client-oauth2');
const request = require('request-promise');
var cors = require('cors');
var bodyParser = require('body-parser');
const express = require('express');
const app = express();
const jwtDecode = require('jwt-decode');
var approuter = require('@sap/approuter');
var ar = new approuter();
/*var xsenv = require('@sap/xsenv');
var passport = require('passport');
var JWTStrategy = require('@sap/xssec').JWTStrategy;

var services = xsenv.getServices({ uaa: { tag: "xsuaa" } });
passport.use(new JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));*/

app.use(express.json({
    type: "*/*", // optional, only if you want to be sure that everything is parset as JSON. Wouldn't reccomend
    limit: '50mb'
}));

//var data = [{"wa":"ESREG = 'S'"}];

//CORS Configuration
var allowlist = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com/9acc820a-22dc-4d66-8d69-bed5b2789d3c.AyudasBusqueda',
    'https://workspaces-ws-2x82d-app1.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-8m9sh-app1.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-8m9sh-app4.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-5btxh-app3.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-jtjkx-app1.us10.applicationstudio.cloud.sap', // workspace @leonel
    'https://workspaces-ws-lf8m4-app1.us10.applicationstudio.cloud.sap', // workspace @Piero
    'https://workspaces-ws-xjjtj-app2.us10.applicationstudio.cloud.sap', // workspace @celso
    'https://workspaces-ws-xjjtj-app4.us10.applicationstudio.cloud.sap',  // workspace @celso
    'https://workspaces-ws-cq9mq-app1.us10.applicationstudio.cloud.sap',    // workspace @Christopher
    'https://workspaces-ws-57bg6-app1.us10.applicationstudio.cloud.sap',    // workspace @Cesar
    'https://workspaces-ws-cd8st-app1.us10.applicationstudio.cloud.sap',    // workspace @leonel
    'https://workspaces-ws-57bg6-app3.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-57bg6-app2.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-57bg6-app4.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-57bg6-app5.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-wqm64-app1.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-qdslk-app1.us10.applicationstudio.cloud.sap',
    'https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com',             // launchpad 
    'https://tasadev.launchpad.cfapps.us10.hana.ondemand.com',
    'https://tasaprd.launchpad.cfapps.us10.hana.ondemand.com',
    'https://tasaprd.cpp.cfapps.us10.hana.ondemand.com',
    'https://workspaces-ws-ndjqc-app1.us10.applicationstudio.cloud.sap',  //Ruben
    'https://workspaces-ws-ndjqc-app3.us10.applicationstudio.cloud.sap',  //Ruben
    'https://workspaces-ws-cd8st-app1.us10.applicationstudio.cloud.sap',  //Ruben
    'https://workspaces-ws-ndjqc-app2.us10.applicationstudio.cloud.sap',  //Ruben
    'https://workspaces-ws-ndjqc-app5.us10.applicationstudio.cloud.sap',  // Ruben
    'https://workspaces-ws-ndjqc-app4.us10.applicationstudio.cloud.sap'   //Ruben
];
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true} // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false} // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

//CLIENT CREDENTIALS
const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
const XSUAA_URL = VCAP_SERVICES.xsuaa[0].credentials.url; 
const XSUAA_CLIENTID = VCAP_SERVICES.xsuaa[0].credentials.clientid; 
const XSUAA_CLIENTSECRET = VCAP_SERVICES.xsuaa[0].credentials.clientsecret;
const XSUAA_ZONEID = VCAP_SERVICES.xsuaa[0].credentials.identityzone;

//SERVICIOS
var HOST = 'https://flotabackend.cfapps.us10.hana.ondemand.com';
if (XSUAA_ZONEID == "tasaqas") {
    HOST = 'https://flotabackendqas.cfapps.us10.hana.ondemand.com';
}else if(XSUAA_ZONEID == "tasaprd"){
    HOST = 'https://flotabackendprd.cfapps.us10.hana.ondemand.com';
}

var HOST2 = 'https://current-user-qas.cfapps.us10.hana.ondemand.com/';

//const HOST = 'https://flotabackendqas.cfapps.us10.hana.ondemand.com';

const _getAccessToken = function() {
    return new Promise((resolve, reject) => {
        const oautClient = new oauthClient({
            accessTokenUri: XSUAA_URL + '/oauth/token',
            clientId: XSUAA_CLIENTID,
            clientSecret: XSUAA_CLIENTSECRET,
            scopes: []
        });

        oautClient.owner.getToken('tasa_btp@xternal.biz', 'hX8MG$0LTEFo')
        .then((result) => {
            resolve({accessToken: result.accessToken});
        })
        .catch((error) => {
            reject({message: 'Error: failed to get access token. ', error: error}); 
        });
    });
}

 const _doQUERY = function (serviceUrl, accessToken, sBody, sMethod){
    return new Promise (function(resolve, reject){
        var options = {
            url: serviceUrl,
            resolveWithFullResponse: true ,
            method: sMethod,
            headers: { 
                Authorization: 'Bearer ' + accessToken, 
                Accept : 'application/json'
            }
        };

        if(sBody){
            options.json = sBody;
        }

        request(options)
        .then((response) => {
            if(response && response.statusCode == 200){
                resolve({responseBody: response.body});
            }
            reject({ message: 'Error while calling OData service'});
        })  
        .catch((error) => {
            reject({ message: 'Error occurred while calling OData service', error: error });
        });
    });
 };



 //TRIPULANTES
 app.post('/api/tripulantes/PDFReporteObsTripu', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFReporteObsTripu";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
 app.post('/api/tripulantes/ReporteObservacionesTripulantes', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/ReporteObservacionesTripulantes";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
 app.post('/api/tripulantes/SeguimientoTripulantes', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/SeguimientoTripulantes";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
app.post('/api/tripulantes/TrabajoFueraFaenaTransporte', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/TrabajoFueraFaenaTransporte";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
app.post('/api/tripulantes/TrabajoFueraFaenaDetalle', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/TrabajoFueraFaenaDetalle";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/tripulantes/PDFTrabajoFF', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFTrabajoFF";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
app.post('/api/tripulantes/GuardaTrabajo/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/GuardaTrabajo/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
//TRIPULANTES

 /**
  * POST Listar Eventos Pesca
  */

 app.post('/api/configeventospesca/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/configeventospesca/Listar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/reportesmodifdatoscombustible/Listar/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportesmodifdatoscombustible/Listar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


 /**
  * POST Editar Eventos Pesca
  */

  app.post('/api/configeventospesca/Editar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/configeventospesca/Editar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

// get
app.get('/api/embarcacion/listaEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/listaEmbarcacion";
        return _doQUERY(sUrl, result.accessToken, null, 'GET');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Ayuda de búsqueda de embarcaciones
 */
 app.post('/api/embarcacion/AyudaBusqueda', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/AyudaBusqueda/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Precios de pesca
 */

app.post('/api/preciospesca/Mant', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/Mant";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/preciospesca/Consultar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/Consultar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/preciospesca/ConsultarProb', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/ConsultarProb";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/consultahorometro/Listar/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/consultahorometro/Listar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/logregistrocombustible/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/logregistrocombustible/Listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/logregistrocombustible/Nuevo', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/logregistrocombustible/Nuevo";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/analisiscombustible/QlikView', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/QlikView";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/analisiscombustible/ExportRegistroAnalisisCombus', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/ExportRegistroAnalisisCombus";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/reportesmodifdatoscombustible/Exportar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportesmodifdatoscombustible/Exportar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/tripulantes/RegistroZarpe/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/RegistroZarpe/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/tripulantes/RolTripulacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/RolTripulacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/tripulantes/PDFRolTripulacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFRolTripulacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/tripulantes/PDFTrimestral/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFTrimestral/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/tripulantes/PDFZarpe/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFZarpe/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/tripulantes/PDFZarpeTravesia/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFZarpeTravesia/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});




app.post('/api/tripulantes/PDFTravesia/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFTravesia/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});





app.post('/api/tolvas/pdfdeclaracionjurada', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/pdfdeclaracionjurada";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/tolvas/pdfdeclaracionjurada2', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/pdfdeclaracionjurada2";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/analisiscombustible/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/Listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/analisiscombustible/Detalle', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/Detalle";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/analisiscombustible/Detalles', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/Detalles";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
app.post('/api/analisiscombustible/AnalisisCombu', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/AnalisisCombu";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/preciospesca/ObtenerPrecioPond', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/ObtenerPrecioPond";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/preciospesca/AgregarBono', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/AgregarBono";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/General/Update_Camp_Table/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Camp_Table/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/preciospesca/ConsultarPrecioMar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/ConsultarPrecioMar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});




app.post('/api/preciospesca/Leer', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/preciospesca/Leer";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});
//get
app.get('/api/embarcacion/listaTipoEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/listaTipoEmbarcacion?usuario=" + req.query.usuario;
        return _doQUERY(sUrl, result.accessToken, null, 'GET');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//get
app.get('/api/embarcacion/listaPlantas', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/listaPlantas?usuario=" + req.query.usuario;
        return _doQUERY(sUrl, result.accessToken, null, 'GET');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//get distribucion flota
app.get('/api/embarcacion/ObtenerFlota', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        console.log('TOKEN: ', result.accessToken);
        var sUrl = HOST + "/api/embarcacion/ObtenerFlota?user=" + req.query.usuario;
        return _doQUERY(sUrl, result.accessToken, null, 'GET');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//consultar marea
app.post('/api/embarcacion/consultaMarea/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/consultaMarea/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//consultar marea
app.post('/api/embarcacion/consultaMarea2/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/consultaMarea2/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//validar ccertificado bodega
app.post('/api/embarcacion/ValidarBodegaCert/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ValidarBodegaCert/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//validar marea
app.post('/api/embarcacion/ValidarMarea/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ValidarMarea/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Read table
 */
 app.post('/api/General/ConsultaRol/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/ConsultaRol/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

 app.post('/api/General/Maestro_ObtenerRegistros/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Maestro_ObtenerRegistros/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/General/Read_Table/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Read_Table/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});


app.post('/api/cargaarchivos/CargaDescargaArchivos/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/cargaarchivos/CargaDescargaArchivos/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST carga dinamica de archivos (embarcaciones y cuotas armadores)
 */
 app.post('/api/cargaarchivos/CargaDinamicaArchivos/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/cargaarchivos/CargaDinamicaArchivos/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Update table
 */
app.post('/api/General/Update_Table/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Table/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Update table 2
 */
app.post('/api/General/Update_Table2/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Table2/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Update table 2
 */
 app.post('/api/General/Update_Table3/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Table3/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Update CAmp table 
 */
 app.post('/api/General/Update_Camp_Table/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Camp_Table/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Consulta de Calas
 */
app.post('/api/reportepesca/ConsultarCalas', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/ConsultarCalas";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Reporte de biometría
 */
 app.post('/api/reportepesca/ReporteBiometria', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/ReporteBiometria";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Agregar interlocutor
 */
 app.post('/api/reportepesca/AgregarInterlocutor', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/AgregarInterlocutor";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Consulta de mareas
 */
 app.post('/api/reportepesca/ConsultarMareas/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/ConsultarMareas/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Consulta de pesca descargada
 */
 app.post('/api/reportepesca/ConsultarPescaDescargada/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/ConsultarPescaDescargada/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Reporte TDC CDH
 */
 app.post('/api/reportepesca/ReporteTDC_CHD/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/reportepesca/ReporteTDC_CHD/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST lista Maestros
 */
app.post('/api/General/AppMaestros/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/AppMaestros/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Requerimiento pesca listar
 */
app.post('/api/requerimientopesca/listar/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/requerimientopesca/listar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});



app.post('/api/cargaarchivos/CargaArchivo', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/cargaarchivos/CargaArchivo";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

//ejecutar job

app.post('/api/tolvas/ejecutarPrograma', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/ejecutarPrograma";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/tolvas/buscar_descargas/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/buscar_descargas/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});
app.post('/api/tolvas/validarPeriodo', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/validarPeriodo";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});
//ejecutar job


app.post('/api/aceitesusados/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/aceitesusados/Listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/aceitesusados/Nuevo', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/aceitesusados/Nuevo";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

app.post('/api/aceitesusados/Anular', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/aceitesusados/Anular";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST Requerimiento pesca Registrar
 */
app.post('/api/requerimientopesca/registrar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/requerimientopesca/registrar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST listar dominios
 */
app.post('/api/dominios/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/dominios/Listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST distribucion flota listar
 */
app.post('/api/distribucionflota/listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/distribucionflota/listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });    
});

/**
 * POST mover embarcacion
 */
app.post('/api/embarcacion/MoverEmbarcacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/MoverEmbarcacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Busqueda embarcacion
 */
app.post('/api/embarcacion/BusquedasEmbarcacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/BusquedasEmbarcacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ConsultarEmbarcacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ConsultarEmbarcacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST /api/embarcacion/BusqAdicEmbarca/
 */
app.post('/api/embarcacion/BusqAdicEmbarca/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/BusqAdicEmbarca/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ConsultarEmbarcacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ConsultarEmbarcacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ConsultarEmbarcacion/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ConsultarEmbarcacion/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/Editar_Crear/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/Editar_Crear/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Carga histórico competencia
 */
 app.post('/api/historicocompetencia/cargahistorico/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/historicocompetencia/cargahistorico/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST Registro Tolvas Listar
 */
 app.post('/api/tolvas/registrotolvas_listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/registrotolvas_listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST  Tolvas 
 */
 app.post('/api/tolvas/ingresodescargamanual_guardar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/ingresodescargamanual_guardar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST  Tolvas 
 */
 app.post('/api/tolvas/pescacompetenciaradial', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/pescacompetenciaradial";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * POST  Tolvas 
 */
 app.post('/api/tolvas/calculoderechopesca', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tolvas/calculoderechopesca";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * @Eventos de pesca
 */
app.post('/api/eventospesca/ObtenerConfEventosPesca/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/eventospesca/ObtenerConfEventosPesca/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


app.post('/api/eventospesca/obtenerHoroEvento/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/eventospesca/obtenerHoroEvento/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


app.post('/api/valeviveres/Listar/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/valeviveres/Listar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


app.post('/api/valeviveres/Guardar/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/valeviveres/Guardar/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


app.post('/api/valeviveres/DetalleImpresionViveres', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/valeviveres/DetalleImpresionViveres";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

//https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/analisiscombustible/Detalle
app.post('/api/analisiscombustible/Detalle', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/Detalle";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

// https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/analisiscombustible/Listar
app.post('/api/analisiscombustible/Listar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/Listar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/analisiscombustible/ExportQlikView', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/analisiscombustible/ExportQlikView";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});
/**
 * @Sistema de flota 
 */
 /**
  * Pesca declarada
  */
 app.post('/api/sistemainformacionflota/PescaDeclarada', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaDeclarada";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca declarada diaria
 */
 app.post('/api/sistemainformacionflota/PescaDeclaradaDiara', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaDeclaradaDiara";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca declarada diaria (ver detalles diferencia)
 */
 app.post('/api/sistemainformacionflota/PescaDeclaradaDife', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaDeclaradaDife";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca descargada
 */
app.post('/api/sistemainformacionflota/PescaDescargada', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaDescargada";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca descargada resumida por día
 */
 app.post('/api/sistemainformacionflota/PescaDescargadaDiaResum', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaDescargadaDiaResum";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca por embarcación
 */
 app.post('/api/sistemainformacionflota/PescaPorEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaPorEmbarcacion";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Exportar excel Pesca por embarcación
 */
 app.post('/api/sistemainformacionflota/ExportPescaPorEmbarcacion', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/ExportPescaPorEmbarcacion";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Pesca de competencia - PRODUCE
 */
app.post('/api/sistemainformacionflota/PescaCompetenciaProduce', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/PescaCompetenciaProduce";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/sistemainformacionflota/ReportePescaCompProd', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/sistemainformacionflota/ReportePescaCompProd";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

// https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/valeviveres/CostoRacionValev
app.post('/api/valeviveres/CostoRacionValev', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/valeviveres/CostoRacionValev";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

// https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/valeviveres/CostoRacionValev
app.post('/api/General/Armador/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Armador/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});
// https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/valeviveres/AnularValev
app.post('/api/valeviveres/AnularValev', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/valeviveres/AnularValev";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


/**
 * Ayudas de Busqueda
 */

app.post('/api/General/AyudasBusqueda/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/AyudasBusqueda/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Post Calendario de temporada de pesca
 */
app.post('/api/General/ConsultaGeneral/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/ConsultaGeneral/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/calendariotemporadapesca/Eliminar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/calendariotemporadapesca/Eliminar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/calendariotemporadapesca/Guardar', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/calendariotemporadapesca/Guardar";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/correo/EnviarNotifDescTolvas', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/correo/EnviarNotifDescTolvas";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/correo/EnviarInfoHorometroAveriado', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/correo/EnviarInfoHorometroAveriado";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/tripulantes/ObtenerSemanas', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/ObtenerSemanas";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});



app.post('/api/tripulantes/Protestos', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/Protestos";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});
app.post('/api/tripulantes/PDFProtestos', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFProtestos";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});


app.post('/api/tripulantes/PDFValeViveres', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/PDFValeViveres";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/tripulantes/TrabajoFFDetalle', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/tripulantes/TrabajoFFDetalle";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/General/UpdateTripulantesMasivo/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/UpdateTripulantesMasivo/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/General/UpdateEmbarcacionMasivo/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/UpdateEmbarcacionMasivo/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerCantidadTripulantes/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerCantidadTripulantes/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/consultarHorometro/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/consultarHorometro/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Reabrir marea
 */
 app.post('/api/embarcacion/reabrirMarea/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/reabrirMarea/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/**
 * Anular marea
 */
 app.post('/api/embarcacion/anularMarea/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/anularMarea/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/General/Update_Table3/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/General/Update_Table3/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ConsultaReserva/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ConsultaReserva/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/CrearMarea/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/CrearMarea/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerSuministro/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerSuministro/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerConfigReservas/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerConfigReservas/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerEmbaComb/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerEmbaComb/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/CrearReserva/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/CrearReserva/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/AnularReserva/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/AnularReserva/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/CrearVenta/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/CrearVenta/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/AnularVenta/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/AnularVenta/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerEveElim/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerEveElim/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/eventospesca/AnularDescarga/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/eventospesca/AnularDescarga/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.post('/api/embarcacion/ObtenerAlmacenExterno/', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    .then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST + "/api/embarcacion/ObtenerAlmacenExterno/";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })
    .then((result) => {
        console.log('Successfully called OData service. Response body: ' + result.responseBody);
        res.status(200).send(JSON.stringify(result.responseBody));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

app.get('/getuserinfo', cors(corsOptionsDelegate),function (req, res) {  
    console.log('Node server has been invoked. Now calling Backend service API ...');
    _getAccessToken()
    /*.then((result) => {
        console.log('Successfully fetched OAuth access token: ' +  result.accessToken.substring(0,16));
        var sUrl = HOST2 + "/getuserinfo";
        return _doQUERY(sUrl, result.accessToken, req.body, 'POST');
    })*/
    .then((result) => {
        //console.log('Successfully called OData service. Response body: ' + result.responseBody);
        
        var decodedJWTToken = jwtDecode(result.accessToken);
        //var token = "eyJhbGciOiJSUzI1NiIsImprdSI6Imh0dHBzOi8vdGFzYXFhcy5hdXRoZW50aWNhdGlvbi51czEwLmhhbmEub25kZW1hbmQuY29tL3Rva2VuX2tleXMiLCJraWQiOiJkZWZhdWx0LWp3dC1rZXktMTgyMzc4NDkzNSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MWE4M2NkZGE5YWY0MGY0YWFlYTIyNTA0MjMxZTA3YyIsImV4dF9hdHRyIjp7ImVuaGFuY2VyIjoiWFNVQUEiLCJzdWJhY2NvdW50aWQiOiJkNmUwNDU2NC1mZmNjLTQ0MzgtYmU3ZS0xMDE0OGE2OTI1OTIiLCJ6ZG4iOiJ0YXNhcWFzIn0sInN1YiI6InNiLWZsb3RhLWpjbyF0MzE3MjUiLCJhdXRob3JpdGllcyI6WyJ1YWEucmVzb3VyY2UiXSwic2NvcGUiOlsidWFhLnJlc291cmNlIl0sImNsaWVudF9pZCI6InNiLWZsb3RhLWpjbyF0MzE3MjUiLCJjaWQiOiJzYi1mbG90YS1qY28hdDMxNzI1IiwiYXpwIjoic2ItZmxvdGEtamNvIXQzMTcyNSIsImdyYW50X3R5cGUiOiJjbGllbnRfY3JlZGVudGlhbHMiLCJyZXZfc2lnIjoiNTFmY2RjMmEiLCJpYXQiOjE2NDA4NzI4MDYsImV4cCI6MTY0MDkxNjAwNiwiaXNzIjoiaHR0cHM6Ly90YXNhcWFzLmF1dGhlbnRpY2F0aW9uLnVzMTAuaGFuYS5vbmRlbWFuZC5jb20vb2F1dGgvdG9rZW4iLCJ6aWQiOiJkNmUwNDU2NC1mZmNjLTQ0MzgtYmU3ZS0xMDE0OGE2OTI1OTIiLCJhdWQiOlsidWFhIiwic2ItZmxvdGEtamNvIXQzMTcyNSJdfQ.iB4PUyndVezuwrFuPZjKAM0JtmG40wThkeVmAeUAn6Bq7d8Iyd5KszKWkkd_g8J1gNM9E1cvN7GjVz9vf1JQDmLlhPmPQT7A3rYdsT-_kpOVyqrOXmasEQ963WMtbJSVYyrCqBMqFv8-PI6tF3uZ76BOoidDhe8HR7JJqIXf-wfZee7byJH8nJLNqKn-7ap6ctfTVB3RAiz0_CfKSLRC_ZbD0lDj6q0kiCPNHWfxQYMCpZ3of3lofogbdeOvr0y4Q_4kvghWi5uCa62qFFBWYuD7Eadil2Ji0H3ewotLwpCaqHmRr1h-sBmJL4xadF2cd80ZE7FuSH_sahQ57-uH-A";
        var decodedJWTToken = jwtDecode(token);
        res.status(200).send(JSON.stringify({
			UserDetails: decodedJWTToken
		}));
    })
    .catch((error) => {
        console.log(error.message + ' Reason: ' + error.error);
        res.status(500).send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
    });
});

/*ar.beforeRequestHandler.use('/jwtdecode', function (req, res, next) {
	if (!req.user) {
	  res.statusCode = 403;
	  res.end(`Missing JWT Token`);
	} else {
	  res.statusCode = 200;
	  res.end(`${JSON.stringify(jwtDecode(req.user.token.accessToken))}`);
	} 
});
ar.start();*/



// the server
const port = process.env.PORT || 3000;  // cloud foundry will set the PORT env after deploy
const server = app.listen(port);
server.timeout = 600000;
// app.listen(port, function () {
//     console.log('Node server running. Port: ' + port);
//     console.log(port);
// })
