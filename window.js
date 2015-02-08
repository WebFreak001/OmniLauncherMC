var request = require("request");

window.onload = function ()
{
	try
	{
		// Init Script here
		//main(function ()
		//{
		require("nw.gui")
			.Window.get()
			.show();
		//});
	}
	catch (e)
	{
		require("nw.gui")
			.Window.get()
			.show();
		throw e;
	}
};
