var WEBCAM_WIDTH = 800;
var WEBCAM_HEIGHT = 600;

$(function() {

var webcam = document.querySelector("#webcam");
var webcam_shot = document.querySelector("#webcam_shot");

webcam.setAttribute('width', WEBCAM_WIDTH);
webcam.setAttribute('height', WEBCAM_HEIGHT);
webcam_shot.width = WEBCAM_WIDTH;
webcam_shot.height = WEBCAM_HEIGHT;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

function handleVideo(stream) {
	webcam.src = window.URL.createObjectURL(stream);
	$("#webcam_trigger").click(function() {
		webcam_shot.getContext("2d").drawImage(webcam, 0, 0,
			WEBCAM_WIDTH, WEBCAM_HEIGHT);
	});
}

navigator.getUserMedia({video: true}, handleVideo, function (err) {
	$("#webcamerror").show();
});

function update_subclass() {
	var subclass = $("#subclass");
	var mainclass = $("#class");
	subclass.empty();
	if(mainclass.val() == "ks") {
		subclass[0].add(new Option("1", "1"));
		subclass[0].add(new Option("2", "2"));
		subclass.show();
	} else if (mainclass.val() == "teacher" || mainclass.val() == "other" ||
		mainclass.val() == "legalentity" || mainclass.val() == "visitor") {
		subclass[0].add(new Option("none", ""));
		subclass.hide();
	} else {
		subclass[0].add(new Option("a", "a"));
		subclass[0].add(new Option("b", "b"));
		subclass[0].add(new Option("c", "c"));
		subclass[0].add(new Option("d", "d"));
		subclass[0].add(new Option("e", "e"));
		subclass.show();
	}

	if (mainclass.val() == "teacher" || mainclass.val() == "legalentity" ||
			mainclass.val() == "visitor") {
		$("#birth_container").hide();
	} else {
		$("#birth_container").show();
	}

	if (mainclass.val() == "legalentity" || mainclass.val() == "visitor") {
		$("#webcam_container").hide();
		$("#lastname_container").hide();
		$("#firstname_container").hide();
		$("#qrid_container").show();
	} else  {
		$("#webcam_container").show();
		$("#lastname_container").show();
		$("#firstname_container").show();
		$("#qrid_container").hide();
	}

	if (mainclass.val() == "legalentity")
		$("#special_name_container").show();
	else
		$("#special_name_container").hide();

	if (mainclass.val() == "visitor")
		$("#hgc_preload_container").show();
	else
		$("#hgc_preload_container").hide();
}
$("#class").change(update_subclass);
update_subclass();

$("#hgc_preload_value").on("keydown change", function() {
	if (this.value == "enter_value")
		$("#hgc_preload_enter_value").show();
	else
		$("#hgc_preload_enter_value").hide();
});

/*** QR Scan Popup ***/
$("#qr_popup_abort").click(function () {
	$("#qr_popup").fadeOut();
});

$(".qrid_scan").click(function () {
	var qrid_scan_target = $(this).parent().parent().find(".qrid_scan_target");
	QRReader.init("#qr_webcam", "../QRScanJS/");
	$("#qr_popup").fadeIn(100);
	QRReader.scan(function (qrid) {
		$("#qr_popup").fadeOut(100);
		qrid_scan_target.val(qrid);
	});
});

function preload_money() {
	if ($("#class").val() != "visitor") return;

	// Load settings: Account to transfer money from
	var settings;
	try {
		settings = JSON.parse(localStorage.getItem("saeu-settings"));
	} catch (e) {
		alert("Konnte Geld nicht aufladen: Einstellungen fehlen!");
		return;
	}

	var hgc_value = $("#hgc_preload_value").val();
	if (hgc_value == "enter_value")
		hgc_value = $("#hgc_preload_enter_value").val().replace(",", ".");
	var hgc_num = parseFloat(hgc_value);

	var transaction = {
		sender : settings.qrid,
		sender_password : settings.password,
		recipient : $("#qrid").val(),
		amount_sent : hgc_num,
		comment : "Besucher - Aufladung"
	};
	action_cert("transaction_taxfree", transaction, "registration_cert",
			function (res) {
		if (res == "ok") alert(hgc_num + " HGC aufgeladen!");
		else alert("Aufladung schlug fehl, error: " + res);
	});
}

$("#settings_show").click(function () {
	$("#settings_popup").fadeIn();
});

$("#settings_forget").click(function () {
	localStorage.setItem("saeu-settings", "");
	alert("Einstellungen sind vergessen!");
});

$("#settings_ok").click(function () {
	var password = $("#settings_password").val();
	var qrid = $("#settings_qrid").val();
	$("#settings_popup").fadeOut();
	localStorage.setItem("saeu-settings", JSON.stringify({
		password : password,
		qrid : qrid
	}));
});

$("#send").click(function() {
	// If preloading money, make sure the input value is a valid number:
	if ($("#class").val() == "visitor" && $("#hgc_preload_value").val() == "enter_value") {
		if (isNaN(parseFloat($("#hgc_preload_enter_value").val().replace(",", ".")))) {
			alert("Wert für Aufladung ist keine gültige Zahl, abgebrochen!");
			return;
		}
	}

	// Retrieve & Check password before sending anything
	var pwd = $("#password").val();
	if (pwd != $("#password_repeat").val()) {
		alert("Fehler: Die Passwörter stimmen nicht überein.");
		return;
	}

	var pictureData = $("#webcam_shot")[0].toDataURL();
	var picname = (Math.random()*1e17+Math.random()*1e35).toString(36);

	// Send Data
	var rgdat = {
		password : $("#password").val(),
		firstname : $("#firstname").val(),
		lastname : $("#lastname").val(),
		special_name : $("#special_name").val(),
		birthday : $("#birthday").val(),
		birthmonth : $("#birthmonth").val(),
		birthyear : $("#birthyear").val(),
		sclass : $("#class").val(),
		subclass : $("#subclass").val(),
		country : $("#country").val(),
		picname : picname,
		qrid : $("#qrid").val()
	};

	// Send Picture, then API registration, then (optionally) preload money
	webcamserv_upload(picname, pictureData, function (photores) {
		if  (photores !== "ok") {
			alert("Passfoto-Upload-Error: " + photores);
			return;
		}

		action_cert("register_student", rgdat, "registration_cert", function (apires) {
			if (apires !== "ok") {
				alert("Registrierung fehlgeschlagen, API-Fehler: " +
					apires);
				return;
			}

			alert("Registrierung erfolgreich!");
			preload_money();
			$("#main_form")[0].reset();
			webcam_shot.getContext("2d").clearRect(0, 0,
				webcam_shot.width, webcam_shot.height);
			window.scrollTo(0, 0);
		});
	});
});

});
