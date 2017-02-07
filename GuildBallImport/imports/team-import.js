var fs = require('fs');
var http = require('http');
var parse = require('csv-parse');
var async = require('async');
var Promise = require('promise');

module.exports = function() {
    return new Promise(function(resolve, reject) {
        var inputFile = 'teams.csv';
        var TEAM_COLUMNS = {
            NAME: 0,
            ICONURL: 1
        }
        let rowCount = 0;

        var parser = parse({
            delimiter: ',',
            auto_parse: true
        }, function(err, data) {
            async.eachSeries(data, function(line, callback) {
                if (rowCount++ == 0) {
                    callback(null);
                    return;
                }

                var body = JSON.stringify({
                    Name: line[TEAM_COLUMNS.NAME],
                    IconUrl: line[TEAM_COLUMNS.ICONURL]
                });

                var options = {
                    host: "localhost",
                    port: 3000,
                    path: "/api/teams",
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(body)
                    }
                };


                var postreq = http.request(options, function(res) {
                    console.log("return");
                    res.setEncoding('utf8');
                    callback(null);
                });

                postreq.write(body);
                postreq.end();
            }, resolve)
        });

        fs.createReadStream(inputFile).pipe(parser);
    });
};
