var fs = require("fs");
var path = require("path");
var request = require("request");
var config = {};
var body;

window.ondragover = function (e)
{
	e.preventDefault();
	return false;
};

window.ondrop = function (e)
{
	e.preventDefault();
	return false;
};

if (require("nw.gui").App.argv[0] != "true")
	process.chdir(path.dirname(process.execPath));

function ajax(page, cb)
{
	console.log(page);
	$.get(page, function (response)
	{
		$("body").html(response);
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
			config.minecraft = {};
			save();
		}
		if (!config.users)
		{
			config.users = {};
			save();
		}
		if (!config.packs)
		{
			config.packs = [];
			save();
		}

		if (!config.minecraft.accessToken)
		{
			loadLogin(cb);
		}
		else
		{
			launch(cb);
		}
	});
}

function loadLogin(cb)
{
	ajax("views/login.html", function ()
	{
		if (config.users !=
			{})
		{
			var first = true;
			for (var k in config.users)
			{
				var user = config.users[k];
				if (first)
				{
					$("#profiles").append("<label class='active'><input type='radio' onchange='checkSelected()' name='profile' value='" + k + "' checked>" + user.name + "</label>");
					first = false;
				}
				else
				{
					$("#profiles").append("<label><input type='radio' onchange='checkSelected()' name='profile' value='" + k + "'>" + user.name + "</label>");
				}
			}
		}
		if (cb) cb();
	});
}

function launch(cb)
{
	checkAccessToken(function (valid)
	{
		if (!valid)
			loadLogin(cb);
		else
			ajax("views/main.html", cb);
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
		if (response.statusCode != 204)
			config.minecraft = {};
		if (cb)
			cb(response.statusCode == 204);
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
	save();
}

function logout()
{
	request.post(
	{
		url: "https://authserver.mojang.com/invalidate",
		json:
		{
			"agent":
			{
				"name": "Minecraft",
				"version": 1
			},
			"accessToken": config.minecraft.accessToken,
			"clientToken": config.minecraft.clientToken
		}
	}, function (err, res, body)
	{
		loadLogin();
	});
}

function generateAccessToken(savePw, username, password, cb)
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
		if (!body)
			return cb(false);
		if (body.error)
		{
			if (cb) cb(false);
			return;
		}
		config.users[body.selectedProfile.id] = {
			name: body.selectedProfile.name,
			uuid: body.selectedProfile.id,
			accessToken: body.accessToken,
			clientToken: body.clientToken,
			username: username,
			password: password,
			legacy: body.selectedProfile.legacy
		};
		if (!savePw)
		{
			config.users[body.selectedProfile.id].password = "";
		}
		config.minecraft = config.users[body.selectedProfile.id];
		save();
		if (cb) cb(true);
	});
}

function load(cb)
{
	if (!fs.existsSync("config.json"))
		fs.writeFileSync("config.json", "{}");
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