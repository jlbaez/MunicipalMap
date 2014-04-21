/*global document, require, XMLHttpRequest, setTimeout, sessionStorage, window, navigator, location, alert, f_getAliases, formatResult, M_meri, DynamicLayerHost, tool_selected: true, f_parcel_selection_exec, f_map_identify_exec, navToolbar, f_button_clicked, f_deviceCheck, Navigation, legendLayers, legendDigit, userName*/
//==========================================
// Title:  Municipal Map ERIS V.3
// Author: Jose Baez
// Date:   11 Nov 2013
//=========================================
var ERISLAYERS,
	DynamicLayerHost = "http://webmaps.njmeadowlands.gov";
function getErisLayers() {
	var data,
		index,
		json = {},
		xmlhttp = new XMLHttpRequest();
	json.layers = [];
	json.tables = {};
	json.ident = "";
	xmlhttp.open("GET", DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/?f=json&pretty=true", false);
	xmlhttp.send();
	if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
		data = JSON.parse(xmlhttp.responseText);
		for (index = 0; index < data.layers.length; index += 1) {
			json.layers.push({
				id: data.layers[index].id,
				name: data.layers[index].name,
				vis: data.layers[index].defaultVisibility
			});
			if (data.layers[index].name.toLowerCase() === "building rtk") {
				json.ident = data.layers[index].id;
			}
		}
		for (index = 0; index < data.tables.length; index += 1) {
			json.tables[data.tables[index].name.replace(/\./g, "_")] = data.tables[index].id;
		}
		return json;
	}
}
ERISLAYERS = getErisLayers();
function loadErisTools() {
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
function urlExists(url) {
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
function queryRtkIdsResults(featureSets, bid, mapevent) {
	"use strict";
		var	att,
			aliases = f_getAliases(),
			exclude = [],
			featureAttributes,
			featureSet,
			rtkfields = ["FACILITY_NAME", "PHYSICAL_ADDRESS", "PHYSICAL_CITY", "PHYSICAL_ZIP", "COMPANY_CONTACT", "CONTACT_PHONE", "OFFICIAL_CONTACT", "OFFICIAL_PHONE", "EMERGENCY_CONTACT", "EMERGENCY_PHONE"],
			mainrtk = ["CAS_NUMBER", "LOCATION"],
			substance_no,
			substance_name,
			record_main,
			index = 0,
			index2,
			old_index = 0,
			length,
			popupcontent = document.createElement("div"),
			popupview = document.createElement("div"),
			table = document.createElement("table"),
			tablebody = document.createElement("tbody"),
			nextarrow = document.getElementsByClassName("titleButton arrow")[0],
			tablerow;
		popupcontent.className = "esriViewPopup";
		popupview.className = "mainSection";
		table.className = "attrTable ident_table";
		table.cellSpacing = "0";
		table.cellPadding = "0";
		tablebody.innerHTML += '<tr class="verticaltop"><td class="attrValue"><a href="http://apps.njmeadowlands.gov/ERIS/?b=' + bid + '&a=planning" target="_blank">View Building Info</a></td></tr>';
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
							if (rtkfields.indexOf(att) !== -1 && featureAttributes[att] !== null && exclude.indexOf(att) === -1) {
								tablerow = document.createElement("tr");
								exclude.push(att);
								tablerow.innerHTML = '<td class="attrName">' + aliases.fieldNames[att] + ':</td>';
								tablerow.innerHTML += '<td class="attrValue">' + featureAttributes[att] + '</td>';
								tablebody.appendChild(tablerow);
							}
							if (rtkfields.indexOf(att) === -1) {
								if (mainrtk.indexOf(att) !== -1) {
									record_main.push(featureAttributes[att]);
								}
							}
						}
					}
				}
				for (index = 0; index < substance_name.length; index += 1) {
					tablerow.classList.add("verticaltop");
					tablebody.appendChild(tablerow);
					if (substance_no[index].SUBSTANCE_NO !== null & urlExists('http://webmaps.njmeadowlands.gov/municipal/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf')) {
						tablerow.innerHTML = '<td class="attrName"><a href="http://webmaps.njmeadowlands.gov/municipal/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" target="_blank"><strong>' + substance_name[index].SUBSTANCE_NAME + '</strong></a>';
					} else {
						tablerow.innerHTML = '<td class="attrName"><a href="http://webmaps.njmeadowlands.gov/municipal/ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" onclick="return false;"><strong>' + substance_name[index].SUBSTANCE_NAME + '</strong></a>';
					}
					for (index2 = old_index; index2 < old_index + 1; index2 += 2) {
						if(record_main[index2] === null) {
							record_main[index2] = "Not available";
						}
						if (record_main[index2] !== "") {
							tablebody.innerHTML += '<tr style="vertical-align: top;"><td class="attrName">CAS Number:</td><td class="attrValue">' + record_main[index2].toLowerCase() + '</td>';
						}
						if (record_main[index2 + 1] !== "") {
							tablebody.innerHTML += '<tr style="vertical-align: top;"><td class="attrName">Location:</td><td class="attrValue select_option">' + record_main[index2 +1].toLowerCase() + '</td>';
						}
					}
					old_index = index2;
				}
			}
		}
		table.appendChild(tablebody);
		popupview.appendChild(table);
		popupcontent.appendChild(popupview);
		M_meri.infoWindow.clearFeatures();
		M_meri.infoWindow.setTitle("ERIS Selection");
		M_meri.infoWindow.setContent(popupcontent);
		M_meri.infoWindow.show(mapevent.mapPoint);
		if (nextarrow !== undefined) {
			nextarrow.classList.toggle("hidden", false);
			document.getElementsByClassName("esriMobileNavigationItem right1")[0].classList.add("none");
			document.getElementsByClassName("esriMobileNavigationItem right2")[0].classList.add("none");
		}
}
function erisSelectionExec(map_event) {
	"use strict";
	require(["esri/tasks/query", "esri/tasks/QueryTask", "esri/tasks/RelationshipQuery"], function (Query, QueryTask, RelationshipQuery) {
		var eristask = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERISLAYERS.ident),
			biditermediatetask = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERISLAYERS.tables.gis_SDE_TBL_CAD_BLD_INTERMEDIATE),
			rtkidstask = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer/" + ERISLAYERS.tables.gis_SDE_TBL_CAD_BLD_INTERMEDIATE),
			erisquery = new Query(),
			biditermediatequery = new Query(),
			rtkidsquery = new RelationshipQuery(),
			nextarrow = document.getElementsByClassName("titleButton arrow")[0];
		erisquery.returnGeometry = true;
		erisquery.outFields = ["BID", "MUNICIPALITY"];
		erisquery.geometry = map_event.mapPoint;
		biditermediatequery.returnGeometry = true;
		biditermediatequery.outFields = ["*"];
		rtkidsquery.returnGeometry = true;
		rtkidsquery.relationshipId = 4;
		rtkidsquery.outFields = ["*"];
		eristask.execute(erisquery, function (results) {
			var bid = results.features[0].attributes.BID,
				erislink;
			biditermediatequery.text = bid;
			biditermediatetask.executeForIds(biditermediatequery, function (results) {
				if (results) {
					erislink = '<span class="ERIS_LINK"><a href="http://apps.njmeadowlands.gov/ERIS/?b=' + bid + '&a=planning" target="_blank">View Building Info</a></span>';
					if (results.length === 0) {
						M_meri.infoWindow.clearFeatures();
						M_meri.infoWindow.setTitle("ERIS Selection");
						M_meri.infoWindow.setContent(erislink);
						if (nextarrow !== undefined) {
							nextarrow.classList.toggle("hidden", false);
							document.getElementsByClassName("esriMobileNavigationItem right1")[0].classList.add("none");
							document.getElementsByClassName("esriMobileNavigationItem right2")[0].classList.add("none");
						}
						M_meri.infoWindow.show(map_event.mapPoint);
					} else {
						rtkidsquery.objectIds = [results];
						rtkidsquery.relationshipId = ERISLAYERS.tables.gis_SDE_TBL_CAD_RTK;
						rtkidstask.executeRelationshipQuery(rtkidsquery, function (results) {
							queryRtkIdsResults(results, bid, map_event);
						}, function(error){console.log(error);});
					}
				}
			});
		});
	});
}
function erisListUpdate(checkbox) {
	"use strict";
	var visiblelayers = M_meri.getLayer("ERIS_base").visibleLayers;
	if (checkbox.checked) {
		checkbox.parentNode.parentNode.className = "toc_layer_li li_checked";
		visiblelayers.push(parseInt(checkbox.value, 10));
	} else {
		checkbox.parentNode.parentNode.className = "toc_layer_li";
		visiblelayers.splice(visiblelayers.indexOf(parseInt(checkbox.value, 10)), 1);
	}
	if (visiblelayers.length === 0) {
			visiblelayers.push(-1);
	}
	M_meri.getLayer("ERIS_base").setVisibleLayers(visiblelayers);
}
function addErisLayerUpdate(checkbox) {
	checkbox.addEventListener("change", function() {
		erisListUpdate(this);
		legendDigit.refresh();
	});
}
function erisListBuild() {
	"use strict";
	var dropdown1 = document.getElementById("dropdown1"),
		checkbox,
		fragment = document.createDocumentFragment(),
		index,
		label,
		layers = ERISLAYERS.layers,
		length = layers.length,
		li;
	dropdown1.innerHTML += '<li class="layer_group_title">ERIS Layers:</li>';
	for (index = 0; index < length; index += 1) {
		li = document.createElement("li");
		checkbox = document.createElement("input");
		label = document.createElement("label");
		li.className = "toc_layer_li";
		checkbox.type = "checkbox";
		checkbox.className = "ERIS_layer_check ERIS_layer";
		checkbox.value = layers[index].id;
		addErisLayerUpdate(checkbox);
		if (layers[index].vis) {
			checkbox.checked = true;
			li.className = "toc_layer_li li_checked";
		}
		label.className = "toc_layer_label";
		label.innerHTML = layers[index].name.toLowerCase();
		label.appendChild(checkbox);
		li.appendChild(label);
		fragment.appendChild(li);
	}
	dropdown1.appendChild(fragment);
}
function startupEris() {
	"use strict";
	document.getElementById("useraccount").innerHTML = userName;
	require(["esri/layers/ArcGISDynamicMapServiceLayer", "dojo/domReady!"], function (ArcGISDynamicMapServiceLayer) {
		var erisbase = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer", {opacity: 1, id: "ERIS_base"});
		M_meri.addLayer(erisbase);
		erisListBuild();
		loadErisTools();
		legendLayers.push({layer: erisbase, title: "ERIS Layers"});
	});
}
