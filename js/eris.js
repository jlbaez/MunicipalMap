/*global document, require, XMLHttpRequest, setTimeout, sessionStorage, window, navigator, location, alert, f_getAliases, formatResult, M_meri, DynamicLayerHost, tool_selected: true, f_parcel_selection_exec, f_map_identify_exec, navToolbar, f_button_clicked, f_li_highlight, f_deviceCheck, Navigation*/
//==========================================
// Title:  Municipal Map ERIS V.3
// Author: Jose Baez
// Date:   11 Nov 2013
//=========================================
var ERIS = true;
function f_load_ERIS_tools() {
	"use strict";
	require(["dojo/on", "esri/toolbars/navigation", "dojo/domReady!"], function (on, Navigation) {
		var ERIS_handler = on(document.getElementById("ERIS"), "click", function (e) {
			navToolbar.activate(Navigation.PAN);
			tool_selected = 'ERIS_Identify';
			f_button_clicked("ERIS");
		}),
			form_logoff_handler = on(document.getElementById("form_logoff"), "submit", function (e) {
				sessionStorage.clear();
				document.cookie = "NJMC_MERI_ERIS" + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=.njmeadowlands.gov';
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
		} else {
			return false;
		}
	}
}
function f_query_RTK_IDS_results(featureSets, bid, map_event) {
	"use strict";
	require(["dojo/dom-construct"], function (domConstruct) {
		var type = "parcel_owners",
			object_attr = "PID",
			s = "",
			ONCE_FLDS_RTK = ["FACILITY_NAME", "PHYSICAL_ADDRESS", "PHYSICAL_CITY", "PHYSICAL_ZIP", "COMPANY_CONTACT", "CONTACT_PHONE", "OFFICIAL_CONTACT", "OFFICIAL_PHONE", "EMERGENCY_CONTACT", "EMERGENCY_PHONE"],
			MAIN_RTK = ["CAS_NUMBER", "Location"],
			FLDS_IGNORE_RTK = ["SUBSTANCE_NAME", "RTK_SUBSTANCE_NUMBER"],
			featureAttributes,
			ERIS_LINK = 'http://apps.njmeadowlands.gov/ERIS/?b=' + bid + '&a=planning',
			RTK_OUTPUT,
			Once_Output,
			Current_Once,
			Prev_Once_Output,
			substance = [],
			substance_no,
			substance_name,
			record_header,
			record_main,
			index = 0,
			index2,
			old_index = 0,
			length,
			exclude = [],
			att,
			featureSet,
			el_popup_content = domConstruct.create("div", {"class": "esriViewPopup"}),
			el_popup_view = domConstruct.create("div", {"class": "mainSection"}, el_popup_content),
			e_table = domConstruct.create("table", {"class": "attrTable ident_table", "cellspacing": "0px", "cellpadding": "0px"}, el_popup_view),
			e_tr,
			e_tbody = domConstruct.create("tbody", null, e_table),
			next_arrow = document.getElementsByClassName("titleButton arrow")[0],
			aliases = f_getAliases();
		e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
		domConstruct.create("td", {"class": "attrValue", "innerHTML": '<a href="' + ERIS_LINK + '" target="_blank">View Building Info</a>'}, e_tr);
		for (featureSet in featureSets) {
			if (featureSets.hasOwnProperty(featureSet)) {
				RTK_OUTPUT = '';
				Once_Output = '';
				Current_Once = '';
				Prev_Once_Output = '';
				substance_no = [];
				substance_name = [];
				record_header = '';
				record_main = [];
				for (index = 0, length = featureSets[featureSet].features.length; index < length; index += 1) {
					featureAttributes = featureSets[featureSet].features[index].attributes;
					RTK_OUTPUT += '<div class="RTK_RECORD">';
					for (att in featureAttributes) {
						if (featureAttributes.hasOwnProperty(att)) {
							if (att === 'SUBSTANCE_NAME') {
								substance_name.push({"SUBSTANCE_NAME": featureAttributes[att]});
							}
							if (att === 'RTK_SUBSTANCE_NUMBER') {
								substance_no.push({"SUBSTANCE_NO": featureAttributes[att]});
							}
							if (inArray(ONCE_FLDS_RTK, att) && featureAttributes[att] !== null && !inArray(exclude, att)) {
								e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
								exclude.push(att);
								domConstruct.create("td", {"class": "attrName", "innerHTML": aliases.fieldNames[att] + ":"}, e_tr);
								domConstruct.create("td", {"class": "attrValue", "innerHTML": featureAttributes[att]}, e_tr);
								Current_Once += formatResult(att, featureAttributes[att], 'RTK');
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
					e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
					if (f_urlExists('http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf')) {
						domConstruct.create("td", {"class": "attrName", "innerHTML": '<a href="http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" target="_blank"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>'}, e_tr);
					} else {
						domConstruct.create("td", {"class": "attrName", "innerHTML": '<a href="http://webmaps.njmeadowlands.gov/municipal/v3/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" onclick="return false;"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>'}, e_tr);
					}
					for (index2 = old_index; index2 < old_index + 1; index2 += 2) {
						if (record_main[index2] !== "") {
							e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
							domConstruct.create("td", {"class": "attrName", "innerHTML": 'CAS Number:'}, e_tr);
							domConstruct.create("td", {"class": "attrValue", "innerHTML": record_main[index2]}, e_tr);
						}
						if (record_main[index2 + 1] !== "") {
							e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
							domConstruct.create("td", {"class": "attrName", "innerHTML": 'Location:'}, e_tr);
							domConstruct.create("td", {"class": "attrValue", "innerHTML": record_main[index2 + 1]}, e_tr);
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
	});
}
function f_ERIS_selection_exec(map_event) {
	"use strict";
	document.getElementById("map_container").style.cursor = "progress";
	require(["esri/tasks/query", "esri/tasks/QueryTask", "esri/tasks/RelationshipQuery"], function (Query, QueryTask, RelationshipQuery) {
		var QT_ERIS_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/3"),
			QT_ERIS_BIDtoINTERMEDIATE = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/5"),
			QT_Q_RTK_IDS = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/5"),
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
			var bid = results.features[0].attributes.BID,
				mun = results.features[0].attributes.MUNICIPALITY;
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
function f_ESRI_list_update() {
	"use strict";
	require(["dojo/query"], function (query) {
		var inputs = query(".ERIS_layer"),
			ERIS_visible = [];
		require(["dojo/_base/array"], function (array) {
			array.forEach(inputs, function (input) {
				if (input.checked) {
					ERIS_visible.push(input.id.replace("ERIS_layer_", ""));
				}
			});
		});
		if (ERIS_visible.length === 0) {
			ERIS_visible.push(-1);
		}
		M_meri.getLayer("ERIS_base").setVisibleLayers(ERIS_visible);
	});
}
function f_ERIS_list_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/dom-attr", "dojo/_base/array", "dojo/request/xhr"], function (domConstruct, domAttr, array, xhr) {
		var map_layers_ERIS_json = {"name": "ERIS",
											 "id": "ERIS",
											 "layers": [{"id": "0", "name": "Mile Markers", "vis": 1, "ident": 0, "desc": "Mile Markers"},
															{"id": "1", "name": "KNOX Boxes", "vis": 1, "ident": 1, "desc": "KNOX Boxes"},
															{"id": "2", "name": "Boat Launches", "vis": 1, "ident": 1, "desc": "Boat Launches"},
															{"id": "3", "name": "Building RTK", "vis": 1, "ident": 0, "desc": "Building RTK"}]
											},
			e_li_title = domConstruct.create("li", {"class": "layer_group_title", "innerHTML": "ERIS Layers:"}, "dropdown1"),
			e_li_legend = domConstruct.create("li", null, "dropdown4"),
			e_legend_ul = domConstruct.create("ul", {"class": "legend_group_title"}, e_li_legend),
			e_legend_title = domConstruct.create("li", {"class": "legend_title", "innerHTML": "ERIS"}, e_legend_ul),
			ERIS_legend;
		xhr(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/legend?f=json", {handleAs: "json", sync: true}).then(function (content) {
			ERIS_legend = content;
		});
		array.forEach(map_layers_ERIS_json.layers, function (layer, index) {
			var e_li = domConstruct.create("li", {"class": "toc_layer_li"}, "dropdown1", "last"),
				e_chk = domConstruct.create("input", {"type": "checkbox", "class": "ERIS_layer_check ERIS_layer", "id": "ERIS_layer_" + layer.id}, e_li),
				e_lbl;
			e_chk.onclick = function () {
				f_ESRI_list_update();
				f_li_highlight(this);
			};
			if (layer.vis) {
				domAttr.set(e_chk, "checked", "checked");
				domAttr.set(e_li, "class", "toc_layer_li li_checked");
			}
			e_lbl = domConstruct.create("label", {"for": "ERIS_layer_" + layer.id, "class": "toc_layer_label", "title": layer.descs, innerHTML: layer.name}, e_li);
			array.forEach(ERIS_legend.layers[layer.id].legend, function (layer_legend) {
				var legend_text = "",
					e_legend;
				if (layer_legend.label !== "") {
					legend_text = layer_legend.label;
				} else {
					legend_text = layer.name;
				}
				e_legend = domConstruct.create("li", {"class": "legend_li legend_li_" + layer.id, "innerHTML": "<img src=\"" + DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/1/images/" + layer_legend.url + "\"class=\"legend_img\" alt=\"error\" /> " + legend_text}, e_legend_ul, "last");
				if (layer.vis !== 1) {
					domAttr.set(e_legend, "style", "display:none");
				}
			});
		});
	});
}
function f_startup_eris() {
	"use strict";
	document.getElementById("useraccount").innerHTML = sessionStorage.username;
	require(["esri/layers/ArcGISDynamicMapServiceLayer", "dojo/on", "dojo/domReady!"], function (ArcGISDynamicMapServiceLayer, on) {
		var ERIS_base = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer", {opacity: 1, id: "ERIS_base"});
		M_meri.addLayer(ERIS_base);
		M_meri.getLayer("LD_button").setVisibleLayers(["1", "2", "3", "4", "11", "12", "13", "14", "17", "18", "19", "20", "21"]);
		on.once(ERIS_base, "load", function (e) {
			f_ERIS_list_build();
		});
		f_load_ERIS_tools();
	});
}
f_deviceCheck("ERIS");