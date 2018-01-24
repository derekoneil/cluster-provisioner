'use strict';

var request = require('request');
var path = require('path');
var fs = require('fs');

var werckerToken = process.argv[3];
var werckerOrgId = process.argv[4];
var credentialSetName = process.argv[5];
var userOcid = process.argv[6];
var fingerprint = process.argv[7];
var privateKey = process.env.PRIVATE_KEY;
var tenancyOcid = process.argv[8];
var region = process.argv[9];

var clusterName = process.argv[10];
var k8Version = process.argv[11];
var compartment = process.argv[12];
var poolName = process.argv[13];
var shape = process.argv[14];
var imageName = process.argv[15];
var workersPerAd = process.argv[16];
var ads = process.argv[17].split(',');
var werckerUser = process.argv[18];

console.log('<wercker-token> ' + werckerToken);
console.log('<wercker-org-id> ' + werckerOrgId);
console.log('<credential-set-name> ' + credentialSetName);
console.log('<user-ocid> ' + userOcid);
console.log('<fingerprint> ' + fingerprint);
// console.log('<private-key> ' + privateKey);
console.log('<tenancy-ocid> ' + tenancyOcid);
console.log('<region> ' + region);

console.log('<cluster-name> ' + clusterName);
console.log('<k8version> ' + k8Version);
console.log('<compartment> ' + compartment);
console.log('<pool-name> ' + poolName);
console.log('<shape> ' + shape);
console.log('<image-name> ' + imageName);
console.log('<workers-per-ad> ' + workersPerAd);
console.log('<ads> ' + ads);

// var privateKey = fs.readFileSync(privateKeyFile, 'utf8');

var authConfig = {};
var bmc = {};

authConfig.name = credentialSetName;
authConfig.ownerId = werckerOrgId;
bmc.user = userOcid;
bmc.fingerprint = fingerprint;
bmc.privateKey = privateKey;
bmc.tenancy = tenancyOcid;
bmc.region = region;
authConfig.bmc = bmc;

const options = {
  method: 'POST',
  uri: 'https://app.wercker.com/api/v3/clusters/' + werckerOrgId + '/authConfigs',
  headers: {
    'Authorization': 'Bearer ' + werckerToken,
    'Content-type': 'application/json;charset=UTF-8'
  },
  body: JSON.stringify(authConfig)
};

console.log(options);

var cloudAuthId = '';

request(options, function(error, response, body) {
  console.log('error:', error);
  console.log('statusCode:', response && response.statusCode);
  console.log('body:', body);
  if(body) {
    cloudAuthId = JSON.parse(body).id;
    var cluster = createClusterConfig();
    var newoptions = {
      method: 'POST',
      uri: 'https://app.wercker.com/api/v3/clusters/' + werckerOrgId,
      headers: {
        'Authorization': 'Bearer ' + werckerToken,
        'Content-type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(cluster)
    };
    console.log("requesting new cluster: " + JSON.stringify(cluster));
    request(newoptions, function(newerror, newresponse, newbody) {
      console.log('error:', newerror);
      console.log('statusCode:', newresponse && newresponse.statusCode);
      console.log('body:', newbody);

    });
  }
});

function createClusterConfig() {
  console.log('Creating Cluster Config: ' + poolName);
  var clusterConfig = {};

  clusterConfig.ownerId =  werckerOrgId;
  clusterConfig.name = clusterName;
  clusterConfig.tenantId = tenancyOcid;
  clusterConfig.cloudType = "bmc";
  clusterConfig.cloudAuthId = cloudAuthId;
  clusterConfig.lbType = "external";
  // clusterConfig.lbShape = "400Mbps";
  clusterConfig.werckerId = werckerUser;
  clusterConfig.k8Version =  k8Version;
  clusterConfig.bmcClusterConfig =  {
    compartment: compartment,
    vcnId:  '',
    sshPublicKey: '',
    sshPrivateKey:  '',
    region:  region,
    pools:  [
      {
        name: poolName,
        shape: shape,
        imageId:  '',
        imageName:  imageName,
        workersPerAD:  1,
        k8Version:  k8Version,
        ads:  []
      }
    ]
  };
  ads.forEach(ad => clusterConfig.bmcClusterConfig.pools[0].ads.push({
    id: ad,
    subnet: ''
  }));

  console.log(clusterConfig);
  console.log(clusterConfig.bmcClusterConfig.pools);
  console.log(clusterConfig.bmcClusterConfig.pools[0].ads);
  return clusterConfig;
}
