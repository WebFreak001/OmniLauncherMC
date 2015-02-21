var request = require("request");
var fs = require("fs");
var async = require("async");
var os = require("os");
var unzip = require("unzip");
var mkdirp = require("mkdirp");

class DependencyLoader {
    static loadDependency(gameVersion, callback) {
        var parts = gameVersion.name.split(":");
        var lib = parts[0];
        var name = parts[1];
        var version = parts[2];
        var libUrl = lib.replace(/\./g, "/");
        var nativeString = "";
        var needsExtract = false;
        var arch = "";
        if (gameVersion.natives) {
            switch (os.platform()) {
                case "linux":
                    if (gameVersion.natives.linux)
                        nativeString = "-" + gameVersion.natives.linux;
                    needsExtract = true;
                    break;
                case "win32":
                    if (gameVersion.natives.windows)
                        nativeString = "-" + gameVersion.natives.windows;
                    needsExtract = true;
                    break;
                case "osx":
                    if (gameVersion.natives.osx)
                        nativeString = "-" + gameVersion.natives.osx;
                    needsExtract = true;
                    break;
            }
        }

        nativeString = nativeString.replace("${arch}", process.arch.substr(1));
        var fileName = name + "-" + version + nativeString + ".jar";
        var shaFile = fileName + ".sha";
        fs.exists("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + shaFile, function(shaExists) {
            if (shaExists) {
                if (needsExtract) {
                    // Minecraft bugs out and is not playable when not extracting every time
                    console.log("unzipping " + name);
                    try {
                        fs.createReadStream("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + fileName).pipe(unzip.Extract({ path: "lib/natives/" })).on("error", function(err) {
                            console.log("Error " + fileName + ": ", err);
                        }).on("finish", function() {
                                console.log("unzipped " + name);
                                callback();
                            });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                else {
                    console.log(name);
                    callback();
                }
            }
            else {
                fs.exists("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + fileName, function(jarExists) {
                    if (jarExists) {
                        callback();
                    }
                    else {
                        mkdirp("lib/libs/" + libUrl + "/" + name + "/" + version + "/", function(err) {
                            if (err) return callback(err);
                            request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + fileName)
                                .pipe(fs.createWriteStream("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + fileName).on("finish", function() {
                                    request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile)
                                        .pipe(fs.createWriteStream("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + shaFile).on("finish", function() {
                                            if (needsExtract) {
                                                console.log("unzipping " + name);
                                                try {
                                                    fs.createReadStream("lib/libs/" + libUrl + "/" + name + "/" + version + "/" + fileName).pipe(unzip.Extract({ path: "lib/natives/" })).on("error", function(err) {
                                                        console.log("Error " + fileName + ": ", err);
                                                    }).on("finish", function() {
                                                            console.log("unzipped " + name);
                                                            callback();
                                                        });
                                                }
                                                catch (e) {
                                                    console.log(e);
                                                }
                                            }
                                            else {
                                                console.log(name);
                                                callback();
                                            }
                                        }));
                                }));
                        });
                    }
                });
            }
        });
    }

    static loadAll(gameJson, callback) {
        if (!fs.existsSync("lib/"))
            fs.mkdirSync("lib/");
        if (!fs.existsSync("lib/natives/"))
            fs.mkdirSync("lib/natives/");
        async.eachLimit(gameJson.libraries, 30, DependencyLoader.loadDependency, function(err) {
            if (err) console.log(err);
            callback(err);
        });
    }
}

module.exports = DependencyLoader;
