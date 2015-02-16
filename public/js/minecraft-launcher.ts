var dependencyLoader = require("./dependency-loader.js");
var request = require("request");
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;

class MinecraftLauncher {
    gameConf;
    version;
    folder;
    username;
    uuid;
    accessToken;
    legacy;

    constructor(gameConf, version, folder, username, uuid, accessToken, legacy) {
        this.gameConf = gameConf;
        this.version = version;
        this.folder = folder;
        this.username = username;
        this.uuid = uuid;
        this.accessToken = accessToken;
        this.legacy = legacy;
    }

    start(progress, out, err) {
        var that = this;
        dependencyLoader.loadAll(this.gameConf, function() {
            progress(1);
            request("https://s3.amazonaws.com/Minecraft.Download/indexes/" + that.gameConf.assets + ".json").pipe(fs.createWriteStream(that.folder + "/assets/index.json")).on("finish", function() {
                progress(2);
                var args = [];
                var libs = [];
                libs.push(that.folder + "/" + that.version + ".jar");
                for (var i = 0; i < that.gameConf.libraries.length; i++) {
                    var parts = that.gameConf.libraries[i].name.split(":");
                    libs.push("lib/" + parts[1] + "-" + parts[2] + ".jar");
                }
                console.log(libs);
                args.push("-Djava.library.path=lib/natives/");
                args.push("-cp");
                args.push(libs.join(";"));
                args.push(that.gameConf.mainClass);

                var variables = {
                    "auth_player_name": that.username,
                    "version_name": that.gameConf.id,
                    "game_directory": that.folder + "/game/",
                    "assets_root": that.folder + "/assets/assets",
                    "assets_index_name": that.folder + "/assets/index.json",
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

                console.log("'" + args.join("',\n'") + "'");

                var java = spawn("java", args);
                java.stdout.on("data", function(data) { out(data); });
                java.stderr.on("data", function(data) { err(data); });
                java.on("close", function(code) { console.log("Java closed with error code " + code); });
            });
        });
    }
}

module.exports = MinecraftLauncher;
