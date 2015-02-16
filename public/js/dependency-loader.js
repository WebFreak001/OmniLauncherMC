var request = require("request");
var fs = require("fs");
var async = require("async");
var os = require("os");
var unzip = require("unzip");
var DependencyLoader = (function () {
    function DependencyLoader() {
    }
    DependencyLoader.loadDependency = function (gameVersion, callback) {
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
        var shaFile = fileName + ".sha1";
        fs.exists("lib/" + shaFile, function (exists) {
            if (exists) {
                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile, function (err, res, body) {
                    if (err)
                        return callback(err);
                    fs.readFile("lib/" + shaFile, function (err, data) {
                        if (err)
                            return callback(err);
                        if (data == body)
                            callback();
                        else
                            request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + fileName).pipe(fs.createWriteStream("lib/" + fileName).on("finish", function () {
                                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile).pipe(fs.createWriteStream("lib/" + shaFile).on("finish", function () {
                                    if (needsExtract) {
                                        console.log("unzipping " + name);
                                        try {
                                            fs.createReadStream("lib/" + fileName).pipe(unzip.Extract({ path: "lib/natives/" })).on("error", function (err) {
                                                console.log("Error " + fileName + ": ", err);
                                            }).on("finish", function () {
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
                });
            }
            else {
                request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + fileName).pipe(fs.createWriteStream("lib/" + fileName).on("finish", function () {
                    request("https://libraries.minecraft.net/" + libUrl + "/" + name + "/" + version + "/" + shaFile).pipe(fs.createWriteStream("lib/" + shaFile).on("finish", function () {
                        if (needsExtract) {
                            console.log("unzipping " + name);
                            try {
                                fs.createReadStream("lib/" + fileName).pipe(unzip.Extract({ path: "lib/natives/" })).on("error", function (err) {
                                    console.log("Error " + fileName + ": ", err);
                                }).on("finish", function () {
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
            }
        });
    };
    DependencyLoader.loadAll = function (gameJson, callback) {
        if (!fs.existsSync("lib/"))
            fs.mkdirSync("lib/");
        if (!fs.existsSync("lib/natives/"))
            fs.mkdirSync("lib/natives/");
        async.each(gameJson.libraries, DependencyLoader.loadDependency, function (err) {
            if (err)
                console.log(err);
            callback(err);
        });
    };
    return DependencyLoader;
})();
module.exports = DependencyLoader;
