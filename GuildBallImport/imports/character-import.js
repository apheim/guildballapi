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
    PB1: 12,
    PB2: 13,
    PB3: 14,
    PB4: 15,
    PB5: 16,
    PB6: 17,
    PB7: 18,
    PB8: 19,
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

function getPlaybookActions(onSuccess){
    var options = {
      host: "localhost",
      port: 3000,
      path: "/api/PlaybookActions",
      method: 'GET'
    };

    http.get(options, function(res){
      var bodyChunks = [];
      res.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {

        var body = Buffer.concat(bodyChunks);
        if(bodyChunks)
          onSuccess(JSON.parse(bodyChunks));
      })
    }).end();

  };

  function createPlaybookColumn(col, onSuccess){
    col = JSON.stringify(col);

    var createOptions = {
      host: "localhost",
      port: 3000,
      path: "/api/PlaybookColumns",
      method: 'POST',
      headers: {
       "Content-Type": "application/json",
       "Content-Length": Buffer.byteLength(col)
     }
    };


    var postreq = http.request(createOptions, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        onSuccess(JSON.parse(chunk));
      });
    });
    postreq.write(col);
    postreq.end();
  };

  function createPlaybookResult(result, onSuccess){
    result = JSON.stringify(result);

    var createOptions = {
      host: "localhost",
      port: 3000,
      path: "/api/PlayBookResults",
      method: 'POST',
      headers: {
       "Content-Type": "application/json",
       "Content-Length": Buffer.byteLength(result)
     }
    };


    var postreq = http.request(createOptions, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        onSuccess(JSON.parse(chunk));
      });
    });

    postreq.write(result);
    postreq.end();
  }

  function createPlaybookResultAction(action){
    action = JSON.stringify(action);
    var createOptions = {
      host: "localhost",
      port: 3000,
      path: "/api/PlayBookResultActions",
      method: 'POST',
      headers: {
       "Content-Type": "application/json",
       "Content-Length": Buffer.byteLength(action)
     }
    };


    var postreq = http.request(createOptions, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        onSuccess(JSON.parse(chunk));
      });
    });

    postreq.write(action);
    postreq.end();
  }

  function getActionId(playbookactions, name){
    playbookactions.forEach(function(action){
      if(action.Name == name)
        return action.id;
    });
  };

  function addPlaybookColumnResult(result, columnId, playbookactions){
    var momentous = result[0] == 'm';
    createPlaybookResult({
      Momentous : momentous,
      PlaybookColumnId: columnId
    },
    function(playbookResultRecord){
      var order = 0;
      for(var i = 0; i < result.length; i++){
        var r = result[i];
        var actionId = null;
        switch (r) {
          case 'm':
            continue;
            break;
          case 'k':
            actionId = getActionId(playbookactions, "Knock Down");
            break;
          case 'p':
            actionId = getActionId(playbookactions, "Push");
            break;
          case 'd':
            actionId = getActionId(playbookactions, "Dodge");
            break;
          case 't':
            actionId = getActionId(playbookactions, "Tackle");
            break;
          case '1':
            actionId = getActionId(playbookactions, "1 Damage");
            break;
          case '2':
            actionId = getActionId(playbookactions, "2 Damage");
            break;
          case '3':
            actionId = getActionId(playbookactions, "3 Damage");
            break;
          case '4':
            actionId = getActionId(playbookactions, "4 Damage");
            break;
          case 'g':
            if(result[i + 1] == "g"){
              actionId = getActionId(playbookactions, "Character Play 1");
              i++;
            } else {
              actionId = getActionId(playbookactions, "Character Play 2");
            }
            break;
          default:

        }
        if(actionId){
          createPlaybookResultAction({
            Order: order,
            PlaybookResultId: playbookResultRecord.Id,
            PlaybookActionId: Id
          })
          order++;
        }
      }
    });

  };


  function addPlaybookColumn(results, columnNumber, characterId, playbookactions){
    if(results){
      console.log(results);
    createPlaybookColumn({
       ColumnNumber: columnNumber,
       CharacterId: characterId
    }, function(columnRecord){
      console.log(results);

        var resultSplit = ("" + results).split(',');
        console.log(resultSplit);
        resultSplit.forEach(function(result){
          addPlaybookColumnResult(result, columnRecord.id, playbookactions);
        });
    });
  }
  };

  function importCharacters(playbookactions){
    console.log(playbookactions);
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
              res.on('data', function (chunk) {
                var character = JSON.parse(chunk);
                console.log("character created:");
                console.log(character);
                for(let i = 1; i < 9; i++){
                  if(line[COLUMNS["PB" + i]])
                    addPlaybookColumn(line[COLUMNS["PB" + i]], i, character.id, playbookactions);
                }
                res.setEncoding('utf8');
                callback();
             });

            });

            postreq.write(body);
            postreq.end();
          });
      })
    })
    fs.createReadStream(inputFile).pipe(parser);
  }

  getPlaybookActions(importCharacters);
}
