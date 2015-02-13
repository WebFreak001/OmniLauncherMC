function loadModPacks()
{
	$("#username").text(config.minecraft.name);
	$("#packs").html("");
	for (var i = 0; i < config.packs.length; i++)
	{
		$("#packs").append("<div class='pack' title='" + config.packs[i].name + "'><img src='" + config.packs[i].thumb + "' alt='" + config.packs[i].type + "'><div class='text'>" + config.packs[i].name + "</div><div class='clear'></div></div>");
	}
	if (config.packs.length === 0)
	{
		$("#packs").html("<span class='desc'>Nothing added. Click the button below to add some modpacks or profiles.</span>");
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
