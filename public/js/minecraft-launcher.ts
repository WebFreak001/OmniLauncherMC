var dependencyLoader = require("./dependency-loader.js");
var request = require("request");
var fs = require("fs");
var async = require("async");
var path = require("path");
var gui = global.window.nwDispatcher.requireNwGui();
var EventEmitter = require('events').EventEmitter;
var spawn = require("child_process").spawn;

class MinecraftLauncher {
    gameConf;
    version;
    folder;
    username;
    uuid;
    accessToken;
    legacy;

    constructor(gameConf, folder, username, uuid, accessToken, legacy) {
        this.gameConf = gameConf;
        this.version = gameConf.id;
        this.folder = folder;
        this.username = username;
        this.uuid = uuid;
        this.accessToken = accessToken;
        this.legacy = legacy;
    }

    start(progress, out, err) {
        var that = this;
        global.logger = new EventEmitter();
        var loggerWindow = gui.Window.open("views/mc-console.html", { show: false, toolbar: false });
        dependencyLoader.loadAll(this.gameConf, function() {
            progress(1);
            global.logger.emit("out", "Downloaded all dependencies");
            if (!fs.existsSync("assets/"))
                fs.mkdirSync("assets/");
            if (!fs.existsSync("assets/indexes/"))
                fs.mkdirSync("assets/indexes/");
            request("https://s3.amazonaws.com/Minecraft.Download/indexes/" + that.gameConf.assets + ".json").pipe(fs.createWriteStream("assets/indexes/" + that.gameConf.assets + ".json")).on("finish", function() {
                progress(2);
                global.logger.emit("out", "Prepared resources");
                that.downloadAssets(that.gameConf.assets, function() {
                    progress(3);
                    global.logger.emit("out", "Downloaded all resources");
                    global.logger.emit("out", "Starting Minecraft...");

                    var args = [];
                    var libs = [];
                    libs.push(that.folder + "/" + that.version + ".jar");
                    for (var i = 0; i < that.gameConf.libraries.length; i++) {
                        var parts = that.gameConf.libraries[i].name.split(":");
                        var folder = parts[0].replace(/\./g, "/");
                        libs.push("lib/libs/" + folder + "/" + parts[1] + "/" + parts[2] + "/" + parts[1] + "-" + parts[2] + ".jar");
                    }
                    console.log(libs);
                    args.push("-Djava.library.path=lib/natives/");
                    args.push("-cp");
                    args.push(libs.join(";"));
                    args.push(that.gameConf.mainClass);

                    var variables = {
                        "auth_player_name": that.username,
                        "version_name": that.gameConf.id,
                        "game_directory": path.resolve("game/"),
                        "assets_root": path.resolve("assets/"),
                        "assets_index_name": that.gameConf.assets,
                        "auth_uuid": that.uuid,
                        "auth_access_token": that.accessToken,
                        "user_properties": "{}",
                        "user_type": that.legacy ? "legacy" : "mojang"
                    };

                    var extraArgs = that.gameConf.minecraftArguments.split(" ");

                    for (var key in variables) {
                        for (var i = 0; i < extraArgs.length; i++)
                            extraArgs[i] = extraArgs[i].replace("${" + key + "}", variables[key]);
                    }

                    for (var i = 0; i < extraArgs.length; i++)
                        args.push(extraArgs[i]);

                    console.log(args);


                    gui.Window.get().hide();

                    var java = spawn("java", args);
                    java.stdout.on("data", function(data) { global.logger.emit("out", data); console.log("OUT: " + data); out(data); });
                    java.stderr.on("data", function(data) { global.logger.emit("err", data); console.log("ERR: " + data); err(data); });
                    java.on("close", function(code) { gui.Window.get().show(); try { loggerWindow.close(); } catch (e) { } console.log("Java closed with error code " + code); });
                });
            });
        });
    }

    downloadAssets(index, cb) {
        var baseFolder = this.folder;
        this.generateFolders(function() {
            fs.readFile("assets/indexes/" + index + ".json", "utf8", function(err, data) {
                if (err) console.log(err);
                var mcassets = JSON.parse(data);
                var assets = [];
                for (var key in mcassets.objects) {
                    assets.push({ name: key, hash: mcassets.objects[key].hash });
                }

                async.eachLimit(assets, 30, function(asset, callback) {
                    fs.exists("assets/objects/" + asset.hash.substr(0, 2) + "/" + asset.hash, function(exists) {
                        if (exists) callback();
                        else {
                            console.log("Downloading " + asset.name);
                            request("http://resources.download.minecraft.net/" + asset.hash.substr(0, 2) + "/" + asset.hash).pipe(fs.createWriteStream("assets/objects/" + asset.hash.substr(0, 2) + "/" + asset.hash)).on("finish", callback);
                        }
                    });
                }, function(err) {
                        if (err) console.log(err);
                        console.log("Downloaded all assets");
                        cb();
                    });
            });
        });
    }

    generateFolders(callback) {
        var folders = [];
        var baseFolder = this.folder;
        for (var i = 0; i < 256; i++)
            folders.push((i.toString(16).length == 1 ? "0" : "") + i.toString(16));
        if (!fs.existsSync("assets/objects/"))
            fs.mkdirSync("assets/objects/")
        async.each(folders, function(folder, cb) {
            fs.exists("assets/objects/" + folder, function(exists) {
                if (!exists)
                    fs.mkdir("assets/objects/" + folder, cb);
                else {
                    cb();
                }
            });
        }, function(err) {
                if (err) console.log("Couldn't create folders! ", err);
                callback();
            });
    }
}

module.exports = MinecraftLauncher;
