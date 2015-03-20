function selectPage(page)
{
	$("#tabs li").removeClass("active");
	$("#tab-" + page).addClass("active");

	$.get("views/" + page + ".html", function (response)
	{
		$("#main-content").html(response);
	});
}

$("#username").text(config.minecraft.name);
selectPage("modpacks");