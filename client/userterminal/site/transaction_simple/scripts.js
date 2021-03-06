var COMMENT_MAXLEN = 300;
var HGC_TR_DECIMAL_PLACES = 2;

// Will be set to QR-ID values when student_identify is called for the relevant section
var current_sender = null;
var current_recipient = null;

handleIdentifyAnswer = function(sectionref, st) {
	if ($(sectionref).closest(".section_incomplete").parent(".recipient").length) {
		$("#recipient_presets").hide()
		$(".section.recipient .section_complete").click(function () {
			$("#recipient_presets").show();
		});
		current_recipient = st.qrid;
	}
	if ($(sectionref).closest(".section_incomplete").parent(".sender").length)
		current_sender = st.qrid;
};

// setTimeout: Wait until private RSA Key was loaded from disk
setTimeout(function () {
	getConfig("tr_comment_maxlen", function (res) {
		COMMENT_MAXLEN = res;
		$("#comment_maxlen").text(COMMENT_MAXLEN);
	});

	getConfig("hgc_tr_decimal_places", function (res) {
		HGC_TR_DECIMAL_PLACES = res;
	});
}, 400);

$(".comment").on("input", function () {
	if ($(".comment").val().length > COMMENT_MAXLEN) {
		$(this).css("box-shadow", "0 0 10px #f33");
		$(".comment_info").css("color", "#f00");
	} else {
		$(this).css("box-shadow", "none");
		$(".comment_info").css("color", "#fff");
	}
});

/* Confirm */
$(".confirm").click(function () {
	$(this).prop("disabled", true);

	if (!current_sender) {
		errorMessage("Der Absender fehlt:<br/>" +
			"Für jede Transaktion muss ein Absender angegeben werden.");
		return;
	}

	if (!current_recipient) {
		errorMessage("Der Empfänger fehlt:<br/>" +
			"Für jede Transaktion muss ein Empfänger angegeben werden.");
		return;
	}

	var amount_str = $(".amount").val().replace(",", ".");

	// Check if amount is parsable
	if (!$.isNumeric(amount_str)) {
		errorMessage("Betrag ist ungültig:<br/>" +
			"Gültige Wert sind z.B.: 1,5 15.3 12e-2 0xa5");
		return;
	}

	var amount = parseFloat(amount_str);

	// Check if amount has more than HGC_TR_DECIMAL_PLACES decimals
	if ((amount * Math.pow(10, HGC_TR_DECIMAL_PLACES)) % 1 !== 0) {
		errorMessage("Betrag enthält mehr als die erlaubten " +
			HGC_TR_DECIMAL_PLACES + " Dezimalstellen.");
		return;
	}

	var comment = $(".comment").val();
	var password = $(".password").val();

	var data = {
		sender : current_sender,
		sender_password : password,
		recipient : current_recipient,
		amount_sent : amount,
		comment : comment
	};

	var server_answered = false;
	action("transaction", data, function (res) {
		server_answered = true;
		switch(res) {
			case "ok":
				$("#success").fadeIn();
				break;

			case "nomoney":
				errorMessage("Guthaben reicht nicht aus!");
				break;

			case "invalid_password":
				errorMessage("Das Passwort ist falsch.");
				break;

			case "invalid_amount":
				errorMessage("Der Betrag muss über 0 HGC liegen.");
				break;

			case "comment_too_long":
				errorMessage("Der Länge des Kommentars überschreitet die " +
					"zugelassenen " + COMMENT_MAXLEN + " Zeichen.");
				break;

			default:
				errorMessage("Unbekannter Fehler: " + res + "<br/>" +
					"Bitte melde diesen Fehler bei der Zentralbank.");
				break;
		}
	});

	setTimeout(function () {
		if (!server_answered)
			errorMessage("Das Währungssystem ist zurzeit nicht verfügbar." +
				"Bitte versuche es später noch einmal.");
	}, 1500);
});

/** QR-ID Presets **/
for (var target_qrid in QRID_PRESETS) {
	var target_name = QRID_PRESETS[target_qrid];
	$('<div class="preset" data-qrid="' + target_qrid + '">')
		.text(target_name).appendTo($("#recipient_presets"));
}

$("#recipient_presets .preset").click(function () {
	var sectionref = $(".section.recipient").children();
	student_identify({qrid : $(this).data("qrid")}, sectionref, function (st) {
		handleIdentifyAnswer(sectionref, st);
	});
});
