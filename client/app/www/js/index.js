$(function () {
	storage.set("polling", false);

	if (!storage.get("qrid")) {
		window.location = "authenticate.html";
	} else {
		window.location = "mainmenu.html";
	}
});
