var fs = require("fs");
var request = require("request");
var config = {};

function main(cb)
{
	load(function ()
	{
		if (!config.minecraft)
		{
			config.minecraft = {
				uuid: "",
				username: "",
				password: "",
				accessToken: "",
				clientToken: ""
			};
		}
		
		cb();
	});
}

function checkAccessToken(cb)
{
	request.post(
	{
		url: "https://authserver.mojang.com/validate",
		json:
		{
			accessToken: config.minecraft.accessToken
		}
	}, function (error, response, body)
	{
		cb(response.statusCode == 204);
	});
}

function load(cb)
{
	fs.readFile("config.json", function (err, data)
	{
		if (err) throw err;
		config = JSON.parse(data);
		if (cb) cb();
	});
}

function save()
{
	fs.writeFile("config.json", JSON.stringify(config, null, "\t"), function (err)
	{
		if (err) throw err;
	});
}
