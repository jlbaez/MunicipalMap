/*global require, sessionStorage, document*/
/*
 * Municipal Map V.3 8/2013
 * Jose Baez
 */
var map,
	G_symbol,
	IdentGeometry,
	Q_Census,
	QT_Census,
	image = "",
	parcel_id = sessionStorage.getItem('printPID'),
	parcel_OID,
	dynamicMapServiceLayer,
	map,
	graphic;
var QT_OutFields = {parcel: ["PID",
									  "BLOCK",
									  "LOT",
									  "OLD_BLOCK",
									  "OLD_LOT",
									  "FACILITYNAME",
									  "PROPERTY_ADDRESS",
									  "MAP_ACRES"],
						  land_use: ["LANDUSE_CODE",
										 "QUALIFIER",
										 "MAP_ACRES"],
						  zoning: ["ZONE_CODE",
									  "MAP_ACRES"],
						  owner: ["*"],
						  building: ["FACILITY_NAME",
										 "BUILDING_LOCATION"]};
var DisplayFields = {parcel: {"PID": "PID",
										"PAMS_PIN": "PAMS",
										"BLOCK": "Block",
										"LOT": "Lot",
										"OLD_BLOCK": "Old Block",
										"OLD_LOT": "Old Lot",
										"FACILITYNAME": "Facility Name",
										"PROPERTY_ADDRESS": "Parcel Address",
										"MAP_ACRES": "Acres"},
							land_use: {"LANDUSE_CODE": "Landuse Code",
										  "QUALIFIER": "Qualifier",
										  "MAP_ACRES": "Acres"},
							zoning: {"ZONE_CODE": "Zoning"},
							owner: {"OBJECTID": "OID",
									  "OWNID": "Owner ID",
									  "NAME": "Owner Name",
									  "ADDRESS": "Owner Address",
									  "CITY_STATE": "Owner City, ST",
									  "ZIPCODE": "Owner Zip"},
							building: {"FACILITY_NAME": "Facility Name",
										  "BUILDING_LOCATION": "Location"}};

var aliases = {"zoneCodes":
					{"AV": "Aviation facilities",
					 "CP": "Commercial Park",
					 "EC": "Environmental Conservation",
					 "HI": "Heavy Industrial",
					 "HC": "Highway Commercial",
					 "IA": "Intermodal A",
					 "IB": "Intermodal B",
					 "LIA": "Light Industrial A",
					 "LIB": "Light Industrial B",
					 "LDR": "Low Density Residential",
					 "NC": "Neighborhood Commercial",
					 "PR": "Planned Residential",
					 "PU" : "Public Utilities",
					 "RC": "Regional Commercial",
					 "TC": "Transportation Center",
					 "WR" : "Waterfront Recreation",
					 "RRR" : "Roads, Rails, ROWs",
					 "000" : "Unclassified",
					 "RA" : "Redevelopment Area",
					 "MZ" : "Multiple Zones",
					 "CZC-SECA" : "Commercial Zone C - Secaucus",
					 "LI1-SECA" : "Light Industrial Zone 1 - Secaucus",
					 "RZA-SECA" : "Residential Zone A - Secaucus",
					 "WAT" : "Water",
					 "LID-TET" : "Light Industrial & Distribution Zone - Teterboro",
					 "RA1-TET" : "Redevelopment Area 1 Zone - Teterboro",
					 "RA2-TET" : "Redevelopment Area 2 Zone - Teterboro",
					 "PA" : "Parks and Recreation",
					 "C-CARL" : "Commercial Zone - Carlstadt",
					 "LI-CARL" : "Light Industrial - Carlstadt",
					 "LDR-TET" : "Low Density Residential - Teterboro",
					 "MCZ-CARL" : "Mixed Commercial Zone - Carlstadt",
					 "RZ-CARL" : "Residential Zone - Carlstadt",
					 "RZB-SECA" : "Residential Zone B - Secaucus",
					 "MNF-MOON" : "Manufacturing Zone - Moonachie",
					 "R1-MOON" : "1-Family Residential Zone - Moonachie",
					 "R2-MOON" : "2-Family Residential Zone - Moonachie",
					 "B1-MOON" : "General Business Zone - Moonachie",
					 "B2-MOON" : "Limited Business Zone - Moonachie",
					 "R1-ER" : "Low Density Residential - E Rutherford",
					 "R2-ER" : "Medium Density Residential - E Rutherford",
					 "R3-ER" : "Multi-Family Residential - E Rutherford",
					 "NC-ER" : "Neighborhood Commercial - E Rutherford",
					 "RC-ER" : "Regional Commercial - E Rutherford",
					 "PCD-ER" : "Planned Commercial Development - E Rutherford",
					 "RD1-ER" : "Redevelopment-1 - E Rutherford",
					 "R1-NA" : "1-Family Residential - N Arlington",
					 "R2-NA" : "1&2-Family Residential - N Arlington",
					 "RRRA-NA" : "Ridge Road Redevelopment Area - N Arlington",
					 "PARA-NA" : "Porete Avenue Redevelopment Area - N Arlington",
					 "R3-NA" : "Multi-Family Residential - N Arlington",
					 "I1-NA" : "Light Industrial - N Arlington",
					 "C3-NA" : "Cemetery - N Arlington",
					 "P/OS-NA" : "Parks & Open Space - N Arlington",
					 "W/C-NA" : "Waterways & Creeks - N Arlington",
					 "SEA" : "Sports and Expositions",
					 "I-ER" : "Light Industrial -  E Rutherford",
					 "C2-NA" : "Commercial 2 - N Arlington",
					 "C1-NA" : "Commercial 1 - N Arlington",
					 "R1-RU" : "Single Family Residential - Rutherford",
					 "R1A-RU" : "Single Family Residential - Rutherford",
					 "R1B-RU" : "Single Family Residential - Rutherford",
					 "R2-RU" : "Two Family Residential - Rutherford",
					 "R4-RU" : "Five Story Apartment - Rutherford",
					 "B1-RU" : "Three Story Office - Rutherford",
					 "B2-RU" : "Five Story Office - Rutherford",
					 "B3-RU" : "Three Story Office-Retail - Rutherford",
					 "B3/SH-RU" : "Business / Senior Housing - Rutherford",
					 "B4-RU" : "Business / Light Industrial - Rutherford",
					 "ORD-RU" : "Ten Story Office, Research & Distribution - Rutherford",
					 "HC-RU" : "Highway Commercial Development - Rutherford",
					 "PCD-RU" : "Planned Commercial Development - Rutherford",
					 "R3-RU" : "Three Story Apartment - Rutherford",
					 "UR1A-RU" : "University / Residential, Single Family - Rutherford",
					 "C-RF" : "Commercial - Ridgefield",
					 "C/HRH-RF" : "Commercial / High Rise Hotel - Ridgefield",
					 "GA/TH C-RF" : "GA/TH Cluster - Ridgefield",
					 "LM-RF" : "Light Manufacturing - Ridgefield",
					 "NB-RF" : "Neighborhood Business - Ridgefield",
					 "O/TH-RF" : "Office / T.H. - Ridgefield",
					 "OC-RF" : "Office Commercial - Ridgefield",
					 "OMR-RF" : "Office Mid Rise - Ridgefield",
					 "OMRH-RF" : "Office Mid Rise Hotel - Ridgefield",
					 "OFR-RF" : "One Family Residential - Ridgefield",
					 "P/SP-RF" : "Public / Semi Public - Ridgefield",
					 "TH/SRCH-RF" : "TH / SR Citizens Housing - Ridgefield",
					 "T-RF" : "Townhomes - Ridgefield",
					 "TFR-RF" : "Two Family Residential - Ridgefield",
					 "RB-LF" : "One & Two Family Residential - Little Ferry",
					 "RM-LF" : "Multifamily Residential - Little Ferry",
					 "BH-LF" : "Highway & Regional Business - Little Ferry",
					 "BN-LF" : "Neighborhood Business - Little Ferry",
					 "IR-LF" : "Restricted Industrial - Little Ferry",
					 "IG-LF" : "General Industrial - Little Ferry",
					 "P-LF" : "Public Facilities - Little Ferry",
					 "RA-LF" : "One Family Residential - Little Ferry",
					 "P/SP-NA" : "Public/Semi-Public - N Arlington",
					 "A-SH" : "Residential - South Hackensack",
					 "B-SH" : "Commercial - South Hackensack",
					 "C-SH" : "Industrial - South Hackensack",
					 "M-SH" : "Mixed - South Hackensack",
					 "SCR-SH" : "Senior Citizen Multifamily Res - South Hackensack",
					 "RA-LYND" : "One Family Residence - Lyndhurst",
					 "RB-LYND" : "One and Two Familly Residence - Lyndhurst",
					 "RC-LYND" : "Medium Density Residential - Lyndhurst",
					 "B-LYND" : "Business - Lyndhurst",
					 "M1-LYND" : "Light Industrial - Lyndhurst",
					 "M2-LYND" : "Heavy Industrial - Lyndhurst",
					 "CGI-LYND" : "Commercial-General Industrial - Lyndhurst",
					 "R-1-K" : "One Family Residential - Kearny",
					 "OS-K" : "Open Space Parks and Recreation District - Kearny",
					 "SU-1-K" : "Special Use 1 - Kearny",
					 "SU-3_K" : "Special Use 3 - Kearny",
					 "SOCD-K" : "Street Oriented Commercial District - Kearny",
					 "SKI-N-K" : "South Kearny Industrial North - Kearny",
					 "SKI-S-K" : "South Kearny Industrial South - Kearny",
					 "RDP-K" : "Research Distribution Park - Kearny",
					 "RD-K" : "Residential District - Kearny",
					 "R-A-K" : "Redevelopment Area - Kearny",
					 "R-3-K" : "Multi-Family Residential - Kearny",
					 "R-2B-K" : "One_Two Family Residential/Hospital - Kearny",
					 "R-2-K" : "One_Two Family Residential - Kearny",
					 "PRD-K" : "Planned Residential Development - Kearny",
					 "MXD-K" : "Mixed Use District - Kearny",
					 "MP-K" : "Marshland Preservation - Kearny",
					 "M-K" : "Manufacturing - Kearny",
					 "LTI-K" : "Light Industrial - Kearny",
					 "LID-B-K" : "Light Industrial Distribution B - Kearny",
					 "LID-A-K" : "Light Industrial Distribution A - Kearny",
					 "LCD-K" : "Large Scale Commercial District - Kearny",
					 "H-I-K" : "Heavy Industrial - Kearny",
					 "ESCD-K" : "Existing Shopping Center District - Kearny",
					 "CEM-K" : "Cemetery - Kearny",
					 "C-4-K" : "General Commercial - Kearny",
					 "C-3-K" : "Community Business - Kearny",
					 "C-2-K" : "Neighborhood Business - Kearny",
					 "C-1-K" : "Office - Kearny",
					 "ARLD-K" : "Adaptive Reuse Loft District - Kearny",
					 "ACD-K" : "Automobile Oriented Commercial District - Kearny",
					 "LI-K" : "Limited Industrial- Kearny",
					 "R1-NB" : "Low Density Residential - N Bergen",
					 "R2-NB" : "Intermediate Density Residential - N Bergen",
					 "R3-NB" : "Moderate Density Residential - N Bergen",
					 "C1-NB" : "General Business - N Bergen",
					 "C1A-NB" : "General Business Limited Mixed Use - N Bergen",
					 "C1B-NB" : "General Business Limited Mixed Use Bergenline - N Bergen",
					 "C1C-NB" : "General Business Mixed Use - N Bergen",
					 "C1R-NB" : "Commercial Residential District - N Bergen",
					 "C2-NB" : "Highway Business - N Bergen",
					 "I-NB" : "Industrial - N Bergen",
					 "P1-NB" : "Riverside - N Bergen",
					 "P2-NB" : "Edgecliff - N Bergen",
					 "P3-NB" : "River Road West - N Bergen",
					 "TRD-NB" : "Tonnelle Ave Redevelopment Area - N Bergen",
					 "ET-NB" : "East Side Tonnelle Ave Zone - N Bergen",
					 "GL-NB" : "Granton Ave-Liberty Ave-69th Street Zone - N Bergen",
					 "KO-NB" : "Kennedy Overlay Zone - N Bergen",
					 "TO-NB" : "Townhouse Overlay Zone - N Bergen"},
					"fieldNames":
					{"TMAPNUM": "Tidelands Map #",
					 "FLD_ZONE": "Flood Zone",
					 "STATIC_BFE": "Static BFE(NAPD88)",
					 "STATUS ": "Status",
					 "SFHA_TF": "Special Flood Hazard Area",
					 "FIRM_PAN": "Firm Panel #"},
				  "landUseCodes" :
						{"000": "Unclassified",
						 "AL": "Altered Lands",
						 "CO": "Commercial Office",
						 "CR": "Commercial Retail",
						 "CU": "Communication Utility",
						 "HM": "Hotels and Motels",
						 "ICC": "Ind. Comm. Complex",
						 "IND": "Industrial",
						 "PQP": "Public Services",
						 "RES": "Residential",
						 "RL": "Recreational Land",
						 "TRS": "Transportation",
						 "VAC": "Open Land",
						 "TL": "Transitional Lands",
						 "WAT": "Water",
						 "WET": "Wetlands"}};

function pams_to_old(pin) {
	"use strict";
	if (pin.substr(0, 1) === 0) {
		pin = pin.substr(1);
		pin = pin.replace(/_/g, " ");
		return (pin);
	}
}
function imageExists(id, target_div) {
	"use strict";
	require(["dojo/request/xhr", "dojo/dom-construct"], function (xhr, domConstruct) {
		xhr('../php/functions.php', {
			"method": "POST",
			"data": {
				"PID": id,
				"function": "getPhoto"
			},
			"sync": true
		}).then(function (data) {
			domConstruct.create("img", {"src": data, "class": "property_photo", "alt": "Unable to get Images"}, target_div);
		});
	});
}
function identAlias(a) {
	"use strict";
	if (typeof (aliases.fieldNames[a]) !== "undefined") {
		return aliases.fieldNames[a];
	} else {
		return a;
	}
}
function f_query_parcel_results(results) {
	"use strict";
	var resultFeatures = results.features,
		i,
		il,
		array = [];
	require(["dojo/dom-construct", "esri/geometry/Geometry", "esri/SpatialReference", "dojo/on", "esri/tasks/IdentifyParameters", "esri/tasks/IdentifyTask", "dojo/_base/array"], function (domConstruct, Geometry, SpatialReference, on, IdentifyParameters, IdentifyTask, array) {
		var IP_Map_All = new IdentifyParameters(),
			IT_Map_All = new IdentifyTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Municipal/MunicipalMap_live/MapServer"),
			featureAttributes,
			att,
			parcel_li,
			feature_name,
			identify_fields_json = {14: ["FIRM_PAN"],
											25: ["TMAPNUM", "STATUS "],
											27: ["FLD_ZONE", "STATIC_BFE", "SFHA_TF"]},
			uinfo = document.getElementById("uInfo");
		for (i = 0, il = resultFeatures.length; i < il; i += 1) {
			graphic = resultFeatures[i];
			graphic.setSymbol(G_symbol);
			if (i === 0) {
				IdentGeometry = new Geometry(new SpatialReference({wkid: 3424}));
				IdentGeometry = graphic.geometry;
			}
			featureAttributes = results.features[i].attributes;
			parcel_OID = featureAttributes.oid;
			for (att in featureAttributes) {
				if (featureAttributes.hasOwnProperty(att)) {
					if (featureAttributes[att] !== null && featureAttributes[att] !== "") {
						if (att === "BLOCK") {
							array.block = att;
						} else if (att === "LOT") {
							array.LOT = att;
						}
						parcel_li = domConstruct.create("li", {"innerHTML": ": " + featureAttributes[att], "class": "feature_li"}, "uParcel");
						feature_name = domConstruct.create("strong", {"innerHTML": DisplayFields.parcel[att]}, parcel_li, "first");
					}
					if (att === 'PID') {
						imageExists(featureAttributes[att], 'photo');
					}
				}
			}
			map.graphics.clear();
			map.setExtent(graphic.geometry.getExtent().expand(3), true);
			map.graphics.add(graphic);
		}
		IP_Map_All.tolerance = 0;
		IP_Map_All.returnGeometry = false;
		IP_Map_All.layerIds = [14, 25, 27];
		IP_Map_All.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
		IP_Map_All.width  = map.width;
		IP_Map_All.height = map.height;
		IP_Map_All.geometry = graphic.geometry.getExtent().getCenter();
		IP_Map_All.mapExtent = map.extent;
		IT_Map_All.execute(IP_Map_All, function (identifyResults) {
			array.forEach(identifyResults, function (identifyResult) {
				array.forEach(identify_fields_json[identifyResult.layerId], function (attr) {
					if (identifyResult.feature.attributes[attr] !== "Null" && identifyResult.feature.attributes[attr] !== null && identifyResult.feature.attributes[attr] !== "") {
						if (identifyResult.feature.attributes[attr] !== undefined) {
							var feature_li = domConstruct.create("li", {"class": "feature_li"}, uinfo);
							domConstruct.create("strong", {"innerHTML": identAlias(attr) + ": "}, feature_li);
							if (identifyResult.feature.attributes[attr] === "T") {
								identifyResult.feature.attributes[attr] = "True";
							} else if (identifyResult.feature.attributes[attr] === "F") {
								identifyResult.feature.attributes[attr] = "False";
							}
							feature_li.innerHTML += identifyResult.feature.attributes[attr];
						}
					}
				});
			});
		});
		on(map, "extent-change", function (e) {
			document.getElementById("map").style.visibility = "visible";
		});
	});
}
function zoningAlias(a) {
	"use strict";
	if (typeof (aliases.zoneCodes[a]) !== "undefined") {
		return aliases.zoneCodes[a];
	} else {
		return a;
	}
}
function landuseAlias(a) {
	"use strict";
	if (typeof (aliases.landUseCodes[a]) !== "undefined") {
		return aliases.landUseCodes[a];
	} else {
		return a;
	}
}
function f_query_owner_results(results) {
	"use strict";
	require(["dojo/dom-construct", "esri/geometry/Geometry", "esri/SpatialReference"], function (domConstruct, Geometry, SpatialReference) {
		var featureSet,
			i,
			il,
			fSet,
			featureAttributes,
			att,
			parcel_li,
			feature_name;
		for (featureSet in results) {
			if (results.hasOwnProperty(featureSet)) {
				fSet = results[featureSet];
				for (i = 0, il = fSet.features.length; i < il; i += 1) {
					featureAttributes = fSet.features[i].attributes;
					for (att in featureAttributes) {
						if (featureAttributes.hasOwnProperty(att)) {
							if (att !== 'OBJECTID' && att !== 'OWNID') {
								parcel_li = domConstruct.create("li", {"innerHTML": ": " + featureAttributes[att], "class": "feature_li"}, "uOwner");
								feature_name = domConstruct.create("strong", {"innerHTML": DisplayFields.owner[att]}, parcel_li, "first");
							}
						}
					}
				}
			}
		}
	});
}
function f_query_landuse_results(results) {
	"use strict";
	var resultFeatures = results.features,
		i,
		il;
	require(["dojo/dom-construct"], function (domConstruct) {
		for (i = 0, il = resultFeatures.length; i < il; i += 1) {
			var featureAttributes = resultFeatures[i].attributes,
				att,
				parcel_li,
				feature_name,
				index = i + 1;
			for (att in featureAttributes) {
				if (featureAttributes.hasOwnProperty(att)) {
					parcel_li = domConstruct.create("li", {"class": "feature_li"}, "uLand");
					domConstruct.create("strong", {"innerHTML": "Land Use " + index + ": "}, parcel_li);
					parcel_li.innerHTML += landuseAlias(featureAttributes[att]);
				}
			}
		}
	});
}
function f_query_zoning_results(results) {
	"use strict";
	var resultFeatures = results.features,
		i,
		il;
	require(["dojo/dom-construct"], function (domConstruct) {
		for (i = 0, il = resultFeatures.length; i < il; i += 1) {
			var featureAttributes = resultFeatures[i].attributes,
				att,
				parcel_li,
				feature_name;
			for (att in featureAttributes) {
				if (featureAttributes.hasOwnProperty(att)) {
					if (featureAttributes[att] !== null && featureAttributes[att] !== "" && isNaN(featureAttributes[att])) {
						parcel_li = domConstruct.create("li", {"innerHTML": ": " + zoningAlias(featureAttributes[att]), "class": "feature_li"}, "uZoning");
						feature_name = domConstruct.create("strong", {"innerHTML": DisplayFields.zoning[att]}, parcel_li, "first");
					}
				}
			}
		}
	});
}
function f_query_building_results(results) {
	"use strict";
	var att_array = [],
		resultFeatures = results.features,
		i,
		il;
	require(["dojo/dom-construct"], function (domConstruct) {
		for (i = 0, il = resultFeatures.length; i < il; i += 1) {
			var featureAttributes = resultFeatures[i].attributes,
				att,
				val,
				parcel_li,
				feature_name;
			for (att in featureAttributes) {
				if (featureAttributes.hasOwnProperty(att)) {
					val = featureAttributes[att];
					parcel_li = domConstruct.create("li", {"innerHTML": ": " + featureAttributes[att], "class": "feature_li"});
					feature_name = domConstruct.create("strong", {"innerHTML": DisplayFields.building[att]}, parcel_li, "first");
					if (att_array.indexOf(featureAttributes[att]) === -1) {
						att_array.push(featureAttributes[att]);
						domConstruct.place(parcel_li, "uBuilding");
					}
				}
			}
		}
	});
}
function f_startup() {
	"use strict";
	require(["esri/map", "esri/symbols/SimpleMarkerSymbol", "dojo/_base/Color", "esri/tasks/QueryTask", "esri/tasks/query", "esri/tasks/RelationshipQuery", "esri/layers/ArcGISDynamicMapServiceLayer", "dojo/on"], function (Map, SimpleMarkerSymbol, Color, QueryTask, Query, RelationshipQuery, ArcGISDynamicMapServiceLayer, on, IdentifyParameters, IdentifyTask) {
		var QT_Parcel,
			Q_Parcel,
			QT_OwnerInt,
			Q_OwnerInt,
			QT_Owners,
			QT_Building,
			Q_Building,
			QR_Owners,
			QT_Zoning,
			Q_Zoning,
			QT_LandUse,
			Q_LandUse;
		map = new Map("map", {nav: false, logo: false});
		map.disablePan();
		on(map, "load", function () {
			map.disableMapNavigation();
		});
		// Graphic Symbol
		G_symbol = new SimpleMarkerSymbol();
		G_symbol.setStyle(SimpleMarkerSymbol.STYLE_SQUARE);
		G_symbol.setSize(10);
		G_symbol.setColor(new Color([255, 255, 0, 0.5]));
		/*
		** QUERY TASKS AND QUERIES
		*/
		/*
		** PARCEL
		*/
		// QUERY ON THE PARCEL LAYER - OUTPUT FIELDS ARE DEFINED IN JSON OBJECT (QT_OutFields)
		QT_Parcel = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Cadastral/MapServer/0");
		Q_Parcel = new Query();
		Q_Parcel.returnGeometry = true;
		Q_Parcel.outFields = QT_OutFields.parcel;
		Q_Parcel.where = "PID = " + parcel_id;
		/*
		** PARCEL OWNERS 
		*/
		QT_OwnerInt = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Cadastral/MapServer/8");
		Q_OwnerInt = new Query();
		Q_OwnerInt.returnGeometry = true;
		Q_OwnerInt.outFields = QT_OutFields.parcel;
		Q_OwnerInt.where = "PID = " + parcel_id;
		// QUERY ON THE INTERMEDIATE USING OIDS - LAYER 8
		QT_Owners = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/8");
		QR_Owners = new RelationshipQuery();
		QR_Owners.returnGeometry = true;
		QR_Owners.relationshipId = 10;
		QR_Owners.outFields = QT_OutFields.owner;
		/*
		** LAND USE
		*/
		QT_LandUse = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Cadastral/MapServer/9");
		Q_LandUse = new Query();
		Q_LandUse.returnGeometry = false;
		Q_LandUse.outFields = QT_OutFields.landuse;
		Q_LandUse.where = "PID = " + parcel_id;
		/*			
		** ZONING
		*/
		QT_Zoning = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Cadastral/MapServer/7");
		Q_Zoning = new Query();
		Q_Zoning.returnGeometry = false;
		Q_Zoning.outFields = QT_OutFields.zoning;
		Q_Zoning.where = "PID = " + parcel_id;
		/*			
		** Buildings
		*/
		QT_Building = new QueryTask("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Parcels/NJMC_Cadastral/MapServer/1");
		Q_Building = new Query();
		Q_Building.returnGeometry = false;
		Q_Building.outFields = QT_OutFields.building;
		Q_Building.where = "PID = " + parcel_id;
		// municipal map mxd layer.. 
		dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Municipal/Municipal/MapServer");
		map.addLayer(dynamicMapServiceLayer);
		QT_OwnerInt.executeForIds(Q_OwnerInt, function (featureIds) {
			QR_Owners.objectIds = featureIds;
			QT_Owners.executeRelationshipQuery(QR_Owners, f_query_owner_results);
		});
		QT_Parcel.execute(Q_Parcel, f_query_parcel_results);
		QT_LandUse.execute(Q_LandUse, f_query_landuse_results);
		QT_Zoning.execute(Q_Zoning, f_query_zoning_results);
		QT_Building.execute(Q_Building, f_query_building_results);
		on(document.getElementById("toggle_aerial"), "click", function () {
			map.removeAllLayers();
			var dynamicMapServiceLayer = new ArcGISDynamicMapServiceLayer("http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/CityView/Aerials_2009/MapServer");
			map.addLayer(dynamicMapServiceLayer);
			return false;
		});
		on(document.getElementById("toggle_large"), "click", function () {
			document.getElementById("map").style.width = "700px";
			document.getElementById("map").style.height = "700px";
			map.resize();
			on(map, "resize", function () {
				map.reposition();
				map.graphics.clear();
				//map.setExtent(graphic.geometry.getExtent().expand(3), true);
				//map.graphics.add(graphic);
				map.centerAt(graphic.geometry.getExtent().getCenter());
			});
		});
	});
}
f_startup();