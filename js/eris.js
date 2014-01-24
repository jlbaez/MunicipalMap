/*global document, require, XMLHttpRequest, setTimeout, sessionStorage, window, navigator, location, alert, f_getAliases, formatResult, M_meri, DynamicLayerHost, tool_selected: true, f_parcel_selection_exec, f_map_identify_exec, navToolbar, f_button_clicked, f_deviceCheck, Navigation, legendLayers, legendDigit*/
//==========================================
// Title:  Municipal Map ERIS V.3
// Author: Jose Baez
// Date:   11 Nov 2013
//=========================================
var ERIS = true,
	ERIS_layers;
function f_get_ERIS_Layers() {
	var xmlhttp = new XMLHttpRequest(),
		data,
		index,
		json = [];
	json.push({
		layers: [],
		tables: [],
		ident: ""
	});
	xmlhttp.open("GET", DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/?f=json&pretty=true", false);
	xmlhttp.send();
	if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
		data = JSON.parse(xmlhttp.responseText);
		for (index = 0; index < data.layers.length; index += 1) {
			json[0].layers.push({
				id: data.layers[index].id,
				name: data.layers[index].name,
				vis: data.layers[index].defaultVisibility
			});
			if (data.layers[index].name.toLowerCase() === "building rtk") {
				json[0].ident = data.layers[index].id;
			}
		}
		for (index = 0; index < data.tables.length; index += 1) {
			json[0].tables.push({
				id: data.tables[index].id,
				name: data.tables[index].name,
			});
		}
		return json;
	}
}
ERIS_layers = f_get_ERIS_Layers();
function f_load_ERIS_tools() {
	"use strict";
	require(["esri/toolbars/navigation", "dojo/domReady!"], function (Navigation) {
		document.getElementById("ERIS").addEventListener("click", function () {
			navToolbar.activate(Navigation.PAN);
			tool_selected = 'ERIS_Identify';
			f_button_clicked("ERIS");
		});
		document.getElementById("form_logoff").addEventListener("submit", function () {
				sessionStorage.clear();
				document.cookie = "NJMC_MERI_ERIS" + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=.njmeadowlands.gov';
				document.cookie = "NJMC_MERI_ERIS" + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=localhost';
				document.location.reload(true);
		});
	});
}
function inArray(array, value) {
	"use strict";
	var index;
	for (index = 0; index < array.length; index += 1) {
		if (array[index] === value) {
			return true;
		}
	}
	return false;
}
function f_urlExists(url) {
	"use strict";
	var http = new XMLHttpRequest();
	http.open("POST", "php/functions.php", false);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.send("function=checkURL&url=" + url);
	if (http.readyState === 4 && http.status === 200) {
		if (parseInt(http.responseText, 10) === 1) {
			return true;
		}
		return false;
	}
}
function f_query_RTK_IDS_results(featureSets, bid, map_event) {
	"use strict";
		var	ONCE_FLDS_RTK = ["FACILITY_NAME", "PHYSICAL_ADDRESS", "PHYSICAL_CITY", "PHYSICAL_ZIP", "COMPANY_CONTACT", "CONTACT_PHONE", "OFFICIAL_CONTACT", "OFFICIAL_PHONE", "EMERGENCY_CONTACT", "EMERGENCY_PHONE"],
			MAIN_RTK = ["CAS_NUMBER", "LOCATION"],
			featureAttributes,
			ERIS_LINK = 'http://apps.njmeadowlands.gov/ERIS/?b=' + bid + '&a=planning',
			substance_no,
			substance_name,
			record_main,
			index = 0,
			index2,
			old_index = 0,
			length,
			exclude = [],
			att,
			featureSet,
			el_popup_content = document.createElement("div"),
			el_popup_view = document.createElement("div"),
			e_table = document.createElement("table"),
			e_tr = document.createElement("tr"),
			e_tbody = document.createElement("tbody"),
			e_td = document.createElement("td"),
			next_arrow = document.getElementsByClassName("titleButton arrow")[0],
			aliases = f_getAliases(),
			e_tr2,
			e_tr3;
		el_popup_content.className = "esriViewPopup";
		el_popup_view.className = "mainSection";
		el_popup_content.appendChild(el_popup_view);
		e_table.className = "attrTable ident_table";
		e_table.cellSpacing = "0";
		e_table.cellPadding = "0";
		el_popup_view.appendChild(e_table);
		e_table.appendChild(e_tbody);
		e_tr.style.verticalAlign = "top";
		e_tbody.appendChild(e_tr);
		e_td.className = "attrValue";
		e_td.innerHTML = '<a href="' + ERIS_LINK + '" target="_blank">View Building Info</a>';
		e_tr.appendChild(e_td);
		for (featureSet in featureSets) {
			if (featureSets.hasOwnProperty(featureSet)) {
				substance_no = [];
				substance_name = [];
				record_main = [];
				for (index = 0, length = featureSets[featureSet].features.length; index < length; index += 1) {
					featureAttributes = featureSets[featureSet].features[index].attributes;
					for (att in featureAttributes) {
						if (featureAttributes.hasOwnProperty(att)) {
							if (att === 'SUBSTANCE_NAME') {
								substance_name.push({"SUBSTANCE_NAME": featureAttributes[att]});
							}
							if (att === 'RTK_SUBSTANCE_NUMBER') {
								substance_no.push({"SUBSTANCE_NO": featureAttributes[att]});
							}
							if (inArray(ONCE_FLDS_RTK, att) && featureAttributes[att] !== null && !inArray(exclude, att)) {
								e_tr2 = document.createElement("tr");
								e_tr2.style.verticalAlign = "top";
								e_tbody.appendChild(e_tr2);
								exclude.push(att);
								e_tr2.innerHTML = '<td class="attrName">' + aliases.fieldNames[att] + ':</td>';
								e_tr2.innerHTML += '<td class="attrValue">' + featureAttributes[att] + '</td>';
							}
							if (!inArray(ONCE_FLDS_RTK, att)) {
								if (inArray(MAIN_RTK, att)) {
									record_main.push(featureAttributes[att]);
								}
							}
						}
					}
				}
				for (index = 0; index < substance_name.length; index += 1) {
					e_tr2 = document.createElement("tr");
					e_tr2.style.verticalAlign = "top";
					e_tbody.appendChild(e_tr2);
					if (f_urlExists('http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf')) {
						e_tr2.innerHTML = '<td class="attrName"><a href="http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" target="_blank"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>';
						e_tr2.innerHTML = '<td class="attrName"><a href="http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" onclick="return false;"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>';
					}
					for (index2 = old_index; index2 < old_index + 1; index2 += 2) {
						if (record_main[index2] !== "") {
							e_tr3 = document.createElement("tr");
							e_tr3.style.verticalAlign = "top";
							e_tbody.appendChild(e_tr3);
							e_tr3.innerHTML = '<td class="attrName">CAS Number:</td>';
							e_tr3.innerHTML += '<td class="attrValue">' + record_main[index2] + '</td>';
						}
						if (record_main[index2 + 1] !== "") {
							e_tr3 = document.createElement("tr");
							e_tr3.style.verticalAlign = "top";
							e_tbody.appendChild(e_tr3);
							e_tr3.innerHTML += '<td class="attrName">Location:</td>';
							e_tr3.innerHTML += '<td class="attrValue">' + record_main[index2 + 1] + '</td>';
						}
					}
					old_index = index2;
				}
			}
		}
		M_meri.infoWindow.clearFeatures();
		M_meri.infoWindow.setTitle("ERIS Selection");
		M_meri.infoWindow.setContent(el_popup_content);
		M_meri.infoWindow.show(map_event.mapPoint);
		if (next_arrow !== undefined) {
			next_arrow.style.display = "block";
			document.getElementsByClassName("esriMobileNavigationItem right1")[0].style.display = "none";
			document.getElementsByClassName("esriMobileNavigationItem right2")[0].style.display = "none";
		}
}
function f_ERIS_selection_exec(map_event) {
	"use strict";
	document.getElementById("map_container").style.cursor = "progress";
	require(["esri/tasks/query", "esri/tasks/QueryTask", "esri/tasks/RelationshipQuery"], function (Query, QueryTask, RelationshipQuery) {
		var QT_ERIS_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERIS_layers[0].ident),
			QT_ERIS_BIDtoINTERMEDIATE = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERIS_layers[0].tables[ERIS_layers[0].tables.length - 1].id),
			QT_Q_RTK_IDS = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERIS_layers[0].tables[ERIS_layers[0].tables.length - 1].id),
			Q_ERIS_selection = new Query(),
			Q_ERIS_BIDtoINTERMEDIATE = new Query(),
			Q_RTK_IDS = new RelationshipQuery(),
			next_arrow = document.getElementsByClassName("titleButton arrow")[0];
		Q_ERIS_selection.returnGeometry = true;
		Q_ERIS_selection.outFields = ["BID", "MUNICIPALITY"];
		Q_ERIS_selection.geometry = map_event.mapPoint;
		Q_ERIS_BIDtoINTERMEDIATE.returnGeometry = true;
		Q_ERIS_BIDtoINTERMEDIATE.outFields = ["*"];
		Q_RTK_IDS.returnGeometry = true;
		Q_RTK_IDS.relationshipId = 4;
		Q_RTK_IDS.outFields = ["*"];
		QT_ERIS_selection.execute(Q_ERIS_selection, function (results) {
			var bid = results.features[0].attributes.BID;
			Q_ERIS_BIDtoINTERMEDIATE.text = bid;
			QT_ERIS_BIDtoINTERMEDIATE.executeForIds(Q_ERIS_BIDtoINTERMEDIATE, function (results) {
				if (results) {
					var ERIS_LINK = 'http://apps.njmeadowlands.gov/ERIS/?b=' + bid + '&a=planning';
					ERIS_LINK = '<span class="ERIS_LINK"><a href="' + ERIS_LINK + '" target="_blank">View Building Info</a></span>';
					if (results.length === 0) {
						M_meri.infoWindow.clearFeatures();
						M_meri.infoWindow.setTitle("ERIS Selection");
						M_meri.infoWindow.setContent(ERIS_LINK);
						if (next_arrow !== undefined) {
							next_arrow.style.display = "block";
							document.getElementsByClassName("esriMobileNavigationItem right1")[0].style.display = "none";
							document.getElementsByClassName("esriMobileNavigationItem right2")[0].style.display = "none";
						}
						M_meri.infoWindow.show(map_event.mapPoint);
					} else {
						Q_RTK_IDS.objectIds = [results];
						QT_Q_RTK_IDS.executeRelationshipQuery(Q_RTK_IDS, function (results) {
							f_query_RTK_IDS_results(results, bid, map_event);
						});
					}
				}
			});
		});
	});
	document.getElementById("map_container").style.cursor = "default";
}
function f_map_click_handler_ERIS(evt_click) {
	"use strict";
	switch (tool_selected) {
	case "parcel":
		f_parcel_selection_exec(evt_click);
		break;
	case "identify":
		f_map_identify_exec(evt_click);
		break;
	case "ERIS_Identify":
		f_ERIS_selection_exec(evt_click);
		break;
	case "pan":
		break;
	}
}
function f_ERIS_list_update(checkbox) {
	"use strict";
	var LD_visible = M_meri.getLayer("ERIS_base").visibleLayers;
	if (checkbox.checked) {
		checkbox.parentNode.parentNode.className = "toc_layer_li li_checked";
		LD_visible.push(parseInt(checkbox.value, 10));
	} else {
		checkbox.parentNode.parentNode.className = "toc_layer_li";
		console.log(LD_visible.indexOf(parseInt(checkbox.value, 10)));
		LD_visible.splice(LD_visible.indexOf(parseInt(checkbox.value, 10)), 1);
	}
	if (LD_visible.length === 0) {
			LD_visible.push(-1);
	}
	M_meri.getLayer("ERIS_base").setVisibleLayers(LD_visible);
}
function f_add_ERIS_layer_update(e_chk) {
	e_chk.addEventListener("change", function(e) {
		f_ERIS_list_update(this);
		legendDigit.refresh();
		e.preventDefault();
	});
}
function f_ERIS_list_build() {
	"use strict";
	var li = document.createElement("li"),
		index,
		dropdown1 = document.getElementById("dropdown1"),
		layers_json = ERIS_layers[0].layers,
		e_li,
		e_chk,
		e_la;
	li.className = "layer_group_title";
	li.innerHTML = "ERIS Layers:";
	dropdown1.insertBefore(li, dropdown1.getElementsByTagName("layer_group_title")[0]);
	for (index = 0; index <layers_json.length; index += 1) {
		e_li = document.createElement("li");
		e_chk = document.createElement("input");
		e_la = document.createElement("label");
		e_li.className = "toc_layer_li";
		e_chk.type = "checkbox";
		e_chk.className = "ERIS_layer_check ERIS_layer";
		e_chk.value = layers_json[index].id;
		f_add_ERIS_layer_update(e_chk);
		if (layers_json[index].vis) {
			e_chk.checked = true;
			e_li.className = "toc_layer_li li_checked";
		}
		e_la.className = "toc_layer_label";
		e_la.innerHTML = layers_json[index].name.toLowerCase();
		e_la.appendChild(e_chk);
		e_li.appendChild(e_la);
		dropdown1.appendChild(e_li);
		}
}
function f_startup_eris() {
	"use strict";
	document.getElementById("useraccount").innerHTML = sessionStorage.username;
	require(["esri/layers/ArcGISDynamicMapServiceLayer", "dojo/on", "dojo/domReady!"], function (ArcGISDynamicMapServiceLayer, on) {
		var ERIS_base = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer", {opacity: 1, id: "ERIS_base"});
		M_meri.addLayer(ERIS_base);
		M_meri.getLayer("LD_button").setVisibleLayers(["1", "2", "3", "4", "11", "12", "13", "14", "17", "18", "19", "20", "21"]);
		on.once(ERIS_base, "load", function () {
			f_ERIS_list_build();
		});
		f_load_ERIS_tools();
		legendLayers.push({layer: ERIS_base, title: "ERIS Layers"});
	});
}
f_deviceCheck("ERIS");
