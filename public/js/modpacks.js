var mcStatus;
var lastStatusCheck = 0;
var Launcher = require("./public/js/minecraft-launcher.js");
var gui = require("nw.gui");
var mcID = 0;

function loadModPacks()
{
	$("#packs").html('<div class="pack defaultAdd" onclick="showPackDialog();" title="Create Pack"><div class="text">CREATE PACK</div><div class="clear"></div></div>');
	for (var i = config.packs.length - 1; i >= 0; i--)
	{
		$("#packs").prepend("<div class='pack' id='pack" + i +
			"' onclick='selectPack(" + i +
			")' style='background-image: url(" + config.packs[i].background +
			")' title='" + config.packs[i].name +
			"' oncontextmenu='event.preventDefault(); showContext(event.x, event.y, " + i + ")'><div class='text'>" + config.packs[i].name +
			"</div><div class='clear'></div><div class='config fa fa-cog' onclick='event.stopPropagation(); configPack(" + i +
			")'></div></div>");
	}
}

function showContext(x, y, id)
{
	var menu = new gui.Menu();

	var edit = new gui.MenuItem(
	{
		label: "Edit"
	});
	edit.click = function ()
	{
		configPack(id);
	};

	menu.append(edit);

	var del = new gui.MenuItem(
	{
		label: "Delete"
	});
	del.click = function ()
	{
		config.packs.splice(id, 1);
		save();
		ajax("views/main.html");
	};

	menu.append(del);
	menu.popup(x, y);
}

function configPack(id)
{
	global.packId = id;

	$("#addPack").css(
	{
		display: "block"
	});
	$("#pack-content").html("");
	$("#addPack .modal").addClass("slideInDown");
	setModalActions("save-cancel");
	setModalPage("views/configPack.html", "Configuration for Pack #" + id);
}

function selectPack(id)
{
	var pack = config.packs[id];
	if (pack.type == "vanilla")
	{
		$("#addPack").css(
		{
			display: "block"
		});
		$("#pack-content").html("");
		$("#addPack .modal").addClass("slideInDown");
		setModalActions("import-play-close");
		setModalContent([
			"<div class='vanilla-container'>",
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
			"		<div class='clear'></div>",
			"	</div>",
			"</div>"
		].join("\n"), pack.name, checkStatus);
		mcID = id;
	}
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

function setModalActions(actions)
{
	$(".footer-actions").css(
	{
		display: "none"
	});
	$("#modal-" + actions).css(
	{
		display: "block"
	});
}

function setModalTitle(title)
{
	$("#pack-title").text(title);
}

function setModalPage(page, title)
{
	setModalTitle(title);
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

function setModalContent(content, title, cb)
{
	setModalTitle(title);
	$("#pack-content").removeAttr("class");
	$("#pack-content").addClass("animated fadeOut");
	setTimeout(function ()
	{
		$("#pack-content").html(content);
		$("#pack-content").removeAttr("class");
		$("#pack-content").addClass("animated fadeIn");
		if (cb) cb();
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
	setModalActions("next-cancel");
	setModalPage("views/createPack.html", "Pack Creation");
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
$("#packs").sortable(
{
	items: ".pack:not(.defaultAdd)",
	stop: function (event, ui)
	{
		var oldPacks = config.packs;
		var newPacks = [];
		var i = 0;
		$("#packs .pack:not(.defaultAdd)").each(function ()
		{
			var id = parseInt(this.id.substr(4));
			this.id = "pack" + i;
			i++;
			newPacks.push(oldPacks[id]);
		});
		config.packs = newPacks;
		save();
	}
});
$("#packs").disableSelection();