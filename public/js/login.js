var isLogging = false;
var isAuthing = false;
var loginButton, playButton;

function auth(save)
{
	if (!isAuthing)
	{
		loginButton.start();
		isAuthing = true;
		generateAccessToken(save, $('#username')
			.val(), $('#password')
			.val(),
			function (valid)
			{
				if (valid)
				{
					launch();
				}
				else
				{
					loginButton.stop();
					isAuthing = false;
					alert('Incorrect credentials!');
				}
			});
	}
}

function checkSelected()
{
	$("input[name='profile']")
		.each(function ()
		{
			$(this)
				.parent()
				.removeClass("active");
			if ($(this)
				.prop('checked')) $(this)
				.parent()
				.addClass("active");
		});
}

function login(uuid)
{
	if (uuid && config.users[uuid])
	{
		if (!isLogging)
		{
			playButton.start();
			isLogging = true;
			selectProfile(uuid);
			checkAccessToken(function (valid)
			{
				if (valid)
					launch(function () {});
				else
				{
					generateAccessToken(config.minecraft.username, config.minecraft.password, function (valid)
					{
						if (valid)
							launch(function () {});
						else
						{
							delete config.users[uuid];
							loadLogin(function () {});
							isLogging = false;
							playButton.stop();
							alert("Invalid credentials! Please login again.");
						}
					});
				}
			});
		}
	}
	else
	{
		isLogging = false;
		playButton.stop();
		alert("Please select a profile!");
	}
}

loginButton = Ladda.create(document.querySelector('#loginBtn'));
playButton = Ladda.create(document.querySelector('#playBtn'));
