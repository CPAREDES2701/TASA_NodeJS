'use strict';

const oauthClient = require('client-oauth2');
const request = require('request-promise');
var cors = require('cors');
var bodyParser = require('body-parser');
const express = require('express');
const app = express();

app.use(express.json({
    type: "*/*" // optional, only if you want to be sure that everything is parset as JSON. Wouldn't reccomend
}));

//var data = [{"wa":"ESREG = 'S'"}];

//CORS Configuration
var allowlist = [
    'http://localhost:8080', 
    'https://workspaces-ws-2x82d-app1.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-8m9sh-app1.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-8m9sh-app4.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-5btxh-app3.us10.applicationstudio.cloud.sap',
    'https://workspaces-ws-jtjkx-app1.us10.applicationstudio.cloud.sap', // workspace @leonel
    'https://workspaces-ws-lf8m4-app1.us10.applicationstudio.cloud.sap', // workspace @Piero
    'https://workspaces-ws-xjjtj-app2.us10.applicationstudio.cloud.sap', // workspace @celso
    'https://workspaces-ws-xjjtj-app4.us10.applicationstudio.cloud.sap',  // workspace @celso
    'https://workspaces-ws-cq9mq-app1.us10.applicationstudio.cloud.sap',    // workspace @Christopher
    'https://workspaces-ws-6hf6v-app1.us10.applicationstudio.cloud.sap',    // workspace @Cesar
    'https://workspaces-ws-cd8st-app1.us10.applicationstudio.cloud.sap',    // workspace @leonel
    'https://tasaqas.launchpad.cfapps.us10.hana.ondemand.com'             // launchpad 
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
}

//const HOST = 'https://flotabackendqas.cfapps.us10.hana.ondemand.com';

const _getAccessToken = function() {
    return new Promise((resolve, reject) => {
        const oautClient = new oauthClient({
            accessTokenUri: XSUAA_URL + '/oauth/token',
            clientId: XSUAA_CLIENTID,
            clientSecret: XSUAA_CLIENTSECRET,
            scopes: []
        });

        oautClient.owner.getToken('clahura@xternal.biz', 'XtsComer18$')
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


/**
 * POST Read table
 */
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

// the server
const port = process.env.PORT || 3000;  // cloud foundry will set the PORT env after deploy
app.listen(port, function () {
    console.log('Node server running. Port: ' + port);
    console.log(port);
})