var mcStatus;
var lastStatusCheck = 0;
var Launcher = require("./public/js/minecraft-launcher.js");

function loadModPacks()
{
	$("#username").text(config.minecraft.name);
	$("#packs").html("");
	for (var i = 0; i < config.packs.length; i++)
	{
		$("#packs").append("<div class='pack' id='pack" + i + "' style='background-image: url(" + config.packs[i].background + ")' onclick='selectPack(" + i + ")' title='" + config.packs[i].name + "'><img src='" + config.packs[i].thumb + "' alt='" + config.packs[i].type + "'><div class='text'>" + config.packs[i].name + "</div><div class='clear'></div></div>");
	}
	if (config.packs.length === 0)
	{
		$("#packs").html("<span class='desc'>Nothing added. Click the button below to add some modpacks or profiles.</span>");
	}
	else
		selectPack(0);
}

function selectPack(id)
{
	var pack = config.packs[id];
	for (var i = 0; i < config.packs.length; i++)
	{
		$("#pack" + i).removeClass("active");
	}
	$("#pack" + id).addClass("active");
	if (pack.type == "vanilla")
	{
		$("#preview").html([
			"<div class='vanilla-container' style='background-image: url(" + pack.background + ");'>",
			"	<div class='name'>",
			"		<img class='icon' src='" + pack.thumb + "'/>",
			"		" + pack.name,
			"		<div class='badges'>",
			"		" + (pack.modded == "true" ? "<div class='badge'>Modded</div>" : (pack.modded == "false" ? "<div class='badge'>Vanilla</div>" : "")),
			"		<div class='clear'></div>",
			"		</div>",
			"	</div>",
			"	<div class='content'>",
			"		<div class='info'>",
			"		" + pack.description,
			"			<hr>",
			"			<h2>Minecraft Status</h2>",
			"			<div class='status-container'>",
			"				<div class='mc-status' status='minecraft.net'><div class='status'><div class='status-title'>Website</div><div class='status-text'>Checking...</div></div></div>",
			"				<div class='mc-status' status='session.minecraft.net'><div class='status'><div class='status-title'>Sessions</div><div class='status-text'>Checking...</div></div></div>",
			"				<div class='mc-status' status='account.mojang.com'><div class='status'><div class='status-title'>Accounts</div><div class='status-text'>Checking...</div></div></div>",
			"				<div class='mc-status' status='skins.minecraft.net'><div class='status'><div class='status-title'>Skins</div><div class='status-text'>Checking...</div></div></div>",
			"			</div>",
			"			<div class='clear'></div>",
			"		</div>",
			"		<div class='actions'>",
			"			<div class='button tealButton' onclick='startMinecraft(" + id + ")'>PLAY</div>",
			"			<div class='button tealButton' onclick='importLibs()' title='This is necessary if you imported a modded version of Minecraft'>IMPORT LIBRARIES</div>",
			"		</div>",
			"		<div class='clear'></div>",
			"	</div>",
			"</div>"
		].join("\n"));
	}
	checkStatus();
}

function checkStatus()
{
	if (lastStatusCheck < new Date().getTime() - 15000)
	{
		request("https://status.mojang.com/check", function (err, res, body)
		{
			mcStatus = JSON.parse(body);
			displayStatus();
		});
		lastStatusCheck = new Date().getTime();
	}
	else
	{
		displayStatus();
	}
}

function startMinecraft(id)
{
	new Launcher(JSON.parse(fs.readFileSync("versions/" + config.packs[id].directory + "/" + config.packs[id].directory + ".json")), "versions/" + config.packs[id].directory, config.minecraft.name, config.minecraft.uuid, config.minecraft.accessToken, config.minecraft.legacy ? config.minecraft.legacy : false).start(function (progress) {}, function (out) {}, function (err) {});
}

function importLibs()
{
	$("#addPack").css(
	{
		display: "block"
	});
	$("#pack-content").html("");
	$("#addPack .modal").addClass("slideInDown");
	setModalPage("views/importLibs.html");
}

function displayStatus()
{
	try
	{
		if (mcStatus)
			for (var i = 0; i < mcStatus.length; i++)
			{
				if (mcStatus[i] && $("[status='" + Object.keys(mcStatus[i])[0] + "']").length !== 0)
				{
					$("[status='" + Object.keys(mcStatus[i])[0] + "'] .status-text").text(mcStatus[i][Object.keys(mcStatus[i])[0]] == "red" ? "Down" : "Up");
					$("[status='" + Object.keys(mcStatus[i])[0] + "']").attr("class", "mc-status " + mcStatus[i][Object.keys(mcStatus[i])[0]]);
				}
			}
	}
	catch (e)
	{
		$("[status] .status-text").text("Can't check");
		$("[status]").attr("class", "mc-status red");
	}
}

function setModalPage(page)
{
	$("#pack-content").removeAttr("class");
	$("#pack-content").addClass("animated fadeOut");
	setTimeout(function ()
	{
		$("#pack-content").html("");
		$.get(page, function (response)
		{
			$("#pack-content").html(response);
			$("#pack-content").removeAttr("class");
			$("#pack-content").addClass("animated fadeIn");
		});
	}, 1000);
}

function showPackDialog()
{
	$("#addPack").css(
	{
		display: "block"
	});
	$("#pack-content").html("");
	$("#addPack .modal").addClass("slideInDown");
	setModalPage("views/createPack.html");
}

function hidePackDialog()
{
	$("#addPack").css(
	{
		display: "none"
	});
	$("#pack-content").html("");
}

loadModPacks();