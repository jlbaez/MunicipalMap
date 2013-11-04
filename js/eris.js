/*global document, require, XMLHttpRequest, setTimeout, sessionStorage, window, navigator, location, alert*/
//==========================================
// Title:  Municipal Map V.3
// Author: Jose Baez
// Date:   7 Oct 2013
//=========================================
/* Naming Conventions
 *
 * MAP STUFF
 *
 *	M     - Map
 *	IT    - Identify Task
 *	IP    - Identify Parameters
 *	TP    - Task Parameters
 *	BP    -	Buffer Parameters
 *	Q     -	Query
 *	QT    -	Query Task
 *	EVT   -	Event
 *  F     -	Feature
 *  IW    -	Info Window  
 *  GS    -	GeoService
 *  GeomS -	Geometry Service
 *	S     -	Symbol
 *  G     -	Graphic
 *	LG    -	Layer Graphics
 *	LD    -	Layer Dynamic
 *	LT    -	Layer Tiled
 *  IL    - Image Layer
 *
 * OTHER STUFF
 *
 *	f_    -	javascript function
 *	e_    -	html element
 *	b_    -	boolean variable
 *	r_    -	search result divs
 *	GV_   -	global var
 *	_lbl  -	label
 */
var DynamicLayerHost = "http://webmaps.njmeadowlands.gov";
var ERIS_base;
var G_button_clicked = "pan";
var GL_buffer_buffer;
var GL_buffer_parcel;
var GL_buffer_selected_parcels;
var GL_parcel_selection;
var IL_buttonmap;
var IP_Identify_Layers = [];
var LD_button;
var LD_flooding;
var map_legend;
var measurementDijit;
var M_meri;
var navToolbar;
var printMapLink = "./print/parcel_info.html";
var S_buffer_buffer;
var S_buffer_selected_parcels;
var S_feature_buffer_selection;
var S_feature_selection;
var tool_selected;
require(["dojo/_base/Color", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol"], function (Color, SimpleFillSymbol, SimpleLineSymbol) {
	"use strict";
	S_feature_selection = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
															 new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
																						 new Color([0, 255, 36]), 2),
															 new Color([52, 83, 130, 0.95]));
	S_buffer_buffer = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
														new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID,
																					new Color([100, 100, 100]), 3),
														new Color([255, 0, 0, 0.6]));
	S_buffer_selected_parcels = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
																	 new SimpleLineSymbol("dashdot",
																								 new Color([0, 255, 0]), 3),
																	 new Color([0, 255, 255, 1]));
	S_feature_buffer_selection = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
																	  new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
																								  new Color([255, 255, 0]), 3),
																	  new Color([0, 0, 255, 0.4]));
});
var imageryLayersJSON = [{"id": "IMG_1930_BW", "title": "1930 Black and White (NJDEP)"},
								 {"id": "IMG_1958_BW", "title": "1958 Black and White (NJDEP)"},
								 {"id": "IMG_1969_BW", "title": "1969 Black and White (NJMC)"},
								 {"id": "IMG_1978_BW", "title": "1978 Black and White (NJMC)"},
								 {"id": "IMG_1985_BW", "title": "1985 Black and White (NJMC)"},
								 {"id": "IMG_1992_BW", "title": "1992 Black and White (NJMC)"},
								 {"id": "IMG_1995-97_CIR", "title": "1995-97 Color Infrared (NJDEP)"},
								 {"id": "IMG_2001_C", "title": "2001 Color (NJMC)"},
								 {"id": "IMG_2002_BW", "title": "2002 Black and White (NJMC)"},
								 {"id": "IMG_2002_C", "title": "2002 Color Infrared (NJDEP)"},
								 {"id": "IMG_2008_C", "title": "2008 Color (NJDEP)"},
								 {"id": "IMG_2009_C", "title": "2009 Color (NJMC)"},
								 {"id": "IMG_2010_C", "title": "2010 Color (Hudson County)"},
								 {"id": "IMG_2012_C", "title": "2012 Color (NJDEP)"}];

var map_layers_flooding_json = {"title": "Flooding Scenarios",
										  "title_tgf": "Predicted Flooding in absence of tidegates",
										  "title_surge": "Storm Surge",
										  "scenarios": [{"group": 8, "lyr": 1, "vis": 0},
														  {"group": 7, "lyr": 4, "vis": 0},
														  {"group": 6, "lyr": 7, "vis": 0},
														  {"group": 5, "lyr": 10, "vis": 0},
														  {"group": 4, "lyr": 13, "vis": 0},
														  {"group": 3, "lyr": 16, "vis": 0},
														  {"group": 2, "lyr": 19, "vis": 0}]};

var legend_children_json = [{"name": "Environmental", "id": "environ", "children": 0},
									 {"name": "Hydro", "id": "hydro", "children": 0},
									 {"name": "Infrastructure/Utilities", "id": "inf_util", "children": 0},
									 {"name": "Political/Jurisdiction", "id": "planning_cad", "children": 0},
									 {"name": "Topographic & Planimetrics", "id": "topo_plan", "children": 0},
									 {"name": "Transportation", "id": "trans", "children": 0}];
	 
require(["dojo/request/xhr"], function (xhr) {
	"use strict";
	xhr(DynamicLayerHost + "/ArcGIS/rest/services/Municipal/MunicipalMap_live/MapServer/legend?f=json", {handleAs: "json"}).then(function (content) {
		map_legend = content;
	});
});
var identify_fields_json = {14: ["FIRM_PAN"],
									 25: ["TMAPNUM", "STATUS "],
									 27: ["FLD_ZONE", "FLOODWAY", "STATIC_BFE", "SFHA_TF"],
									 28: ["LABEL07", "TYPE07", "ACRES", "LU07"],
									 1: ["MUNICIPALITY", "TIDEGATE_NAME", "GPSPOINT_TYPE", "ELEVATION", "DATE_OBS", "TYPE_OF_TIDE_GATE", "TYPE_OF_GATE", "FUNCTIONALITY", "MAINTENANCEREQUIRED"],
									 13: ["TYPE"],
									 23: ["TYPE"],
									 5: ["FacilityID", "Municipality", "MaintainedBy", "CBType", "ReceivingWater"],
									 6: ["FacilityID", "Municipality", "MaintainedBy", "RimElevation"],
									 7: ["FacilityID", "Municipality", "MaintainedBy", "Diameter", "ReceivingWater"],
									 8: ["FacilityID", "Municipality", "MaintainedBy", "Material", "Diameter", "UpstreamInvert", "DownstreamInvert"],
									 9: ["FacilityID", "Municipality", "MaintainedBy", "RimElevation"],
									 10: ["FacilityID", "Municipality", "MaintainedBy", "Material", "Diameter", "UpstreamInvert", "DownstreamInvert"],
									 11: ["ID", "STREET", "LOCATION1", "LOCATION2", "ACCESS_", "PIPE_DIAMETER", "PIPEDIAMETER_VALUE"],
									 26: ["BID", "FACILITY_NAME", "BUILDING_LOCATION", "TOTALBLDG_SF"],
									 31: ["LandUse_Code"],
									 32: ["Zone_Code"],
									 22: ["ENCUMBRANCETYPE", "ENCUMBRANCEOWNER", "ENCUMBRANCEDESCRIPTION"],
									 29: ["NAME10"],
									 30: ["TRACTCE10", "BLOCKCE10", "POPULATION"],
									 0: ["ELEVATION"],
									 15: ["Elevation", "Type"],
									 16: ["ELEVATION"],
									 12: ["SLD_NAME"],
									 17: ["Elevation", "Type"],
									 18: ["Elevation", "Type"]};

var aliases = {"munCodes":
					{"205": "Carlstadt",
					 "212": "East Rutherford",
					 "230": "Little Ferry",
					 "232": "Lyndhurst",
					 "237": "Moonachie",
					 "239": "North Arlington",
					 "249": "Ridgefield",
					 "256": "Rutherford",
					 "259": "South Hackensack",
					 "262": "Teterboro",
					 "906": "Jersey City",
					 "907": "Kearny",
					 "908": "North bergen",
					 "909": "Secaucus"},
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
					 "WET": "Wetlands"},
					"zoneCodes":
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
					{"BLOCK": "Block",
					 "LOT": "Lot",
					 "PID" : "PID",
					 "PAMS Pin" : "PAMS Pin",
					 "PAMS_PIN" : "PAMS Pin",
					 "OLD_BLOCK" : "Old Block",
					 "OLD_LOT" : "Old Lot",
					 "PROPERTY_ADDRESS" : "Address",
					 "TAX_ACRES" : "Tax Acres",
					 "CITY_STATE" : "City, State",
					 "MAP_ACRES" : "GIS Acres",
					 "MUN_CODE" : "Municipality",
					 "LANDUSE_CODE" : "Landuse",
					 "ZONE_CODE" : "Zone",
					 'NAME' : 'Name', "ADDRESS" : 'Address', "FIRM_PAN" : "Firm Panel #",
					 "TMAPNUM" : "Tidelands Map #",
					 "FLD_ZONE" : "Flood Zone",
					 "STATIC_BFE" : 'Static Base<br>Flood Elevation',
					 "LABEL07" : "Wetland Label",
					 "TYPE07" : "Wetland Type",
					 "LU07" : "Anderson landuse class",
					 "RECIEVINGWATER" : "Receiving Water",
					 "NAME10" : "Voting District Label",
					 "TRACTCE10" : "Census Tract #",
					 "BLOCKCE10" : "Census Block #",
					 "FACILITY_NAME" : "Facility Name",
					 "BUILDING_LOCATION" : "Building Location",
					 "TOTALBLDG_SF" : "Total Building Square Feet",
					 "PHYSICAL_ADDRESS" : "Address",
					 "PHYSICAL_CITY" : "City",
					 "PHYSICAL_ZIP" : "Zip Code",
					 "COMPANY_CONTACT" : "Company Contact",
					 "CONTACT_PHONE" : "Phone",
					 "OFFICIAL_CONTACT" : "Official Contact",
					 "OFFICIAL_PHONE" : "Phone",
					 "EMERGENCY_CONTACT" : "Emergency Contact",
					 "EMERGENCY_PHONE" : "Phone",
					 "CAS_NUMBER" : "CAS Number",
					 "LandUse_Code" : "Landuse",
					 "QUALIFIER": "Qualifier",
					 "ENCUMBRANCEDESCRIPTION": "Encumbrance<br>Description",
					 "ENCUMBRANCETYPE": "Encumbrance<br>Type",
					 "ENCUMBRANCEOWNER": "Encumbrance<br>Owner",
					 "POPULATION": "Population",
					 "STATUS ": "Status",
					 "FacilityID": "Facility ID",
					 "Zone_Code": "Zoning"}};

var F_outFields = {"parcel": ["PID",
										"PAMS_PIN",
										"BLOCK",
										"LOT",
										"OLD_BLOCK",
										"OLD_LOT",
										"FACILITY_NAME",
										"PROPERTY_ADDRESS",
										"MAP_ACRES",
										"TAX_ACRES",
										"MUN_CODE",
										"QUALIFIER"],
						 "parcelB": ["PID"],
						 "search": ["PROPERTY_ADDRESS",
										"BLOCK",
										"LOT"],
						 "owner": ["OWNID",
									  "NAME",
									  "ADDRESS",
									  "CITY_STATE",
									  "ZIPCODE"],
						 "building": ["PID",
										  "BID",
										  "MUNICIPALITY",
										  "BUILDING_LOCATION",
										  "FACILITY_NAME"],
						 "ERIS": ["*"]};
var landuse_json = [{"code": "CO", "name": "Commercial Office"},
							 {"code": "CR", "name": "Commercial Retail"},
							 {"code": "HM", "name": "Hotels and Motels"},
							 {"code": "IND", "name": "Industrial"},
							 {"code": "ICC", "name": "Industrial Commercial Complex"},
							 {"code": "PQP", "name": "Public/Quasi Public Services"},
							 {"code": "RL", "name": "Recreational Land"},
							 {"code": "RES", "name": "Residential"},
							 {"code": "TRS", "name": "Transportation"},
							 {"code": "WAT", "name": "Water"},
							 {"code": "WET", "name": "Wetlands"},
							 {"code": "000", "name": "Unclassified"},
							 {"code": "CU", "name": "Communication Utility"},
							 {"code": "MU", "name": "Multiple Uses"},
							 {"code": "VAC", "name": "Open Lands"},
							 {"code": "TL", "name": "Transitional Lands"}
                    ];
function e_printMap(pid) {
	"use strict";
	sessionStorage.setItem('printPID', pid);
	window.open("print/parcel_info.html", "_blank");
}
function f_printMap() {
	"use strict";
	sessionStorage.setItem('printPID', document.getElementById("popup_pid").innerHTML);
	window.open("print/parcel_info.html", "_blank");
}
function fieldAlias(fieldName, dataSource) {
	"use strict";
	dataSource = typeof (dataSource) !== 'undefined' ? dataSource : '';
	aliases.fieldNames.NAME = dataSource + 'Name';
	aliases.fieldNames.ADDRESS = dataSource + 'Address';
	if (typeof (aliases.fieldNames[fieldName]) !== "undefined") {
		return (aliases.fieldNames[fieldName]);
	} else {
		return fieldName;
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
function zoningAlias(a) {
	"use strict";
	if (typeof (aliases.zoneCodes[a]) !== "undefined") {
		return aliases.zoneCodes[a];
	} else {
		return a;
	}
}
function muncodeToName(c) {
	"use strict";
	if (c.length === 4) {
		c = c.substr(1, 3);
	}
	if (typeof (aliases.munCodes[c]) !== "undefined") {
		return aliases.munCodes[c];
	} else {
		return c;
	}
}
function formatResult(fieldName, fieldValue, data) {
	"use strict";
	var dataSource = (typeof (data) !== 'undefined') ? data : '',
		CSS = [],
		Result = [];
	CSS.field = CSS.value = '';
	if (dataSource !== '') {
		CSS.field = "field_" + dataSource;
		CSS.value = "value_" + dataSource;
	}
	Result.field = fieldAlias(fieldName);
	Result.value = fieldValue;
	if (fieldName === "MAP_ACRES" && !isNaN(fieldValue)) {
		Result.value = Math.round(fieldValue * 100) / 100;
	}
	if (fieldName === "LANDUSE_CODE") {
		Result.value = landuseAlias(fieldValue);
	}
	if (fieldName === "ZONE_CODE") {
		Result.value = zoningAlias(fieldValue);
	}
	if (fieldName === "MUN_CODE") {
		Result.value = muncodeToName(fieldValue);
	}
	return '<li class="field ' + CSS.field + '"><b>' + Result.field + ':</b>' + Result.value + '</li>';
}
var munis_json = [{"muncode": "0205", "mun": "Carlstadt"},
						{"muncode": "0212", "mun": "East Rutherford"},
						{"muncode": "0906", "mun": "Jersey City"},
						{"muncode": "0907", "mun": "Kearny"},
						{"muncode": "0230", "mun": "Little Ferry"},
						{"muncode": "0232", "mun": "Lyndhurst"},
						{"muncode": "0237", "mun": "Moonachie"},
						{"muncode": "0239", "mun": "North Arlington"},
						{"muncode": "0908", "mun": "North Bergen"},
						{"muncode": "0249", "mun": "Ridgefield"},
						{"muncode": "0256", "mun": "Rutherford"},
						{"muncode": "0909", "mun": "Secaucus"},
						{"muncode": "0259", "mun": "South Hackensack"},
						{"muncode": "0262", "mun": "Teterboro"}];
var quals_json = [{"id": "MD",
						 "name": "In District",
						 "desc": "All parcels fully within the NJMC District"},
						{"id": "OMD",
						 "name": "Out of District",
						 "desc": "All parcels fully outside the NJMC District"},
						{"id": "MD-OMD", "name": "Borderline Parcels",
						 "desc": "All parcels partially in and partially out of the NJMC District"}];
function f_getPopupTemplate(graphic) {
	"use strict";
	var src_link,
		popupTemplate,
		qualifiers = {"MD": "In District",
						  "OMD": "Out of District",
						  "MD-OMD": "Borderline Parcels"},
		attributes = graphic.attributes;
	require(["esri/dijit/PopupTemplate", "dojo/request/xhr", "dojo/dom-construct"], function (PopupTemplate, xhr, domConstruct) {
		xhr('./php/functions.php', {
			"method": "POST",
			"data": {
				"PID": graphic.attributes.PID,
				"function": "getPhoto"
			},
			"sync": true
		}).then(function (data) {
			var e_parent = document.createElement("div"),
				e_table = domConstruct.create("table", {"class": "attrTable", "cellspacing": "0px", "cellpadding": "0px"}, e_parent),
				e_tbody = domConstruct.create("tbody", null, e_table),
				attr,
				e_tr;
			for (attr in attributes) {
				if (attributes.hasOwnProperty(attr)) {
					if (attributes[attr] !== null) {
						e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
						domConstruct.create("td", {"class": "attrName", "innerHTML": aliases.fieldNames[attr] + ":"}, e_tr);
						if (attr === "MUN_CODE") {
							domConstruct.create("td", {"class": "attrValue", "innerHTML": aliases.munCodes[attributes[attr].substring(1, attributes[attr].length)]}, e_tr);
						} else if (attr === "PID") {
							domConstruct.create("td", {"class": "attrValue", "id": "popup_pid", "innerHTML": attributes[attr]}, e_tr);
						} else if (attr === "QUALIFIER") {
							domConstruct.create("td", {"class": "attrValue", "innerHTML": qualifiers[attributes[attr]]}, e_tr);
						} else {
							domConstruct.create("td", {"class": "attrValue", "innerHTML": attributes[attr]}, e_tr);
						}
					}
				}
			}
			popupTemplate = new PopupTemplate({
				title: "{PROPERTY_ADDRESS}",
				description: e_parent.innerHTML,
				mediaInfos: [{
					"title": "",
					"caption": "",
					"type": "image",
					"value": {
						"sourceURL": data,
						"linkURL": data
					}
				}]
			});
			e_parent.remove();
		});
	});
	return popupTemplate;
}
function f_removeSelection() {
	"use strict";
	var graphics_layer = GL_parcel_selection,
		x = 0,
		oid = document.getElementById("popup_pid").innerHTML;
	for (x = 0; x < graphics_layer.graphics.length; x += 1) {
		if (graphics_layer.graphics[x].attributes.PID === parseInt(oid, 10)) {
			graphics_layer.remove(graphics_layer.graphics[x]);
			if (document.getElementById("parcelinfo_" + oid) !== null) {
				document.getElementById("parcelinfo_" + oid).remove();
			}
			if (document.getElementById("parcel_ser_info_" + oid) !== null) {
				document.getElementById("parcel_ser_info_" + oid).remove();
			}
			break;
		}
	}
	M_meri.infoWindow.hide();
}
function f_export_excel(export_PID) {
	"use strict";
	var form = document.createElement("form"),
		hidden,
		index;
	form.action = "./php/export_parcel_owners.php";
	form.target = "_blank";
	form.method = "POST";
	for (index = 0; index < export_PID.length; index += 1) {
		hidden = document.createElement("input");
		hidden.type = "hidden";
		hidden.name = "PID[]";
		hidden.value = export_PID[index];
		form.appendChild(hidden);
	}
	form.submit();
}
function f_process_results_parcel(results, event) {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array", "dojo/query", "dojo/on"], function (domConstruct, array, query, on) {
		var feature_div = "selParcel_",
			GL_container = GL_parcel_selection,
			G_symbol = S_feature_selection,
			object_attr = "PID",
			GL_count,
			buffer_li,
			e_print,
			e_remove,
			a_export,
			export_PID = [],
			i,
			number,
			total_acres = 0,
			search_export = document.getElementById("search_export");
		GL_count = GL_container.graphics.length;
		if (document.getElementsByClassName("a_print action").length > 0) {
			document.getElementsByClassName("a_print action")[0].remove();
		}
		if (document.getElementsByClassName("a_remove action").length > 0) {
			document.getElementsByClassName("a_remove action")[0].remove();
		}
		e_print = domConstruct.create("a", {"innerHTML": "Print", "href": "#",  "onclick": "return false;", "class": "a_print action"}, query(".actionList", window.map.esriPopup)[0]);
		e_remove = domConstruct.create("a", {"innerHTML": "Remove", "href": "#", "onclick": "return false;", "class": "a_remove action"}, query(".actionList", window.map.esriPopup)[0]);
		on(e_print, "click", f_printMap);
		on(e_remove, "click", f_removeSelection);
		array.forEach(results.features, function (result) {
			var el_featureAttribs,
				el_parcel,
				el_featureToolPrint,
				el_viewMoreToggle,
				el_viewMoreToggleLink,
				output,
				attr,
				function_array,
				featureAttributes = result.attributes,
				graphic = result,
				popupTemplate,
				e_print,
				remove;
			graphic.setSymbol(G_symbol);
			total_acres += graphic.attributes.MAP_ACRES;
			export_PID.push(graphic.attributes.PID);
			popupTemplate = f_getPopupTemplate(graphic);
			graphic.infoTemplate = popupTemplate;
			GL_container.add(graphic);
			if (event === "click") {
				el_featureAttribs = domConstruct.create("li",
																	 {"class": "search_parcel_container",
																	  "id":  "parcelinfo_" + featureAttributes[object_attr]},
																	 "dropdown3");
			} else if (event === "search") {
				el_featureAttribs = domConstruct.create("li",
																	 {"class": "search_parcel_container",
																	  "id": "parcel_ser_info_" + featureAttributes[object_attr]}, "dropdown2");
			} else {
				el_featureAttribs = domConstruct.create("li",
																	 {"class": "search_parcel_container owner_parcels_" + event.split("_")[1],
																	  "id": "parcel_ser_info_" + featureAttributes[object_attr]}, "findownerparcel_" + event.split("_")[1]);
			}
			output = domConstruct.create("ul",
												  {"class": "ResultList SelectionResult",
													"id": "parcelinfo_ul_" + featureAttributes[object_attr]}, el_featureAttribs);
			if (event === "click") {
				for (attr in featureAttributes) {
					if (featureAttributes.hasOwnProperty(attr)) {
						output.innerHTML += formatResult(attr, featureAttributes[attr], "selection");
					}
				}
			} else {
				for (attr in featureAttributes) {
					if (featureAttributes.hasOwnProperty(attr) && ["PROPERTY_ADDRESS", "BLOCK", "LOT"].indexOf(attr) !== -1) {
						output.innerHTML += formatResult(attr, featureAttributes[attr], "selection");
					}
				}
			}
			el_parcel = domConstruct.create("li",
													  {"id": feature_div + featureAttributes[object_attr],
														"class": "dParcelItem"},
													  output,
													  "first");
			el_featureToolPrint = domConstruct.create("a",
																	{"href": "#",
																	 "onclick": "e_printMap(" + featureAttributes[object_attr] + ");return false;",
																	 "innerHTML": "Print",
																	 "class": "selection_a feature_tool print_a"},
																	el_parcel);
			el_viewMoreToggle = domConstruct.create("li",
																 {"class": "lSummaryToggle"},
																 output);
			if (event === "click") {
				el_viewMoreToggleLink = domConstruct.create("a",
																		  {"id": "detail_view_a_" + featureAttributes[object_attr],
																			"class": "selection_a",
																			"href": "#",
																			"innerHTML": "-- View More --",
																			"onClick": 'f_result_detail("parcel","' + output.id + '",' + featureAttributes[object_attr] + ");return false;"},
																		  el_viewMoreToggle);
			}
			if (event === "click") {
				function_array = ["Remove", "Zoom", "Pan", "Flash"];
			} else {
				function_array = ["Remove Result", "Zoom", "Pan", "Flash", "Quick Buffer", "Add to Selection"];
			}
			array.forEach(function_array, function (a) {
				var el_featureTool = domConstruct.create("a",
																	  {"href": "#", "class": "selection_a feature_tool",
																		"innerHTML": a,
																		"onClick": 'f_feature_action("' + a + '","' + output.id + '","' + featureAttributes[object_attr] + '");return false;'},
																	  el_parcel);
			});
		});
		buffer_li = document.getElementsByClassName("buffer");
		for (i = 0; i < buffer_li.length; i += 1) {
			buffer_li[i].style.display = "block";
		}
		if (event === "search") {
			a_export = document.createElement("a");
			a_export.className = "selection_a";
			a_export.href = "#";
			a_export.style.color = "#09D";
			a_export.onclick = function () {
				f_export_excel(export_PID);
				return false;
			};
			if (search_export.children.length > 0) {
				number = parseInt(search_export.children[0].innerHTML.replace(/\D/g, ""), 10) + export_PID.length;
				a_export.innerHTML = "Export to Excel: [" + number + " item(s)]";
				search_export.innerHTML = "";
				search_export.appendChild(a_export);
			} else {
				a_export.innerHTML = "Export to Excel: [" + export_PID.length + " item(s)]";
				search_export.appendChild(a_export);
			}
			document.getElementById("search_tally").innerHTML = results.features.length + " results found. Total Acres: " + Math.round(total_acres * 100) / 100;
		}
	});
}
function f_parcel_selection_exec(map_event) {
	"use strict";
	require(["esri/tasks/query", "esri/tasks/QueryTask"], function (Query, QueryTask) {
		var Q_parcel_selection = new Query(),
			QT_parcel_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0");
		Q_parcel_selection.outSpatialReference = {wkid: 3857};
		Q_parcel_selection.returnGeometry = true;
		Q_parcel_selection.outFields = F_outFields.parcel;
		Q_parcel_selection.geometry = map_event.mapPoint;
		QT_parcel_selection.execute(Q_parcel_selection, function (results) {
			f_process_results_parcel(results, "click");
		});
	});
}
function f_map_identify_exec(click_evt) {
	"use strict";
	require(["dojo/_base/array", "dojo/dom-construct", "esri/tasks/IdentifyParameters", "esri/tasks/IdentifyTask"], function (array, domConstruct, IdentifyParameters, IdentifyTask) {
		document.getElementById("map_container").style.cursor = "progress";
		var IP_Map_All = new IdentifyParameters(),
			el_popup_content = domConstruct.create("div", {"class": "esriViewPopup"}),
			el_popup_view = domConstruct.create("div", {"class": "mainSection"}, el_popup_content),
			IT_Map_All = new IdentifyTask(DynamicLayerHost + "/ArcGIS/rest/services/Municipal/MunicipalMap_live/MapServer"),
			next_arrow = document.getElementsByClassName("titleButton arrow")[0];
		IP_Map_All.tolerance = 3;
		IP_Map_All.returnGeometry = true;
		IP_Map_All.layerIds = [14, 25, 27, 26, 31, 30, 29];
		IP_Map_All.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
		IP_Map_All.width  = M_meri.width;
		IP_Map_All.height = M_meri.height;
		IP_Map_All.geometry = click_evt.mapPoint;
		IP_Map_All.mapExtent = M_meri.extent;
		IP_Map_All.layerIds = IP_Identify_Layers;
		IT_Map_All.execute(IP_Map_All, function (identifyResults) {
			var e_table = domConstruct.create("table", {"class": "attrTable ident_table", "cellspacing": "0px", "cellpadding": "0px"}, el_popup_view),
				e_tbody = domConstruct.create("tbody", null, e_table);
			array.forEach(identifyResults, function (identifyResult) {
				array.forEach(identify_fields_json[identifyResult.layerId], function (attr) {
					if (identifyResult.feature.attributes[attr] !== "Null" && identifyResult.feature.attributes[attr] !== null && identifyResult.feature.attributes[attr] !== "") {
						var e_tr = domConstruct.create("tr", {"valign": "top"}, e_tbody);
						domConstruct.create("td", {"class": "attrName", "innerHTML": fieldAlias(attr) + ":"}, e_tr);
						domConstruct.create("td", {"class": "attrValue", "innerHTML": identifyResult.feature.attributes[attr]}, e_tr);
					}
				});
			});
			M_meri.infoWindow.clearFeatures();
			M_meri.infoWindow.setTitle("Selected Property");
			M_meri.infoWindow.setContent(el_popup_content);
			M_meri.infoWindow.show(click_evt.mapPoint);
			next_arrow.style.display = "block";
			document.getElementsByClassName("esriMobileNavigationItem right1")[0].style.display = "none";
			document.getElementsByClassName("esriMobileNavigationItem right2")[0].style.display = "none";
			document.getElementById("map_container").style.cursor = "default";
		});
	});
}
function f_map_measure() {
	"use strict";
	document.getElementById("dMeasureTool").style.display = "block";
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
		if (parseInt(http.responseText, 10) === "1") {
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
			MAIN_RTK = ["CAS_NUMBER", "LOCATION"],
			FLDS_IGNORE_RTK = ["SUBSTANCE_NAME", "RTK_SUBSTANCE_NUMBER"],
			featureAttributes,
			ERIS_LINK = 'http://apps.njmeadowlands.gov/eris/?b=' + bid + '&a=planning',
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
			next_arrow = document.getElementsByClassName("titleButton arrow")[0];
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
						domConstruct.create("td", {"class": "attrName", "innerHTML": '<a href="ERIS/factsheets//' + substance_no[index].SUBSTANCE_NO + '.pdf" target="_blank"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>'}, e_tr);
					} else {
						domConstruct.create("td", {"class": "attrName", "innerHTML": '<a href="ERIS/factsheets/' + substance_no[index].SUBSTANCE_NO + '.pdf" onclick="return false;"><strong>' + substance_name[index].SUBSTANCE_NAME + '</stronng></a>'}, e_tr);
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
		next_arrow.style.display = "block";
		document.getElementsByClassName("esriMobileNavigationItem right1")[0].style.display = "none";
		document.getElementsByClassName("esriMobileNavigationItem right2")[0].style.display = "none";
		M_meri.infoWindow.show(map_event.mapPoint);
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
		Q_ERIS_selection.outFields = ["BID"];
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
					var ERIS_LINK = 'http://apps.njmeadowlands.gov/eris/?b=' + bid + '&a=planning';
					ERIS_LINK = '<span class="ERIS_LINK"><a href="' + ERIS_LINK + '" target="_blank">View Building Info</a></span>';
					if (results.length === 0) {
						M_meri.infoWindow.clearFeatures();
						M_meri.infoWindow.setTitle("ERIS Selection");
						M_meri.infoWindow.setContent(ERIS_LINK);
						next_arrow.style.display = "block";
						document.getElementsByClassName("esriMobileNavigationItem right1")[0].style.display = "none";
						document.getElementsByClassName("esriMobileNavigationItem right2")[0].style.display = "none";
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
function f_map_click_handler(evt_click) {
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
function f_button_clicked(id) {
	"use strict";
	document.getElementsByClassName("button_clicked")[0].removeAttribute("style");
	require(["dojo/dom-class"], function (domClass) {
		if (G_button_clicked !== "") {
			domClass.remove(G_button_clicked, "button_clicked");
			domClass.add(id, "button_clicked");
		}
	});
	document.getElementById(id).style.backgroundColor = "#d0d0d0";
	G_button_clicked = id;
}
function f_measure_map() {
	"use strict";
	document.getElementById("dropdown0").style.display = "block";
}
function f_map_clear() {
	"use strict";
	var dropdown0 = document.getElementById("dropdown0");
	document.getElementById("export").innerHTML = "";
	document.getElementById("search_progress").value = "0";
	document.getElementById("search_tally").innerHTML = "";
	document.getElementById("search_export").innerHTML = "";
	GL_parcel_selection.clear();
	GL_parcel_selection.clear();
	GL_buffer_parcel.clear();
	GL_buffer_buffer.clear();
	GL_buffer_selected_parcels.clear();
	M_meri.infoWindow.hide();
	measurementDijit.clearResult();
	measurementDijit.setTool("location", false);
	measurementDijit.setTool("area", false);
	measurementDijit.setTool("distance", false);
	require(["dojo/query", "dojo/dom-construct"], function (query, domConstruct) {
		query("input[type=text]").forEach(function (node) {
			if (node.value !== "") {
				node.value = "";
			}
		});
		query(".muniCheckRow > input[type=checkbox]:checked").forEach(function (node) {
			if (node.checked) {
				node.checked = false;
			}
		});
		query(".qualCheckRow > input[type=checkbox]:checked").forEach(function (node) {
			if (node.checked) {
				node.checked = false;
			}
		});
		query(".landuseCheckRow > input[type=checkbox]:checked").forEach(function (node) {
			if (node.checked) {
				node.checked = false;
			}
		});
		query(".search_parcel_container").forEach(function (node) {
			domConstruct.destroy(node);
		});
		query(".search_owner_container").forEach(function (node) {
			domConstruct.destroy(node);
		});
		query(".buffer").forEach(function (node) {
			node.style.display = "none";
		});
        document.getElementById("buffer_distance").value = 200;
	});
	if (dropdown0.style.display === "block") {
		require(["dojo/fx"], function (coreFx) {
			coreFx.wipeOut({node: dropdown0, duration: 100}).play();
		});
	}
}
function f_search_parcel_old(address, block, lot, where_PID) {
	"use strict";
	document.getElementById("search_progress").value = ".5";
	var where = [],
		where_address,
		where_block,
		where_lot,
		search_progress = document.getElementById("search_progress");
	if (address !== "") {
		where_address = "Where [PROPERTY_ADDRESS] LIKE '%" + address + "%'";
		where.push(where_address);
	} else if (block !== "" || lot !== "") {
		if (block !== "") {
			where_block = "([BLOCK] = '" + block + "' OR [OLD_BLOCK] = '" + block + "')";
			where.push(where_block);
		}
		if (lot !== "") {
			where_lot = "([LOT] = '" + lot + "' OR [OLD_LOT] = '" + lot + "')";
			where.push(where_lot);
		}
	}
	require(["dojo/_base/array", "dojo/query", "esri/tasks/query", "esri/tasks/QueryTask"], function (array, query, Query, QueryTask) {
		var muni_array = query(".s_muni_chk_item:checked"),
			qual_array,
			Q_parcel_selection = new Query(),
			QT_parcel_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0"),
			where_muni,
			where_qual;
		Q_parcel_selection.outSpatialReference = {wkid: 3857};
		Q_parcel_selection.returnGeometry = true;
		Q_parcel_selection.outFields = F_outFields.parcel;
		if (document.getElementById("rdo_muni_searchSelect").checked) {
			if (muni_array.length > 0) {
				where_muni = "[MUN_CODE] IN (";
				array.forEach(muni_array, function (checkbox) {
					if (checkbox.checked) {
						where_muni += "'" + checkbox.value + "',";
					}
				});
				where_muni = where_muni.substring(0, where_muni.length - 1);
				where_muni += ")";
				where.push(where_muni);
			}
		}
		if (document.getElementById("rdo_qual_searchSelect").checked) {
			qual_array = query(".s_qual_chk_item:checked");
			if (qual_array.length > 0) {
				where_qual = "[QUALIFIER] in (";
				array.forEach(qual_array, function (checkbox) {
					if (checkbox.checked) {
						where_qual += "'" + checkbox.value + "',";
					}
				});
				where_qual = where_qual.substring(0, where_qual.length - 1);
				where_qual += ")";
				where.push(where_qual);
			}
		}
		if (where_PID !== null) {
			where.push(where_PID);
		}
		Q_parcel_selection.where = where.join(" AND ");
		QT_parcel_selection.execute(Q_parcel_selection, function (results) {
			f_process_results_parcel(results, "search");
			search_progress.value = "1";
			search_progress.style.display = "none";
		});
	});
}
function f_search_landuse(address, block, lot) {
	"use strict";
	if (document.getElementById("rdo_landuse_searchSelect").checked) {
		require(["dojo/_base/array", "dojo/query", "esri/tasks/query", "esri/tasks/QueryTask"], function (array, query, Query, QueryTask) {
			var landuse_array = query(".s_landuse_chk_item:checked"),
				Q_landuse = new Query(),
				QT_landuse = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/9"),
				where_landuse,
				where_PID;
			Q_landuse.returnGeometry = false;
			Q_landuse.outFields = ["PID"];
			if (landuse_array.length > 0) {
				where_landuse = "where LANDUSE_CODE IN (";
				array.forEach(document.getElementsByName("s_landuse_chk_item"), function (checkbox) {
					if (checkbox.checked) {
						where_landuse += "'" + checkbox.value + "',";
					}
				});
				where_landuse = where_landuse.substring(0, where_landuse.length - 1);
				where_landuse += ")";
				Q_landuse.where = where_landuse;
				QT_landuse.execute(Q_landuse, function (results) {
					if (results.features.length > 0) {
						where_PID = "PID IN (";
						var i, il;
						for (i = 0, il = results.features.length; i < il; i += 1) {
							where_PID += "'" + results.features[i].attributes.PID + "',";
						}
						where_PID = where_PID.substring(0, where_PID.length - 1);
						where_PID += ")";
						f_search_parcel_old(address, block, lot, where_PID);
					}
				});
			} else {
				f_search_parcel_old(address, block, lot, null);
			}
		});
	} else {
		f_search_parcel_old(address, block, lot, null);
	}
}
function f_candidate_search(where, candidate_array) {
	"use strict";
	var search_progress = document.getElementById("search_progress");
	if (candidate_array.length > 0) {
		require(["esri/geometry/Extent", "esri/SpatialReference", "esri/geometry/Point", "esri/tasks/query", "esri/tasks/QueryTask"], function (Extent, SpatialReference, Point, Query, QueryTask) {
			var candidate = candidate_array.pop(),
				Q_parcel_selection = new Query(),
				QT_parcel_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0"),
				point,
				search_extent,
				index,
				index_length,
				featureAttributes,
				parcel_address,
				candidate_address = document.getElementById("address").value.split(" ", 2)[1],
				add_num = document.getElementById("address").value.split(" ", 1)[0];
			Q_parcel_selection.outSpatialReference = {wkid: 3857};
			Q_parcel_selection.returnGeometry = true;
			Q_parcel_selection.outFields = F_outFields.parcel;
			search_progress.value = ".5";
			if (where.length === 0) {
				Q_parcel_selection.where = where.join(" AND ");
			}
			if (candidate.attributes.Addr_type === "StreetAddress") {
				search_extent = new Extent(candidate.attributes.Xmin,
													candidate.attributes.Ymin,
													candidate.attributes.Xmax,
													candidate.attributes.Ymax,
													new SpatialReference(4326));
				Q_parcel_selection.geometry = search_extent;
				QT_parcel_selection.execute(Q_parcel_selection, function (results) {
					index_length = results.features.length;
					for (index = 0; index < results.features.length; index += 1) {
						var show = false;
						featureAttributes = results.features[index].attributes;
						parcel_address = featureAttributes.PROPERTY_ADDRESS.replace(/\s/g, "").toLowerCase();
						if (parcel_address.indexOf(candidate_address) !== -1) {
							show = true;
						}
						if (!isNaN(add_num)) {
							if (parcel_address.indexOf(add_num) !== -1 && parcel_address.indexOf(candidate_address) !== -1) {
								show = true;
							} else {
								show = false;
							}
						}
						if (show !== true) {
							results.features.splice(index, 1);
							index += -1;
						}
					}
					f_process_results_parcel(results, "search");
					document.getElementById("search_tally").innerHTML = "";
				});
			} else if (candidate.attributes.Addr_type === "PointAddress") {
				point = new Point(candidate.attributes.DisplayX,
										candidate.attributes.DisplayY,
										new SpatialReference(4326));
				Q_parcel_selection.geometry = point;
				QT_parcel_selection.execute(Q_parcel_selection, function (results) {
					f_process_results_parcel(results, "search");
					document.getElementById("search_tally").innerHTML = "";
				});
			}
			if (candidate_array.length > 0) {
				f_candidate_search(where, candidate_array);
			}
			search_progress.value = "1";
			search_progress.style.display = "none";
		});
	} else {
		search_progress.value = "1";
		search_progress.style.display = "none";
	}
}
function showResults(candidates) {
	"use strict";
	var muni = ["Carlstadt", "East Rutherford", "Little Ferry", "Lyndhurst", "Moonachie", "North Arlington", "Ridgefield", "Rutherford", "South Hackensack", "Teterboro", "Jersey City", "Kearny", "North bergen", "Secaucus"],
		where = [],
		muni_array,
		qual_array,
		Q_landuse,
		QT_landuse,
		where_qual,
		where_PID,
		landuse_array,
		score = 0,
		candidate_array = [],
		where_landuse,
		i,
		il;
	require(["dojo/_base/array", "dojo/query", "esri/tasks/query", "esri/tasks/QueryTask"], function (array, query, Query, QueryTask) {
		Q_landuse = new Query();
		Q_landuse.returnGeometry = false;
		Q_landuse.outFields = ["PID"];
		QT_landuse = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/9");
		if (document.getElementById("rdo_muni_searchSelect").checked) {
			muni_array = query(".s_muni_chk_item:checked");
			if (muni_array.length > 0) {
				var where_muni = "[MUN_CODE] IN (";
				array.forEach(muni_array, function (checkbox) {
					if (checkbox.checked) {
						where_muni += "'" + checkbox.value + "',";
					}
				});
				where_muni = where_muni.substring(0, where_muni.length - 1);
				where_muni += ")";
				where.push(where_muni);
			}
		}
		if (document.getElementById("rdo_qual_searchSelect").checked) {
			qual_array = query(".s_qual_chk_item:checked");
			if (qual_array.length > 0) {
				where_qual = "[QUALIFIER] in (";
				array.forEach(qual_array, function (checkbox) {
					if (checkbox.checked) {
						where_qual += "'" + checkbox.value + "',";
					}
				});
				where_qual = where_qual.substring(0, where_qual.length - 1);
				where_qual += ")";
				where.push(where_qual);
			}
		}
		array.forEach(candidates.addresses, function (candidate) {
			if (candidate.score >= score && (candidate.attributes.Addr_type === "StreetAddress" || candidate.attributes.Addr_type === "PointAddress") && muni.indexOf(candidate.attributes.City) > -1) {
				score = candidate.score;
				candidate_array.unshift(candidate);
			}
		});
		if (document.getElementById("rdo_landuse_searchSelect").checked) {
			landuse_array = query(".s_landuse_chk_item:checked");
			if (landuse_array.length > 0) {
				where_landuse = "where LANDUSE_CODE IN (";
				array.forEach(document.getElementsByName("s_landuse_chk_item"), function (checkbox) {
					if (checkbox.checked) {
						where_landuse += "'" + checkbox.value + "',";
					}
				});
				where_landuse = where_landuse.substring(0, where_landuse.length - 1);
				where_landuse += ")";
				Q_landuse.where = where_landuse;
				QT_landuse.execute(Q_landuse, function (results) {
					if (results.features.length > 0) {
						where_PID = "PID IN (";
						for (i = 0, il = results.features.length; i < il; i += 1) {
							where_PID += "'" + results.features[i].attributes.PID + "',";
						}
						where_PID = where_PID.substring(0, where_PID.length - 1);
						where_PID += ")";
						where.push(where_PID);
						f_candidate_search(where, candidate_array);
					}
				});
			} else {
				f_candidate_search(where, candidate_array);
			}
		} else {
			f_candidate_search(where, candidate_array);
		}
	});
}
function f_search_address(address_input) {
	"use strict";
	var search_progress = document.getElementById("search_progress");
	search_progress.style.display = "block";
	search_progress.value = "0";
	require(["esri/geometry/Extent", "esri/tasks/locator"], function (Extent, Locator) {
		if (isNaN(address_input.split(" ", 1)) || address_input === "") {
			search_progress.value = ".25";
			f_search_landuse(document.getElementById("address").value, document.getElementById("block").value, document.getElementById("lot").value);
		} else {
			var address = {"SingleLine": address_input},
				options = {address: address, outFields: ["Addr_type", "StName", "AddNum", "Xmax", "Ymax", "Xmin", "Ymin", "DisplayX", "DisplayY", "City", "geometry"], searchExtent: M_meri.extent},
				locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
			locator.on("address-to-locations-complete", showResults, function (evt) {
				showResults(evt);
			});
			locator.outSpatialReference = M_meri.spatialReference;
			search_progress.value = ".25";
			locator.addressToLocations(options);
		}
	});
}
function f_query_owners_results(results) {
	"use strict";
    require(["dojo/dom", "dojo/dom-construct"], function (dom, domConstruct) {
		var i,
			il,
			featureAttributes,
			e_li_owner,
			e_ul_owner_attrib,
			e_li_owner_attrib,
			e_strong_owner_attrib,
			e_li_owner_link,
			e_a_owner_link,
			att;
		for (i = 0, il = results.features.length; i < il; i += 1) {
			featureAttributes = results.features[i].attributes;
			e_li_owner = domConstruct.create("li",
														{"id": "r_owner_" + featureAttributes.OWNID,
														 "class": "search_owner_container owner_li",
														 "style": "display: block;"
														},
														"dropdown2");
			e_ul_owner_attrib = domConstruct.create("ul",
																 {"class": "ResultList",
																  "id": "findownerparcel_" + featureAttributes.OWNID},
																 e_li_owner);
			for (att in featureAttributes) {
				if (featureAttributes.hasOwnProperty(att)) {
					e_li_owner_attrib = domConstruct.create("li",
																		 {"innerHTML": ": " + featureAttributes[att]},
																		 e_ul_owner_attrib);
					e_strong_owner_attrib = domConstruct.create("strong",
																			  {"innerHTML": fieldAlias(att, "owner")},
																			  e_li_owner_attrib,
																			  "first");
				}
			}
			e_li_owner_link = domConstruct.create("li", null, e_ul_owner_attrib);
			e_a_owner_link = domConstruct.create("a",
															 {"class": "selection_a",
															  "id": "find_" + featureAttributes.OWNID,
															  "href": "#",
															  "innerHTML": "Find Owner Parcels",
															  "onClick": "f_query_owner_int_exec(" + featureAttributes.OWNID + "); return false;"},
															 e_li_owner_link);
	    }
	});
}
function f_search_owner(owner) {
	"use strict";
	if (owner !== "") {
		require(["esri/tasks/query", "esri/tasks/QueryTask"], function (Query, QueryTask) {
			var Q_owners = new Query(),
				QT_owners = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/5"),
				e_search_progress = document.getElementById("search_progress");
			Q_owners.returnGeometry = false;
			Q_owners.outFields = F_outFields.owner;
			Q_owners.where = "Where [NAME] LIKE '%" + owner + "%'";
			QT_owners.execute(Q_owners, f_query_owners_results);
			e_search_progress.value = "1";
			e_search_progress.style.display = "none";
		});
	}
}
function f_process_results_buffer(results) {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array"], function (domConstruct, array) {
	    var featureAttributes,
			link = document.getElementById("export"),
			GL_container = GL_buffer_selected_parcels,
			GL_count,
			G_symbol = S_feature_buffer_selection,
			graphic,
			popupTemplate,
			export_PID = [],
			i,
			il;
		for (i = 0, il = results.features.length; i < il; i += 1) {
			featureAttributes = results.features[i].attributes;
			export_PID.push(featureAttributes.PID);
			graphic = results.features[i];
			graphic.setSymbol(G_symbol);
			popupTemplate = f_getPopupTemplate(graphic);
			GL_container.add(graphic);
			GL_count = GL_container.graphics.length;
			M_meri.infoWindow.resize("300", "350");
		}
		link.href = "#";
		link.innerHTML = "Export to Excel: [" + export_PID.length + " item(s)]";
		link.onclick  = function () {
			f_export_excel(export_PID);
			return false;
		};
		link.style.display = "block";
	});
}
function f_multi_parcel_buffer_exec(distance) {
	"use strict";
	require(["esri/geometry/Polygon", "esri/SpatialReference", "esri/tasks/QueryTask", "esri/tasks/query", "esri/tasks/GeometryService",
             "esri/tasks/BufferParameters", "esri/graphic", "esri/graphic"], function (Polygon, SpatialReference, QueryTask, Query, GeometryService, BufferParameters, Graphic) {
		M_meri.infoWindow.hide();
		var multiparcel_geometries = new Polygon(new SpatialReference({"wkid": 102100})),
			m,
			bufferDistanceTxt = distance,
			bufferDistance,
			QT_parcel_selection_buffer,
			Q_parcel_selection_buffer,
			GeomS_parcel_buffer,
			BP_parcel_selection;
		for (m = 0; m < GL_parcel_selection.graphics.length; m += 1) {
			multiparcel_geometries.addRing(GL_parcel_selection.graphics[m].geometry.rings[0]);
		}
		if (!isNaN(bufferDistanceTxt) || (bufferDistanceTxt !== "")) {
			QT_parcel_selection_buffer = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0");
			Q_parcel_selection_buffer = new Query();
			bufferDistance = bufferDistanceTxt * 1.35;
			Q_parcel_selection_buffer.returnGeometry = true;
			Q_parcel_selection_buffer.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
			Q_parcel_selection_buffer.outFields = F_outFields.parcel;
			GeomS_parcel_buffer = new GeometryService(DynamicLayerHost + "/ArcGIS/rest/services/Map_Utility/Geometry/GeometryServer");
			BP_parcel_selection = new BufferParameters();
			BP_parcel_selection.geometries  = [multiparcel_geometries];
			GL_buffer_parcel = GL_parcel_selection;
			BP_parcel_selection.distances = [bufferDistance];
			BP_parcel_selection.unit = GeometryService.UNIT_FOOT;
			GeomS_parcel_buffer.buffer(BP_parcel_selection, function (geometries) {
				var graphic = new Graphic(geometries[0], S_buffer_buffer);
				GL_buffer_buffer.add(graphic);
				Q_parcel_selection_buffer.geometry = graphic.geometry;
				Q_parcel_selection_buffer.outFields = F_outFields.parcelB;
				QT_parcel_selection_buffer.execute(Q_parcel_selection_buffer, function (fset) {
					f_process_results_buffer(fset);
				});
			});
		}
	});
}
function f_getLocation(position) {
	"use strict";
	var y = position.coords.latitude,
		x = position.coords.longitude;
	require(["esri/geometry/Point", "esri/SpatialReference", "dojo/on"], function (Point, SpatialReference, on) {
		var point = new Point(x, y, new SpatialReference({ wkid: 4326 }));
		M_meri.centerAndZoom(point, 19);
	});
}
function e_load_tools() {
	"use strict";
	require(["dojo/on", "dojo/query", "dojo/dom-style", "dojo/fx", "dojo/window", "dojo/dom-class", "dojo/dom-construct", "esri/toolbars/navigation", "dojo/request/xhr", "dojo/NodeList-traverse"], function (On, Query, domStyle, coreFx, win, domClass, domConstruct, Navigation, xhr) {
		var pull = document.getElementById("pull"),
			header = document.getElementsByClassName("header-container")[0],
			map = document.getElementById("map"),
			nav_tabs = document.getElementById("nav_tabs"),
			buttons = document.getElementById("buttons"),
			logo = document.getElementById("logo"),
			pull_handler = new On(document.getElementById("pull"), "click", function (e) {
				if (document.getElementById("nav_tabs").style.width !== "80%") {
					header.style.left = "80%";
					header.style.position = "absolute";
					header.style.overflow = "hidden";
					header.style.width = "20%";
					nav_tabs.style.width = "80%";
					map.style.left = "80%";
					buttons.style.visibility = "hidden";
					logo.style.width = "135%";
					logo.style.visibility = "hidden";
				} else {
					header.removeAttribute("style");
					logo.removeAttribute("style");
					map.removeAttribute("style");
					buttons.removeAttribute("style");
					nav_tabs.style.width = "0";
				}
			}),
			zoomin_handler = new On(document.getElementById("zoomin"), "click", function (e) {
				navToolbar.activate(Navigation.ZOOM_IN);
				f_button_clicked("zoomin");
			}),
			location_handler = new On(document.getElementById("locate"), "click", function (e) {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(f_getLocation);
				} else {
					alert("Can't get Location");
				}
			}),
			zoomout_handler = new On(document.getElementById("zoomout"), "click", function (e) {
				navToolbar.activate(Navigation.ZOOM_OUT);
				f_button_clicked("zoomout");
			}),
			pan_handler = new On(document.getElementById("pan"), "click", function (e) {
				navToolbar.activate(Navigation.PAN);
				f_button_clicked("pan");
			}),
			extent_handler =  new On(document.getElementById("extent"), "click", function (e) {
				M_meri.centerAndZoom([-74.08456781356876, 40.78364440736023], 12);
			}),
			previous_handler = new On(document.getElementById("previous"), "click", function (e) {
				navToolbar.zoomToPrevExtent();
			}),
			next_handler = new On(document.getElementById("next"), "click", function (e) {
				navToolbar.zoomToNextExtent();
			}),
			indentify_handeler = new On(document.getElementById("identify"), "click", function (e) {
				navToolbar.activate(Navigation.PAN);
				tool_selected = "identify";
				f_button_clicked("identify");
			}),
			parcel_handler = new On(document.getElementById("parcel"), "click", function (e) {
				navToolbar.activate(Navigation.PAN);
				tool_selected = "parcel";
				f_button_clicked("parcel");
			}),
			measure_handler = new On(document.getElementById("measure"), "click", function (e) {
				navToolbar.activate(Navigation.PAN);
				tool_selected = "pan";
				f_button_clicked("measure");
				f_measure_map();
			}),
			ERIS_handler = new On(document.getElementById("ERIS"), "click", function (e) {
				navToolbar.activate(Navigation.PAN);
				tool_selected = 'ERIS_Identify';
				f_button_clicked("ERIS");
			}),
			clear_handler = new On(document.getElementById("clear"), "click", function (e) {
				f_map_clear();
			}),
			search_add_handler = new On(document.getElementById("search_add"), "click", function (e) {
				f_search_address(document.getElementById("address").value);
			}),
			search_own_handler = new On(document.getElementById("search_own"), "click", function (e) {
				f_search_owner(document.getElementById("txtQueryOwner").value);
			}),
			search_toggle_handler = new On(new Query(".search_toggle"), "click", function (e) {
				if (e.toElement.id === "filter") {
					if (this.style.color !== "rgb(222, 10, 10)") {
						this.innerHTML = "Search Options & Filters (-)";
					} else {
						this.innerHTML = "Search Options & Filters (+)";
					}
				}
				if (this.style.color !== "rgb(222, 10, 10)") {
					this.style.color = "#DE0A0A";
				} else {
					this.style.color = "#444";
				}
				new Query(this).siblings()[0].style.color = "#666";
				if (this.id === "owner_toggle") {
					new Query(".owner_li").forEach(function (node) {}).style("display", "block");
					new Query(".property_li").forEach(function (node) {}).style("display", "none");
				} else if (this.id === "property_toggle") {
					new Query(".owner_li").forEach(function (node) {}).style("display", "none");
					new Query(".property_li").forEach(function (node) {}).style("display", "block");
				}
			}),
			tab_click_handler = new On(new Query(".tab"), "click", function (e) {
				domClass.toggle(new Query(this).parent()[0], "active");
				new Query(this).parent().siblings().children("ul").forEach(function (node) {
					if (domStyle.get(node, "display") === "block") {
						domClass.toggle(new Query(node).parent()[0], "active");
						coreFx.wipeOut({node: node, duration: 100}).play();
					}
				});
				if (domStyle.get(new Query(this).siblings()[0], "display") === "block") {
					coreFx.wipeOut({node: new Query(this).siblings()[0], duration: 100}).play();
				} else {
					coreFx.wipeIn({node: new Query(this).siblings()[0], duration: 100}).play();
				}
			}),
			filter_handler = new On(document.getElementById("filter"), "click", function (e) {
				if (domStyle.get(new Query(this).siblings()[0], "display") === "block") {
					coreFx.wipeOut({node: new Query(this).siblings()[0], duration: 100}).play();
				} else {
					coreFx.wipeIn({node: new Query(this).siblings()[0], duration: 100}).play();
				}
			}),
			radio_handler = new On(new Query(".radio_filter"), "change", function (e) {
				if (domStyle.get(new Query(this).siblings("ul")[0], "display") === "block") {
					coreFx.wipeOut({node: new Query(this).siblings("ul")[0], duration: 100}).play();
				} else {
					coreFx.wipeIn({node: new Query(this).siblings("ul")[0], duration: 100}).play();
				}
			}),
			about_handler = new On(new Query(".about_a"), "click", function (e) {
				new Query(this).parent().siblings().children("ul").forEach(function (node) {
					if (domStyle.get(node, "display") === "block") {
						coreFx.wipeOut({node: node, duration: 100}).play();
					}
				});
				if (domStyle.get(new Query(this).siblings("ul")[0], "display") !== "block") {
					coreFx.wipeIn({node: new Query(this).siblings("ul")[0], duration: 100}).play();
				}
			}),
			buffer_handler = new On(new Query("#buffer_exe"), "click", function (e) {
				f_multi_parcel_buffer_exec(document.getElementById("buffer_distance").value);
			}),
			form_submit_handler = new On(document.getElementById("form_submit"), "submit", function (e) {
				sessionStorage.clear();
				document.cookie = "NJMC_MERI_ERIS" + '=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=.njmeadowlands.gov';
				document.location.reload(true);
			});
	});
}
function f_base_imagery_list_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array"], function (domConstruct, Array) {
		var e_li_title = domConstruct.create("li", {"id": "image_overlay", "class": "layer_group_title", "innerHTML": "Image Overlay"}, "dropdown1"),
			e_li = domConstruct.create("li", {"class": "image_layer_li"}, "dropdown1"),
			e_sel = domConstruct.create("select", {"onChange": "f_image_layer_toggle(this)", "class": "select_option"}, e_li),
			e_opt = domConstruct.create("option", {"innerHTML": "Default"}, e_sel);
		Array.forEach(imageryLayersJSON, function (img_lyr, index) {
			var e_opt = domConstruct.create("option", {value: img_lyr.id, innerHTML: img_lyr.title}, e_sel);
		});
		domConstruct.place(e_li, "dropdown1");
	});
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
		ERIS_base.setVisibleLayers(ERIS_visible);
	});
}
function f_li_highlight(checkbox) {
	"use strict";
	require(["dojo/query", "dojo/dom-class", "dojo/NodeList-traverse"], function (query, domClass) {
		domClass.toggle(query(checkbox).parent()[0], "li_checked");
	});
}
function f_ERIS_list_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/dom-attr", "dojo/_base/array"], function (domConstruct, domAttr, array) {
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
			e_legend_title = domConstruct.create("li", {"class": "legend_title", "innerHTML": "ERIS"}, e_legend_ul);
		array.forEach(map_layers_ERIS_json.layers, function (layer, index) {
			var e_li = domConstruct.create("li", {"class": "toc_layer_li"}, "dropdown1", "last"),
				e_chk = domConstruct.create("input", {"type": "checkbox", "class": "toc_layer_check ERIS_layer", "id": "ERIS_layer_" + layer.id}, e_li),
				e_legend = domConstruct.create("li", {"class": "legend_li legend_ERIS_li_" + layer.id, "innerHTML": layer.desc}, e_legend_ul),
				e_lbl;
			e_chk.onclick = function () {
				f_ESRI_list_update();
				f_li_highlight(this);
			};
			if (layer.vis) {
				domAttr.set(e_chk, "checked", "checked");
				domAttr.set(e_li, "class", "toc_layer_li li_checked");
			}
			if (layer.ident || (layer.id === 30)) {
				IP_Identify_Layers.push(layer.id);
			}
			e_lbl = domConstruct.create("label", {"for": "ERIS_layer_" + layer.id, "class": "toc_layer_label", "title": layer.descs, innerHTML: layer.name}, e_li);
		});
	});
}
function f_layer_list_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/dom-attr", "dojo/_base/array"], function (domConstruct, domAttr, array) {
		var e_li_title = domConstruct.create("li", {"class": "layer_group_title", "innerHTML": "Flooding Scenario:"}, "dropdown1"),
			e_li = domConstruct.create("li", null, "dropdown1"),
			e_sel_flood,
			e_opt_flood,
			e_li_flood,
			e_ul,
			e_li2,
			e_legend,
			mapLayersJSON = [{"name": "Environmental", "id": "environ", "layers":
							 [{"id": "14", "name": "FEMA Panel", "vis": 1, "ident": 1, "desc": "FEMA Panel"},
							  {"id": "25", "name": "Riparian Claim (NJDEP)", "vis": 0, "ident": 1, "desc": "Riparian Claim (NJDEP)"},
							  {"id": "27", "name": "FEMA (100-YR FLOOD)", "vis": 0, "ident": 1, "desc": "FEMA (100-YR FLOOD)"},
							  {"id": "28", "name": "Wetlands (DEP)", "vis": 0, "ident": 1, "desc": "Wetlands (DEP)"}]},
							{"name": "Hydro", "id": "hydro", "layers":
							 [{"id": 1, "name": "Tidegates", "vis": 1, "ident": 1, "desc": "Tidegates"},
							  {"id": 2, "name": "Creek Names", "vis": 1, "ident": 0, "desc": "Creek Names", "legend": "no"},
							  {"id": 13, "name": "Drainage", "vis": 1, "ident": 1, "desc": "Drainage"},
							  {"id": 23, "name": "Hydro Lines - Wetland Edge", "vis": 1, "ident": 1, "desc": "Hydro Lines - Wetland Edge"},
							  {"id": 24, "name": "Waterways", "vis": 0, "ident": 0, "desc": "Waterways"}]},
							{"name": "Infrastructure/Utilities", "id": "inf_util", "layers":
							 [{"id": 5, "name": "Stormwater Catchbasins", "vis": 0, "ident": 1, "desc": "Stormwater Catchbasins"},
							  {"id": 6, "name": "Stormwater Manholes", "vis": 0, "ident": 1, "desc": "Stormwater Manholes"},
							  {"id": 7, "name": "Stormwater Outfalls", "vis": 0, "ident": 1, "desc": "Stormwater Outfalls"},
							  {"id": 8, "name": "Stormwater Lines", "vis": 0, "ident": 1, "desc": "Stormwater Lines"},
							  {"id": 9, "name": "Sanitary Manhole", "vis": 0, "ident": 1, "desc": "Sanitary Manhole"},
							  {"id": 10, "name": "Sanitary Lines", "vis": 0, "ident": 1, "desc": "Sanitary Lines"},
							  {"id": 11, "name": "Hydrants", "vis": 1, "ident": 1, "desc": "Hydrants"}]},
							{"name": "Political/Jurisdiction", "id": "planning_cad", "layers":
							 [{"id": 3, "name": "NJMC District", "vis": 1, "ident": 0, "desc": "NJMC District"},
							  {"id": 4, "name": "Municipal Boundaries", "vis": 1, "ident": 0, "desc": "Municipal Boundaries"},
							  {"id": 20, "name": "Block Limit", "vis": 1, "ident": 0, "desc": "Block Limit"},
							  {"id": 21, "name": "Parcel Lines", "vis": 1, "ident": 0, "desc": "Parcel Lines"},
							  {"id": 26, "name": "Buildings", "vis": 0, "ident": 1, "desc": "Buildings"},
							  {"id": 31, "name": "Land Use", "vis": 0, "ident": 1, "desc": "Land Use"},
							  {"id": 32, "name": "Zoning", "vis": 0, "ident": 1, "desc": "Zoning"},
							  {"id": 22, "name": "Encumbrance/Easements", "vis": 0, "ident": 1, "desc": "Encumbrance/Easements"},
							  {"id": 30, "name": "Census Blocks 2010", "vis": 0, "ident": 0, "desc": "Census Blocks 2010"},
							  {"id" : 29, "name": "Voting Districts 2010", "vis": 0, "ident": 1, "desc": "Voting Districts 2010"}]},
							{"name": "Topographic & Planimetrics", "id": "topo_plan", "layers":
							 [{"id": 0, "name": "Spot Elevations", "vis": 0, "ident": 1, "desc": "Spot Elevations"},
							  {"id": 15, "name": "Fence Lines", "vis": 0, "ident": 1, "desc": "Fence Lines"},
							  {"id": 16, "name": "Contour Lines", "vis": 0, "ident": 1, "desc": "Contour Lines"}]},
							{"name": "Transportation", "id": "trans", "layers":
							 [{"id": 12, "name": "DOT Roads", "vis": 1, "ident": 1, "desc": "DOT Roads", "legend": "no"},
							  {"id": 19, "name": "Bridges - Overpass", "vis": 1, "ident": 0, "desc": "Bridges - Overpass"},
							  {"id": 17, "name": "Rails", "vis": 1, "ident": 1, "desc": "Rails"},
							  {"id": 18, "name": "Roads ROW", "vis": 1, "ident": 1, "desc": "Roads ROW", "legend": "no"}]}];
		array.forEach(mapLayersJSON, function (group, index) {
			var e_li_legend = domConstruct.create("li", null, "dropdown4"),
				e_li_title = domConstruct.create("li", {"class": "layer_group_title", "innerHTML": group.name + ":"}, "dropdown1"),
				e_ul_ltitle = domConstruct.create("ul", {"class": "legend_group_title", "innerHTML": '<li class="legend_title">' + group.name + "</li>"}, e_li_legend, "firsts");
			array.forEach(group.layers, function (layer, lyrIndex) {
				var e_li = domConstruct.create("li", {"class": "toc_layer_li"}, "dropdown1", "last"),
					e_chk = domConstruct.create("input", {"type": "checkbox", "class": "toc_layer_check", "id": "m_layer_" + layer.id, "onclick": "f_layer_list_update();f_legend_toggle(this);f_li_highlight(this);"}, e_li),
					e_lbl;
				if (layer.vis) {
					domAttr.set(e_chk, "checked", "checked");
					domAttr.set(e_li, "class", "toc_layer_li li_checked");
				}
				if (layer.ident || (layer.id === 30)) {
					IP_Identify_Layers.push(layer.id);
				}
				e_lbl = domConstruct.create("label", {"for": "m_layer_" + layer.id, "class": "toc_layer_label", "title": layer.descs, innerHTML: layer.name}, e_li);
				if (layer.legend !== "no") {
					array.forEach(map_legend.layers[layer.id].legend, function (layer_legend) {
						var legend_text = "",
							e_legend;
						if (layer_legend.label !== "") {
							legend_text = layer_legend.label;
						} else {
							legend_text = layer.name;
						}
						e_legend = domConstruct.create("li", {"class": "legend_li legend_li_" + layer.id, "innerHTML": "<img src=\"" + DynamicLayerHost + "/ArcGIS/rest/services/Municipal/MunicipalMap_live/MapServer/1/images/" + layer_legend.url + "\"class=\"legend_img\" alt=\"error\" /> " + legend_text}, e_ul_ltitle, "last");
						if (layer.vis !== 1) {
							domAttr.set(e_legend, "style", "display:none");
						}
					});
				}
			});
			if (e_ul_ltitle.childNodes.length < 2) {
				domAttr.set(e_ul_ltitle, "style", "display:none");
			}
		});
		e_sel_flood = domConstruct.create("select", {"onChange": "f_layer_list_flood_update(this)", "class": "select_option"}, e_li);
		e_opt_flood = domConstruct.create("option", {"innerHTML": "No tidal sruge"}, e_sel_flood);
		array.forEach(map_layers_flooding_json.scenarios, function (scenario, index) {
			var e_opt_flood = domConstruct.create("option", {"id": "m_layer_flood_" + scenario.lyr, "innerHTML": scenario.group + " Foot Tidal Surge"}, e_sel_flood);
		});
		e_li_flood = domConstruct.create("li", null, "dropdown4");
		e_ul = domConstruct.create("ul", {"id": "flooding_leg", "class": "legend_type"}, e_li_flood);
		e_li2 = domConstruct.create("li", {"class": "legend_title", "style": "text-decoration:underline", "innerHTML": "Flooding Scenario"}, e_ul);
		e_legend = domConstruct.create("li", {"class": "legend_li", "id": "legend_li_18", "innerHTML": '<img src="http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Flooding/Flooding_Scenarios/MapServer/2/images/C5A8CAC6" class="legend_img" alt="error" />Flooding due to tidal surge<br>' + '<img src="http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/Flooding/Flooding_Scenarios/MapServer/3/images/5ABA6602" class="legend_img" alt="error" />Predicted Flooding in absence of tidegates'}, e_ul);
	});
}
function f_search_munis_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array"], function (domConstruct, array) {
		array.forEach(munis_json, function (muni, index) {
			var e_li_muni = domConstruct.create("li", {"class": "muniCheckRow"}, "search_munis"),
				e_chk_muni = domConstruct.create("input", {type: "checkbox", "id": "chk_muni_" + muni.muncode, "name": "s_muni_chk_item", "class": "s_muni_chk_item", "value": muni.muncode}, e_li_muni),
				e_lbl_muni = domConstruct.create("label", {"for": "chk_muni_" + muni.muncode, "class": "search_muni_label", "innerHTML": muni.mun}, e_li_muni);
		});
	});
}
function f_search_qual_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array"], function (domConstruct, array) {
		array.forEach(quals_json, function (qual, index) {
			var e_li_qual = domConstruct.create("li", {"class": "qualCheckRow"}, "search_qual"),
				e_chk_qual = domConstruct.create("input", {"type": "checkbox", "id": "chk_qual_" + qual.id, "name": "s_qual_chk_item", "class": "s_qual_chk_item", "value": qual.id}, e_li_qual),
				e_lbl_qual = domConstruct.create("label", {"for": "chk_qual_" + qual.id, "class": "search_qual_label", "innerHTML": qual.name}, e_li_qual);
		});
	});
}
function f_search_landuse_build() {
	"use strict";
	require(["dojo/dom-construct", "dojo/_base/array"], function (domConstruct, array) {
		array.forEach(landuse_json, function (landuse, index) {
			var e_li_landuse = domConstruct.create("li", {"class": "landuseCheckRow"}, "search_landuse"),
				e_chk_landuse = domConstruct.create("input", {type: "checkbox", "id": "chk_landuse_" + landuse.code, "class": "s_landuse_chk_item", "name": "s_landuse_chk_item", "value": landuse.code}, e_li_landuse),
				e_lbl_landuse = domConstruct.create("label", {"for": "chk_landuse_" + landuse.code, "class": "search_landuse_label", "innerHTML": landuse.name}, e_li_landuse);
		});
	});
}
function f_image_layer_toggle(sel) {
	"use strict";
	var img_layer = sel.options[sel.selectedIndex].value;
	if (IL_buttonmap !== undefined) {
		M_meri.removeLayer(IL_buttonmap);
	}
	if (img_layer !== "") {
		require(["esri/layers/ArcGISImageServiceLayer"], function (ArcGISImageServiceLayer) {
			IL_buttonmap = new ArcGISImageServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/Imagery/" + img_layer + "/ImageServer");
			M_meri.addLayer(IL_buttonmap, 1);
		});
	}
}
function f_base_map_toggle(sel) {
	"use strict";
	var base_map = sel.options[sel.selectedIndex].value;
	if (base_map !== "") {
		M_meri.setBasemap(base_map);
	} else {
		M_meri.setBasemap("satellite");
	}
}
function f_layer_list_update() {
	"use strict";
	require(["dojo/query"], function (query) {
		var inputs = query(".toc_layer_check"),
			LD_visible = [];
		require(["dojo/_base/array"], function (array) {
			array.forEach(inputs, function (input) {
				if (input.checked) {
					LD_visible.push(input.id.replace("m_layer_", ""));
				}
			});
		});
		if (LD_visible.length === 0) {
			LD_visible.push(-1);
		}
		LD_button.setVisibleLayers(LD_visible);// update the map layer visibilities
	});
}
function f_layer_list_flood_update(sel) {
	"use strict";
	var inputs = sel.options[sel.selectedIndex].id;
	if (inputs === "") {
		LD_flooding.setVisibleLayers([-1]);
	} else {
		LD_flooding.setVisibleLayers([inputs.substring(inputs.lastIndexOf("_") + 1, inputs.length)]);
	}
}
function f_legend_toggle(layer) {
	"use strict";
	var x = layer.id,
		clas = (x.substring(x.lastIndexOf("_") + 1, x.length));
	require(["dojo/query"], function (query) {
		query(".legend_li_" + clas).forEach(function (node) {
			if (node.style.display === "none") {
				node.style.display = "block";
			} else {
				node.style.display = "none";
			}
		});
	});
}
function f_hide_owner_parcels(ownerid) {
	"use strict";
	var elem = document.getElementsByClassName("owner_parcels_" + ownerid),
		index = 0;
	for (index = 0; index < elem.length; index += 1) {
		elem[index].remove();
	}
}
function f_query_owner_int_exec(ownerid) {
	"use strict";
	require(["esri/tasks/QueryTask", "esri/tasks/RelationshipQuery", "esri/tasks/query"], function (QueryTask, RelationshipQuery, Query) {
		var findparcels = document.getElementById("find_" + ownerid),
			GV_current_ownerid,
			QT_owner_int,
			Q_owner_int,
			QT_parcel_selection;
		if (findparcels.innerHTML === "Find Owner Parcels") {
			GV_current_ownerid = ownerid;
			QT_owner_int = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/8");
			QT_parcel_selection = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0");
			Q_owner_int = new Query();
			Q_owner_int.where = "Where [OWNERID] = " + ownerid;
			QT_owner_int.executeForIds(Q_owner_int, function (results) {
				if (results) {
					var QT_owner_parcels = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/8"),
						Q_owner_parcels = new RelationshipQuery(),
						Q_parcel_selection = new Query();
					Q_owner_parcels.relationshipId = 11;
					Q_owner_parcels.returnGeometry = false;
					Q_owner_parcels.objectIds = [results];
					Q_owner_parcels.outFields = ["PID"];
					Q_parcel_selection.outSpatialReference = {wkid: 3857};
					Q_parcel_selection.returnGeometry = true;
					Q_parcel_selection.outFields = F_outFields.parcel;
					QT_owner_parcels.executeRelationshipQuery(Q_owner_parcels, function (featureSets) {
						var where_PID = "PID IN (",
							featureSet,
							i,
							il;
						for (featureSet in featureSets) {
							if (featureSets.hasOwnProperty(featureSet)) {
								for (i = 0, il = featureSets[featureSet].features.length; i < il; i += 1) {
									where_PID += "'" + featureSets[featureSet].features[i].attributes.PID + "',";
								}
							}
						}
						where_PID = where_PID.substring(0, where_PID.length - 1);
						where_PID += ")";
						Q_parcel_selection.where = where_PID;
						QT_parcel_selection.execute(Q_parcel_selection, function (results) {
							f_process_results_parcel(results, "owner_" + ownerid);
						});
						Q_parcel_selection.where = "";
					});
				}
			});
			findparcels.onclick = function (e) {
				var toElem = e.originalTarget || e.toElement || e.srcElement;
				toElem.innerHTML = "Find Owner Parcels";
				toElem.onclick = null;
				toElem.onclick = function () {
					f_query_owner_int_exec(ownerid);
					return false;
				};
				f_hide_owner_parcels(ownerid);
				
			};
			findparcels.innerHTML = "Hide Owner Parcels";
		}
	});
}
function f_result_detail(type, target_el, pid) {
	"use strict";
	require(["esri/tasks/QueryTask", "esri/tasks/query", "esri/tasks/RelationshipQuery", "dojo/dom-construct"], function (QueryTask, Query, RelationshipQuery, domConstruct) {
		var QT_det_landuse = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/9"),
			Q_det_landuse = new Query(),
			QT_det_zoning = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/7"),
			Q_det_zoning = new Query(),
			QT_det_owners_int = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/8"),
			Q_det_owners_int = new Query(),
			QT_det_owners = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/8"),
			Q_det_owners = new RelationshipQuery();
		Q_det_landuse.returnGeometry = false;
		Q_det_landuse.outFields = ["LANDUSE_CODE", "MAP_ACRES"];
		Q_det_landuse.where = "PID = " + pid;
		Q_det_zoning.returnGeometry = false;
		Q_det_zoning.outFields = ["ZONE_CODE", "MAP_ACRES"];
		Q_det_zoning.where = "PID = " + pid;
		Q_det_owners_int.returnGeometry = false;
		Q_det_owners_int.where = "PID = " + pid;
		Q_det_owners.relationshipId = 10;
		Q_det_owners.returnGeometry = false;
		Q_det_owners.outFields = ["NAME", "ADDRESS", "CITY_STATE", "ZIPCODE"];
		document.getElementById("detail_view_a_" + pid).remove();
		QT_det_landuse.execute(Q_det_landuse, function (results) {
			var i,
				il,
				featureAttributes,
				output,
				attr;
			for (i = 0, il = results.features.length; i < il; i += 1) {
				featureAttributes = results.features[i].attributes;
				output = document.getElementById(target_el);
				for (attr in featureAttributes) {
					if (featureAttributes.hasOwnProperty(attr)) {
						output.innerHTML += formatResult(attr, results.features[i].attributes[attr], "selection selection_more");
					}
				}
			}
		});
		QT_det_zoning.execute(Q_det_zoning, function (results) {
			var i,
				il,
				featureAttributes,
				output,
				attr;
			for (i = 0, il = results.features.length; i < il; i += 1) {
				featureAttributes = results.features[i].attributes;
				output = document.getElementById("parcelinfo_ul_" + pid);
				for (attr in featureAttributes) {
					if (featureAttributes.hasOwnProperty(attr)) {
						output.innerHTML += formatResult(attr, results.features[i].attributes[attr], "selection selection_more");
					}
				}
			}
		});
		QT_det_owners_int.executeForIds(Q_det_owners_int, function (ids) {
			Q_det_owners.objectIds = [ids];
			QT_det_owners.executeRelationshipQuery(Q_det_owners, function (featureSets) {
				var featureSet,
					i,
					il,
					featureAttributes,
					output,
					attr;
				for (featureSet in featureSets) {
					if (featureSets.hasOwnProperty(featureSet)) {
						for (i = 0, il = featureSets[featureSet].features.length; i < il; i += 1) {
							featureAttributes = featureSets[featureSet].features[i].attributes;
							output = document.getElementById("parcelinfo_ul_" + pid);
							for (attr in featureAttributes) {
								if (featureAttributes.hasOwnProperty(attr)) {
									output.innerHTML += formatResult(attr, featureAttributes[attr], "selection selection_more");
								}
							}
						}
					}
				}
			});
		});
	});
}
function f_search_add_selections(graphics) {
	"use strict";
	var feature_div = "selParcel_",
		object_attr = "PID";
	require(["dojo/_base/array", "dojo/dom-construct"], function (array, domConstruct) {
		array.forEach(graphics, function (graphic) {
			var featureAttributes = graphic.attributes,
				el_featureAttribs = domConstruct.create("li", {"class": "search_parcel_container", "id": "parcelinfo_" + featureAttributes[object_attr]}, "dropdown3"),
				output = domConstruct.create("ul", {"class": "ResultList SelectionResult", "id": "parcelinfo_ul_added_" + featureAttributes[object_attr]}, el_featureAttribs),
				el_parcel,
				el_featureToolPrint,
				el_viewMoreToggle,
				el_viewMoreToggleLink,
				attr;
			for (attr in featureAttributes) {
				if (featureAttributes.hasOwnProperty(attr)) {
					output.innerHTML += formatResult(attr, featureAttributes[attr], "selection");
				}
			}
			el_parcel = domConstruct.create("li", {"id": feature_div + featureAttributes[object_attr], "class": "dParcelItem"}, output, "first");
			el_featureToolPrint = domConstruct.create("a", {"href": "./print/parcel_info.html" + featureAttributes[object_attr], "target": "_blank", "innerHTML": "Print", "class": "search_a feature_tool"}, el_parcel);
			el_viewMoreToggle = domConstruct.create("li",
																 {"class": "lSummaryToggle"},
																 output);
			el_viewMoreToggleLink = domConstruct.create("a",
																	  {"id": "detail_view_a_" + featureAttributes[object_attr],
																		"class": "selection_a",
																		"href": "#",
																		"innerHTML": "-- View More --",
																		"onClick": 'f_result_detail("parcel","' + output.id + '",' + featureAttributes[object_attr] + ");return false;"},
																	  el_viewMoreToggle);
			array.forEach(["Remove", "Zoom", "Pan", "Flash"], function (a) {
				var el_featureTool = domConstruct.create("a",
																	  {"href": "#",
																		"class": "search_a feature_tool",
																		"innerHTML": a,
																		onclick: 'f_feature_action("' + a + '","' + output.id + '","' + featureAttributes[object_attr] + '");return false;'},
																	  el_parcel);
			});
		});
	});
}
function f_feature_action(funct, target, oid) {
	"use strict";
	oid = parseInt(oid, 10);
	var graphics_layer = GL_parcel_selection,
		graphics_layer2 = GL_buffer_selected_parcels,
		buffer_li = document.getElementsByClassName("buffer"),
		i,
		j,
		i2,
		x,
		graphic,
		x2,
		index;
	switch (funct) {
	case "Add to Selection":
		for (i = 0; i < graphics_layer.graphics.length; i += 1) {
			if (graphics_layer.graphics[i].attributes.PID === oid) {
				f_search_add_selections([graphics_layer.graphics[i]]);
			}
		}
		for (j = 0; j < buffer_li.length; j += 1) {
			buffer_li[j].style.display = "block";
		}
		break;
	case "Quick Buffer":
		for (i2 = 0; i2 < graphics_layer.graphics.length; i2 += 1) {
			if (graphics_layer.graphics[i2].attributes.PID === oid) {
				f_search_add_selections([graphics_layer.graphics[i2]]);
			}
		}
		f_multi_parcel_buffer_exec(200);
		break;
	case "Zoom":
		for (x = 0; x < graphics_layer.graphics.length; x += 1) {
			
			graphic = graphics_layer.graphics[x];
			if (graphic.attributes.PID === oid) {
				M_meri.setExtent(graphic.geometry.getExtent().expand(1.3), true);
				break;
			}
		}
		break;
	case "Pan":
		for (x = 0; x < graphics_layer.graphics.length; x += 1) {
			graphic = graphics_layer.graphics[x];
			if (graphic.attributes.PID === oid) {
				M_meri.centerAt(graphic.geometry.getExtent().getCenter());
				break;
			}
		}
		break;
	case "Flash":
		require(["dojo/_base/Color", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol"], function (Color, SimpleFillSymbol, SimpleLineSymbol) {
			for (x = 0; x < graphics_layer.graphics.length; x += 1) {
				if (graphics_layer.graphics[x].attributes.PID === oid) {
					index = x;
					break;
				}
			}
			var divParcel = document.getElementById(target),
				divFlashColor = new Color([52, 83, 130, 0.95]),
				curSymbol = graphics_layer.graphics[index].symbol,
				flashSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, divFlashColor, 2), new Color([0, 255, 36, 0.5]));
			divParcel.scrollIntoView();
			graphics_layer.graphics[index].setSymbol(flashSymbol);
			divParcel.style.backgroundColor = new Color([0, 255, 36, 0.5]);
			setTimeout(function () {
				graphics_layer.graphics[index].setSymbol(curSymbol);
				divParcel.style.backgroundColor = "";
				setTimeout(function () {
					graphics_layer.graphics[index].setSymbol(flashSymbol);
					divParcel.style.backgroundColor = new Color([0, 255, 36, 0.5]);
					setTimeout(function () {
						graphics_layer.graphics[index].setSymbol(curSymbol);
						divParcel.style.backgroundColor = "";
					}, 750);
				}, 750);
			}, 750);
		});
		break;
	case "Remove":
		for (x = 0; x < graphics_layer.graphics.length; x += 1) {
			if (graphics_layer.graphics[x].attributes.PID === oid) {
				document.getElementById("parcelinfo_" + oid).remove();
				if (document.getElementById("parcelinfo_" + oid) === null && document.getElementById("parcel_ser_info_" + oid) === null) {
					graphics_layer.remove(graphics_layer.graphics[x]);
				}
			}
		}
		break;
	case "Remove Result":
		for (x = 0; x < graphics_layer.graphics.length; x += 1) {
			if (graphics_layer.graphics[x].attributes.PID === oid) {
				document.getElementById("parcel_ser_info_" + oid).remove();
				if (document.getElementById("parcelinfo_" + oid) === null && document.getElementById("parcel_ser_info_" + oid) === null) {
					graphics_layer.remove(graphics_layer.graphics[x]);
				}
			}
		}
		break;
	case "Remove Buffered":
		for (x = 0; x < graphics_layer2.graphics.length; x += 1) {
			if (graphics_layer2.graphics[x].attributes.PID === oid) {
				graphics_layer2.remove(graphics_layer2.graphics[x]);
				document.getElementById("parcelinfo_" + oid).remove();
			}
		}
		break;
	}
	return false;
}
function f_multi_parcel_buffer_exec(distance) {
	"use strict";
	require(["esri/geometry/Polygon", "esri/SpatialReference", "esri/tasks/QueryTask", "esri/tasks/query", "esri/tasks/GeometryService",
             "esri/tasks/BufferParameters", "esri/graphic", "esri/graphic"], function (Polygon, SpatialReference, QueryTask, Query, GeometryService, BufferParameters, Graphic) {
		M_meri.infoWindow.hide();
		var multiparcel_geometries = new Polygon(new SpatialReference({"wkid": 102100})),
			m,
			bufferDistanceTxt = distance,
			bufferDistance,
			QT_parcel_selection_buffer,
			Q_parcel_selection_buffer,
			GeomS_parcel_buffer,
			BP_parcel_selection;
		for (m = 0; m < GL_parcel_selection.graphics.length; m += 1) {
			multiparcel_geometries.addRing(GL_parcel_selection.graphics[m].geometry.rings[0]);
		}
		if (!isNaN(bufferDistanceTxt) || (bufferDistanceTxt !== "")) {
			QT_parcel_selection_buffer = new QueryTask(DynamicLayerHost + "/ArcGIS/rest/services/Parcels/NJMC_Parcels_2011/MapServer/0");
			Q_parcel_selection_buffer = new Query();
			bufferDistance = bufferDistanceTxt * 1.35;
			Q_parcel_selection_buffer.returnGeometry = true;
			Q_parcel_selection_buffer.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
			Q_parcel_selection_buffer.outFields = F_outFields.parcel;
			GeomS_parcel_buffer = new GeometryService(DynamicLayerHost + "/ArcGIS/rest/services/Map_Utility/Geometry/GeometryServer");
			BP_parcel_selection = new BufferParameters();
			BP_parcel_selection.geometries  = [multiparcel_geometries];
			GL_buffer_parcel = GL_parcel_selection;
			BP_parcel_selection.distances = [bufferDistance];
			BP_parcel_selection.unit = GeometryService.UNIT_FOOT;
			GeomS_parcel_buffer.buffer(BP_parcel_selection, function (geometries) {
				var graphic = new Graphic(geometries[0], S_buffer_buffer);
				GL_buffer_buffer.add(graphic);
				Q_parcel_selection_buffer.geometry = graphic.geometry;
				Q_parcel_selection_buffer.outFields = F_outFields.parcelB;
				QT_parcel_selection_buffer.execute(Q_parcel_selection_buffer, function (fset) {
					f_process_results_buffer(fset);
				});
			});
		}
	});
}
function f_deviceCheck() {
	"use strict";
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
		var oldlink = document.getElementsByTagName("link").item(3),
			newlink = document.createElement("link");
		newlink.setAttribute("rel", "stylesheet");
		newlink.setAttribute("type", "text/css");
		newlink.setAttribute("href", "css/erisv3_mobile.css");
		document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
	}
	document.getElementsByClassName("header-container")[0].style.display = "block";
}
function f_startup() {
	"use strict";
	document.getElementById("useraccount").innerHTML = sessionStorage.username;
	require(["esri/tasks/geometry", "esri/tasks/query", "esri/layers/FeatureLayer", "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters", "esri/toolbars/navigation", "esri/tasks/GeometryService", "esri/tasks/locator", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/GraphicsLayer", "esri/map", "esri/geometry/Point", "dojo/dom-construct", "esri/tasks/QueryTask", "esri/tasks/query", "esri/SpatialReference", "dojo/on", "esri/dijit/Measurement", "esri/config", "esri/dijit/PopupMobile", "esri/dijit/Popup"], function (geometry, query, FeatureLayer, IdentifyTask, IdentifyParameters, Navigation, GeometryService, Locator, ArcGISDynamicMapServiceLayer, GraphicsLayer, Map, Point, domConstruct, QueryTask, Query, SpatialReference, on, Measurement, config, PopupMobile, Popup) {
		config.defaults.io.alwaysUseProxy = false;
		config.defaults.io.proxyUrl = DynamicLayerHost + "/proxy/proxy.ashx"; // set the default geometry service 
		config.defaults.geometryService = new GeometryService(DynamicLayerHost + "/ArcGIS/rest/services/Map_Utility/Geometry/GeometryServer");
		// set dynamic layer for MunicipalMap_live
		LD_button = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/Municipal/MunicipalMap_live/MapServer", {opacity: 0.8});
		LD_flooding = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/Flooding/Flooding_Scenarios/MapServer", {opacity: 0.65});
		ERIS_base = new ArcGISDynamicMapServiceLayer(DynamicLayerHost + "/ArcGIS/rest/services/ERIS/ERIS/MapServer", {opacity: 1});
		GL_parcel_selection = new GraphicsLayer({opacity: 0.60});
		GL_buffer_parcel = new GraphicsLayer({opacity: 0.60});
		GL_buffer_buffer = new GraphicsLayer({opacity: 0.60});
		GL_buffer_selected_parcels = new GraphicsLayer({opacity: 0.60});
		var e_info = document.createElement("div"),
			infowindow;
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
			infowindow = new PopupMobile(null, e_info);
		} else {
			infowindow = new Popup({
				hightlight: false,
				titleInBody: true
			}, e_info);
		}
		M_meri = new Map("map", {basemap: "satellite",
										 center: [-74.08456781356876, 40.78364440736023],
										 zoom: 12,
										 sliderStyle: "small",
										 navigationMode: "css-transforms",
										 fadeOnZoom: true,
										 logo: false,
										 minZoom: 12,
										 infoWindow: infowindow});
		on(M_meri, "click", function (e) {
			f_map_click_handler(e);
		});
		on(M_meri, "load", function (e) {
			navToolbar = new Navigation(M_meri);
			measurementDijit = new Measurement({map: M_meri}, document.getElementById("dMeasureTool"));
			measurementDijit.startup();
			e_load_tools();
		});
		on(LD_button, "load", function (e) {
			f_base_imagery_list_build();
			f_ERIS_list_build();
			f_layer_list_build();
			f_search_munis_build();
			f_search_qual_build();
			f_search_landuse_build();
		});
		M_meri.addLayers([LD_button, ERIS_base, LD_flooding]);
		M_meri.addLayer(GL_parcel_selection);
		M_meri.addLayer(GL_buffer_selected_parcels);
		M_meri.addLayer(GL_buffer_parcel);
		M_meri.addLayer(GL_buffer_buffer);
	});
}
f_deviceCheck();
f_startup();