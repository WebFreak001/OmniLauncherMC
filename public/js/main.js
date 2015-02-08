var fs = require("fs");
var request = require("request");
var config = {};
var body;

function ajax(page, cb)
{
	console.log(page);
	$.get(page, function (response)
	{
		$("body")
			.html(response);
		if (cb) cb();
	});
}

function main(cb)
{
	body = document.getElementsByTagName("body")[0];
	load(function ()
	{
		if (!config.minecraft)
		{
			config.users = {};
			config.minecraft = {};
			save();
		}

		if (!config.minecraft.accessToken)
		{
			ajax("views/login.html", cb);
		}
		else
		{
			checkAccessToken(function (valid)
			{
				if (!valid)
					ajax("views/login.html", cb);
				else
					ajax("views/modpacks.html", cb);
			});
		}
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
		if (cb) cb(response.statusCode == 204);
	});
}

function getProfiles()
{
	var profiles = [];
	for (var name in config.users)
	{
		profiles.push(name);
	}
	return profiles;
}

function selectProfile(id)
{
	if (config.users[id])
		config.minecraft = config.users[id];
}

function generateAccessToken(username, password, cb)
{
	request.post(
	{
		url: "https://authserver.mojang.com/authenticate",
		json:
		{
			"agent":
			{
				"name": "Minecraft",
				"version": 1
			},
			"username": username,
			"password": password
		}
	}, function (error, response, body)
	{
		if (body.error)
		{
			if (cb) cb(false);
			return;
		}
		config.users[body.selectedProfile.id] = {
			display: body.selectedProfile.name,
			uuid: body.selectedProfile.id,
			accessToken: body.accessToken,
			clientToken: body.clientToken,
			username: username,
			password: password
		};
		config.minecraft = config.users[body.selectedProfile.name];
		if (cb) cb(true);
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
