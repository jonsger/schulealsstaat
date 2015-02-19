$(function () {

function addTableVal (query, name, selector, convert_minutes_to_date) {
	if ($(selector).find(".matters").is(":checked")) {
		if (!convert_minutes_to_date) {
			query[name] = $(selector).find(".value").val();
		} else {
			query[name] = new Date();
			var minutes = parseInt($(selector).find(".value").val());
			if (typeof minutes != "number" || isNaN(minutes)) {
				alert("Ungültiger Wert für Minuten!");
				return;
			}
			query[name] -= minutes * 60 * 1000;
		}
	}
}

function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_transactions (trlist) {
	$("#transactions").html("");
	$("#transactions").append($("<tr>")
		.append($("<th>").text("Zeit"))
		.append($("<th>").text("Absender"))
		.append($("<th>").text("Empfänger"))
		.append($("<th>").text("Brutto"))
		.append($("<th>").text("Netto"))
		.append($("<th>").text("Steuersatz"))
		.append($("<th>").text("Steuer"))
		.append($("<th>").text("Kommentar"))
		.append($("<th>").text("Absender IP"))
	);

	for (var i = 0; i < trlist.length; i++) {
		var tr = trlist[i];
		$("#transactions").append($("<tr>")
			.append($('<td>').text(datetime_readable(tr.time)))
			.append($('<td>').text(tr.sender +
				((typeof tr.sender_country != "undefined") ?
				" (" + country_readable(tr.sender_country) + ")" : "")))
			.append($('<td>').text(tr.recipient +
				((typeof tr.recipient_country != "undefined") ?
				" (" + country_readable(tr.recipient_country) + ")" : "")))
			.append($('<td class="num">').text(tr.amount_sent.toFixed(3)))
			.append($('<td class="num">').text(tr.amount_received.toFixed(3)))
			.append($('<td class="num">').text(tr.percent_tax))
			.append($('<td class="num">').text(tr.amount_tax.toFixed(3)))
			.append($('<td>').append($('<div class="showcomment">')
				.attr("comment-id", i)
				.text("anzeigen")
			))
			.append($("<td>").text(tr.sender_ip))
		);
	}

	$(".showcomment").click(function () {
		$("#comment_text").text(trlist[$(this).attr("comment-id")].comment);
		$("#comment_preview").fadeIn();
	});

	/*** Calculate stats ***/
	var total_sent = 0, total_received = 0, total_tax = 0, total_number = 0;
	var total_comment_length = 0;
	for (var i = 0; i < trlist.length; i++) {
		total_number++;
		var tr = trlist[i];
		total_tax += tr.amount_tax;
		total_sent += tr.amount_sent;
		total_received += tr.amount_received;
		total_comment_length += tr.comment ? tr.comment.length : 0;
	}

	var average_tax = total_number > 0 ? (total_tax / total_number) : 0;
	var average_sent = total_number > 0 ? (total_sent / total_number) : 0;
	var average_received = total_number > 0 ? (total_received / total_number) : 0;
	var average_comment_length = total_number > 0 ? (total_comment_length / total_number) : 0;

	$("#total_number").text(total_number);
	$("#total_tax").text(total_tax.toFixed(3));
	$("#total_sent").text(total_sent.toFixed(3));
	$("#total_received").text(total_received.toFixed(3));
	$("#average_tax").text(average_tax.toFixed(3));
	$("#average_sent").text(average_sent.toFixed(3));
	$("#average_received").text(average_received.toFixed(3));
	$("#total_comment_length").text(total_comment_length);
	$("#average_comment_length").text(average_comment_length);
	$("#stats_container").show();
}

$("#comment_preview_ok").click(function () {
	$("#comment_preview").fadeOut();
});

$("#query").click(function () {
	var amount = $("#n_transactions").val();
	amount = amount == "all" ? -1 : parseInt(amount);
	var payload = {
		amount : amount,
		query : {
			amount_sent : {},
			amount_tax : {},
			time : {}
		}
	};

	// Load query from UI
	addTableVal(payload.query, "sender", "#sender");
	addTableVal(payload.query, "sender_country", "#sender_country");
	addTableVal(payload.query, "recipient", "#recipient");
	addTableVal(payload.query, "recipient_country", "#recipient_country");
	addTableVal(payload.query, "percent_tax", "#percent_tax");
	addTableVal(payload.query.time, "$lt", "#time_before", true);
	addTableVal(payload.query.time, "$gt", "#time_after", true);
	addTableVal(payload.query.amount_sent, "$gt", "#minimal_sent");
	addTableVal(payload.query.amount_sent, "$lt", "#maximal_sent");
	addTableVal(payload.query.amount_tax, "$gt", "#minimal_tax");
	addTableVal(payload.query.amount_tax, "$lt", "#maximal_tax");

	if ($.isEmptyObject(payload.query.amount_sent)) delete payload.query.amount_sent;
	if ($.isEmptyObject(payload.query.amount_tax)) delete payload.query.amount_tax;
	if ($.isEmptyObject(payload.query.time)) delete payload.query.time;

	action_cert("find_transactions", payload, "admin_cert", function (tr) {
		render_transactions(tr);
	});
});

});
