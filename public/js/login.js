function checkSelected()
{
	$("input[name='profile']").each(function()
	{
		$(this).parent().removeClass("active");
		if($(this).prop('checked')) $(this).parent().addClass("active");
	});
}

function login(uuid)
{
	if(uuid && config.users[uuid])
	{
		selectProfile(uuid);
		checkAccessToken(function(valid)
		{
			if(valid)
				launch(function() {});
			else
			{
				generateAccessToken(config.minecraft.username, config.minecraft.password, function(valid)
				{
					if(valid)
						launch(function() {});
					else
					{
						delete config.users[uuid];
						loadLogin(function() {});
						alert("Invalid credentials! Please login again.");
					}
				});
			}
		});
	}
	else
	{
		alert("Please select a profile!");
	}
}
