var request = require("request");
var fs = require("fs");
var async = require("async");

class DependencyLoader {
    static loadDependency(gameVersion, callback) {
        var parts = gameVersion.name.split(":");
        var lib = parts[0];
        var name = parts[1];
        var version = parts[2];
        var libUrl = lib.replace(".", "/");
        var fileName = name + "-" + version + ".jar";
        var shaFile = fileName + ".sha1";
        fs.exists("lib/" + shaFile, function(exists) {
            if (exists) {
                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile, function(err, res, body) {
                    if (err) return callback(err);
                    fs.readFile("lib/" + shaFile, function(err, data) {
                        if (err) return callback(err);
                        if (data == body) callback();
                        else request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + fileName)
                            .pipe(fs.createWriteStream("lib/" + fileName).on("finish", function() {
                                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile)
                                    .pipe(fs.createWriteStream("lib/" + shaFile).on("finish", function() { console.log("End" + name); callback(); }));
                            }));
                    });
                });
            }
            else {
                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + fileName)
                    .pipe(fs.createWriteStream("lib/" + fileName).on("finish", function() {
                        request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile)
                            .pipe(fs.createWriteStream("lib/" + shaFile).on("finish", function() { console.log("End" + name); callback(); }));
                    }));
            }
        });
    }

    static loadAll(gameJson, callback) {
        if (!fs.existsSync("lib/"))
            fs.mkdirSync("lib/");
        async.each(gameJson, DependencyLoader.loadDependency, function(err) {
            if (err) console.log(err);
            callback(err);
        });
    }
}

module.exports = DependencyLoader;
