var fs = require('fs');
var http = require('http');
var parse = require('csv-parse');
var async = require('async');
var rp = require('request-promise');
var Promise = require('promise');

module.exports = function(){
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
  return new Promise(function (resolve, reject) {
    console.log("Retrieving Team " + teamName);
    var options = {
        uri: 'http://localhost:3000/api/Teams?filter[where][Name]=' + teamName,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function (teams) {
           console.log("Succesfully Retrieved Team " + teams);
           resolve(teams[0]);
        })
        .catch(function (err) {
            console.log("Error Retrieving team " + teamName);
            reject(err);
        });
    });
};

function getPlaybookActions(onSuccess){
  return new Promise(function (resolve, reject) {
    var options = {
        uri: 'http://localhost:3000/api/PlaybookActions',
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    rp(options)
        .then(function (a) {
           console.log("test");
           resolve(a);
        })
        .catch(function (err) {
            console.log(err);
            reject(err);
        });
    });
  };

  function createPlaybookColumn(col, onSuccess){
    return new Promise(function (resolve, reject) {
      console.log("create column: " + col);

      var options = {
          method: 'POST',
          uri: 'http://localhost:3000/api/PlaybookColumns',
          headers: {
              'User-Agent': 'Request-Promise'
          },
          body: col,
          json: true // Automatically parses the JSON string in the response
      };

      rp(options)
          .then(function (column) {
            console.log("Succesfully Created " + column);
             resolve(column);
          })
          .catch(function (err) {
              console.log(err);
              reject(err);
          });
      });
  };

  function createPlaybookResult(result, onSuccess){
    return new Promise(function (resolve, reject) {
      console.log("create result");

      var options = {
          uri: 'http://localhost:3000/api/PlayBookResults',
          headers: {
              'User-Agent': 'Request-Promise'
          },
          body: result,
          json: true // Automatically parses the JSON string in the response
      };

      rp(options)
          .then(function (result) {
             resolve(result);
          })
          .catch(function (err) {
              console.log(err);
              reject(err);
          });
      });
  }

  function createPlaybookResultAction(action){
    return new Promise(function (resolve, reject) {
      console.log("create result action");

      var options = {
          uri: 'http://localhost:3000/api/PlayBookResultActions',
          headers: {
              'User-Agent': 'Request-Promise'
          },
          body: action,
          json: true // Automatically parses the JSON string in the response
      };

      rp(options)
          .then(function (action) {
             resolve(action);
          })
          .catch(function (err) {
            console.log(err);

              reject(err);
          });
      });
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
    }.then(
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
    }));
  };


  function addPlaybookColumn(results, columnNumber, characterId, playbookactions){
    if(results){
      console.log(results);
    createPlaybookColumn({
       ColumnNumber: columnNumber,
       CharacterId: characterId
    }).then(function(columnRecord){
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

          getTeam(line[COLUMNS.TEAM]).then(function(team){
            console.log(team);
            var character = JSON.stringify({
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


            var options = {
                uri: 'http://localhost:3000/api/characters',
                headers: {
                    'User-Agent': 'Request-Promise'
                },
                body: character,
                json: true // Automatically parses the JSON string in the response
            };

            rp(options)
                .then(function (character) {
                  console.log("Succesfully created " + character);

                  for(let i = 1; i < 9; i++){
                    if(line[COLUMNS["PB" + i]])
                      addPlaybookColumn(line[COLUMNS["PB" + i]], i, character.id, playbookactions);
                  }
                  callback();
                })
                .catch(function (err) {
                    console.log("Error Creating Character " + character);
                    console.log(err);
                    reject(err);
                });
          });
      })
    })
    fs.createReadStream(inputFile).pipe(parser);
  }

  getPlaybookActions().then(importCharacters);
}
