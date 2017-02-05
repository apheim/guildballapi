var fs = require('fs');
var http = require('http');
var parse = require('csv-parse');
var async = require('async');

module.exports = function(){
  console.log("starting");
  var inputFile = 'characters.csv';
  var COLUMNS = {
    NAME: 0,
    TEAM: 1,
    MELEEZONE : 2,
    JOG: 3,
    SPRINT: 4,
    TAC: 5,
    KICKDICE: 6,
    KICKLENGTH: 7,
    DEFENSE: 8,
    ARMOR: 9,
    INFLUENCESTART:10,
    INFLUENCEMAX: 11,
    HEALTH: 38,
    ICYSPONGE:39
  };

  let rowCount = 0;


var getTeam = function(teamName, onSuccess) {
        var options = {
          host: "localhost",
          port: 3000,
          path: "/api/teams?filter[where][Name]=" + teamName,
          method: 'GET'
        };

        http.get(options, function(res){
          var bodyChunks = [];
          res.on('data', function(chunk) {
            bodyChunks.push(chunk);
          }).on('end', function() {

            var body = Buffer.concat(bodyChunks);

            console.log('BODY: ' + body);
            if(bodyChunks)
              onSuccess(JSON.parse(bodyChunks)[0]);
          })
        }).end();

};


var parser = parse({delimiter: ',', auto_parse : true}, function (err, data) {
  async.eachSeries(data, function (line, callback) {
      if(rowCount++ == 0) {
        callback();
        return;
      }

      getTeam(line[COLUMNS.TEAM], function(team){
        console.log(team);
        var body = JSON.stringify({
          "Name": line[COLUMNS.NAME],
          "MeleeZone": line[COLUMNS.MELEEZONE],
          "Jog": line[COLUMNS.JOG],
          "Sprint": line[COLUMNS.SPRINT],
          "TAC": line[COLUMNS.TAC],
          "KickDice": line[COLUMNS.KICKDICE],
          "KickLength": line[COLUMNS.KICKLENGTH],
          "Defense": line[COLUMNS.DEFENSE],
          "Armor": line[COLUMNS.ARMOR],
          "InfluenceStart": line[COLUMNS.INFLUENCESTART],
          "InfluenceMax": line[COLUMNS.INFLUENCEMAX],
          "IconUrl": line[COLUMNS.NAME],
          "Health": line[COLUMNS.HEALTH],
          "IcySponge": line[COLUMNS.ICYSPONGE],
          "TeamId": team.id
        });

        var createOptions = {
          host: "localhost",
          port: 3000,
          path: "/api/characters",
          method: 'POST',
          headers: {
           "Content-Type": "application/json",
           "Content-Length": Buffer.byteLength(body)
         }
        };


        var postreq = http.request(createOptions, function(res) {
          res.setEncoding('utf8');
          callback();
        });

        postreq.write(body);
        postreq.end();
      });
  })
})
fs.createReadStream(inputFile).pipe(parser);
}
