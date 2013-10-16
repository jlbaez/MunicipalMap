<?php
require_once '/Classes/PHPExcel.php';

PHPExcel_Shared_Font::AUTOSIZE_METHOD_EXACT;

$objPHPExcel = new PHPExcel();
$objPHPExcel->getProperties()
		->setCreator("Munipal Maps")
		->setTitle("Meri Parcel Export")
		->setDescription("A spreadsheet of parcel selection")
		->setKeywords("Meri Parcels Municipal Map")
		->setCategory("Municipal Map");
		
$arcgis_rest_point = "http://webmaps.njmeadowlands.gov/ArcGIS/rest/services/";
$arcgis_rest_service = "Parcels/NJMC_Cadastral/MapServer/";
$arcgis_rest_url_base = $arcgis_rest_point . $arcgis_rest_service;

$rest_layers = array(
	"Parcel" 	=> array( "layer" => "Parcel", 				"layer_id" => "0", "layer_outfields" => "PID,PAMS_PIN,MUN_CODE,BLOCK,LOT,OLD_BLOCK,OLD_LOT,FACILITY_NAME,PROPERTY_ADDRESS"),
	"LandUse" 	=> array( "layer" => "TBL_CAD_LANDUSE", 	"layer_id" => "9", "layer_outfields" => "*"), 
	"Zoning" 	=> array( "layer" => "TBL_CAD_ZONING", 		"layer_id" => "7", "layer_outfields" => "*"),
	"Owner" 	=> array( "layer" => "TBL_CAD_INTERMEDIATE","layer_id" => "8", "layer_outfields" => "PID,OBJECTID,PERCENT_OWNED"),
	"Owners"	=> array( "layer" => "TBL_CAD_OWNER",		"layer_id" => "8", "layer_outfields" => "OWNID,NAME,ADDRESS,CITY_STATE,ZIPCODE")
);

function html_array_vert_table($array){
  echo "<table cellspacing=\"0\" border=\"2\">\n";
  array_to_vertical_table($array, 1, 0);
  echo "</table>\n";
}

function td_offset($level){
    $td_offset = "";
    for ($i=1; $i<$level;$i++){
		$td_offset = $td_offset . "<td></td>";
    }
    return $td_offset;
}

function array_to_vertical_table($array, $level, $sub){
    // is the current position an array
	if (is_array($array) == 1){          
       
		foreach($array as $ary_key => $val) {
			$offset = "";
		   
		   // test to see if array is multi dimensional
			if (is_array($val) == 1){
				echo "<tr>";
				$offset = td_offset($level);
				echo $offset . "<td>" . $ary_key . "</td>";
				array_to_vertical_table($val, $level+1, 1);
			}
			else{                        
				// test is sub array is the first one or not. is 
				if ($sub != 1){          
					echo "<tr class=\"no_sub_array\">";
					$offset = td_offset($level);
				}
				$sub = 0;
				echo $offset . "<td main ".$sub." width=\"120\">" . $ary_key . "</td><td width=\"120\">" . $val . "</td>"; 
				echo "</tr>\n";
           }
		}
    }  
    else{ 
		// not an array, return nothing
        return;
    }
}
		
foreach(range('A','M') as $columnID) 
{
	$objPHPExcel->getActiveSheet()->getColumnDimension($columnID)->setAutoSize(true);
}

 $objPHPExcel->setActiveSheetIndex(0)
        ->setCellValue('A1', 'PID')
        ->setCellValue('B1', 'PAMS PIN')
        ->setCellValue('C1', 'Muni Code')
        ->setCellValue('D1', 'Block')
        ->setCellValue('E1', 'Lot')
        ->setCellValue('F1', 'Old Block')
        ->setCellValue('G1', 'Old Lot')
        ->setCellValue('H1', 'Facility Name')
		->setCellValue('I1', 'Property Address')
        ->setCellValue('J1', 'OwnID')
        ->setCellValue('K1', 'Name')
        ->setCellValue('L1', 'Owner Address')
        ->setCellValue('M1', 'City, State')
        ->setCellValue('N1', 'Zipcode');
		
//$objPHPExcel->getStyle('M')->getNumberFormat()->setFormatCode( PHPExcel_Style_NumberFormat::FORMAT_TEXT );
	
$objPHPExcel->getActiveSheet()->getStyle("A1:B1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("C1:D1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("E1:F1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("G1:H1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("I1:J1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("K1:L1")->getFont()->setBold(true);
$objPHPExcel->getActiveSheet()->getStyle("M1")->getFont()->setBold(true);

/////////////////////////////////////////////////////////////////////
// GENERAL PROCESSING FUNCTIONS.. DETAILS DESCRIBED IN FUNCTION
/////////////////////////////////////////////////////////////////////

// this function will urlencode the outfield list by replaceing commas with %2C
	

	
function query_encode_field_list($parcel_objfields,$layer){
	return  str_replace(",","%2C",$parcel_objfields[$layer]);
}

function query_encode_whereclause($field,$values){
	return  $field . "+IN%28" . str_replace(",","%2C",$pid_list). "%29";
}

// this function will create the whereclause with PID IN ( pid_list ), by replacing commas with %2C
function query_encode_pid_whereclause($pid_list){
	return "PID+IN+%28" . str_replace(",","%2C",$pid_list). "%29" ;
}

// this function will create the appropriate query string
function query_url_create($pid_list, $layer, $layer_id, $parcel_obj_fields){
	
	if($layer=="Owner"){
		return "/query?where=". query_encode_pid_whereclause($pid_list)."&returnGeometry=false&outFields=" . $parcel_obj_fields . "&f=json";
	}
	else return "/query?where=". query_encode_pid_whereclause($pid_list)."&returnGeometry=false&outFields=" . $parcel_obj_fields . "&f=json";
}

function array_comma_list($ary){
	return implode("%2C",$ary);
}

// not necessary
function delim_list_array($delim,$comma_list){
	return explode($delim,$comma_list);
}

function lookup_mun($mun){

	switch($mun){
		case '0205': return 'Carlstadt'; break;
		case '0212': return 'East Rutherford'; break;
		case '0906': return 'Jersey City'; break;
		case '0907': return 'Kearny'; break;
		case '0230': return 'Little Ferry'; break;
		case '0232': return 'Lyndhurst'; break;
		case '0237': return 'Moonachie'; break;
		case '0239': return 'North Arlington'; break;
		case '0908': return 'North Bergen'; break;
		case '0249': return 'Ridgefield'; break;
		case '0256': return 'Rutherford'; break;
		case '0909': return 'Secaucus'; break;
		case '0259': return 'South Hackensack'; break;
		case '0262': return 'Teterboro'; break;
	}
	
}

function tbltd($attr_val,$id='',$style=''){ return '<td '. ($id!=''? 'id="'.$id.'" ':'') . ($style!=''? 'style="'.$style.'" ':'') . '>' . $attr_val . '</td>';}
function tblth($attr_val,$id='',$style=''){ return '<th '. ($id!=''? 'id="'.$id.'" ':'') . ($style!=''? 'style="'.$style.'" ':'') . '>' . $attr_val . '</th>';}

/////////////////////////////////////////
// PROCESS THE QUERY STRING PARAMETERS
/////////////////////////////////////////

// get PID from query string
if(isset($_POST['PID']))
{
  // this would be used if only one parcel was queried
  if(count($_POST["PID"]) > 0)
    $parcel_selected = $_POST["PID"][0];
}


$excel = true;

// get PID List from query string
if(isset($_POST['PID'])){
	// this is a list of Parcel IDs that will all be returned
	
	// BK - this can be scrubbed for non numbers and trailing commas
	$parcel_pid_list = implode(",", $_POST['PID']);
	
	// create an array from the comma list of PIDs from the query string.. 
	// this will be used to iterate through all the requested parcels.
	
	$parcel_pid_list_ary = explode(",", $_POST['PID']);
}
else{
	die("This page does not accept thIS form of data request.");
}

// general debugging settings and configuration triggers
if(isset($_GET['debug'])){
	if($_GET['debug'] == "details")
	$parcel_output_debug = true;
}
else{
	$parcel_output_debug = false;
}

/////////////////////////////////////////
// NOW THE FUN STUFF
/////////////////////////////////////////

// create all data requests, but dont make the requests yet
// we start with Parcel, since we will always request parcel details
$request_layer_urls = array(
	"Parcel" => $arcgis_rest_url_base . $rest_layers["Parcel"]["layer_id"] . query_url_create($parcel_pid_list, "Parcel", $rest_layers["Parcel"]["layer_id"], $rest_layers["Parcel"]["layer_outfields"])
);

// by default we do not want to include the owners

$include_owners = false;

// initialize the feature_counts array. we always include parcel here as well
$feature_counts = array("Parcel"=>0);

// now lets see if any additional layers were requested in the layers _GET variable
$parcel_related_layer_list = "Owner";
$parcel_related_layer_list_ary = explode(",",$parcel_related_layer_list);

// test if owner is requested
if( stristr($parcel_related_layer_list,"Owner") ){
	$include_owners = true;
}

foreach($parcel_related_layer_list_ary as $layer){
	// append each layer that is requested in the query
	$request_layer_urls[$layer] = $arcgis_rest_url_base . $rest_layers[$layer]["layer_id"] . query_url_create($parcel_pid_list,$layer,$rest_layers[$layer]["layer_id"],$rest_layers[$layer]["layer_outfields"]);
	
	// add the layer to the feature counts array, setting it to 0
	$feature_counts[$layer] = 0;
}

// initialize the arrays for the rest response and the response converted to json
$rest_response = array();
$rest_response_json = array();

// iterate through the request layer url array 
foreach($request_layer_urls as $rest_layer => $rest_url){

	// make the actual REST request
	$response = file_get_contents($rest_url);
	
	// decode the JSON request, convert it to PHP object
	$response_json = json_decode($response);
	
	// save the original request and the request converted to JSON	 	
	$rest_response[$rest_layer] = $response;
	$rest_response_json[$rest_layer] = $response_json;
}

// initialize array to hold parcel object
$parcel_obj = array();

// array to hold intermediate objectIDs
$owner_int_ary = array();

// iterate through all the PHP objects converted from the JSON REST response
foreach($rest_response_json as $rest_layer => $v){

	// for each rest layer, iterate through the
	foreach($rest_response_json[$rest_layer] -> features as $feature){

		// pull in all attributes and then set current parcel..
				
		// get feature PID from current feature layer.. all layers have parcel_id reference
		$parcel_id = $feature -> attributes -> PID;
		
		// Parcel is the primary array,. there are never 2 parcels in the parcel object, so no need for multidimensional array for this object
		
		if($rest_layer == "Parcel"){
			
			// set the current parcel attributes to the features attributes object. "attributes" in not an array.. it is an object
			
			//if objects are preferred for attributes, use this
			//$parcel_obj[$parcel_id][$rest_layer]["Attributes"] = $feature -> attributes;
			
			// if an array is preferred, we use this
			foreach($feature -> attributes as $attr_field => $attr_value){
				$parcel_obj[$parcel_id][$rest_layer]["Attributes"][$attr_field] = $attr_value;
			}
			
		}
		else if($rest_layer == "Owner"){
			
			// add an owner record for the given parcel. this will later be joined with Owner table data
			$owner_int_ary[$parcel_id][] = $feature -> attributes -> OBJECTID;
			
			// as an object
			//$parcel_obj[$parcel_id][$rest_layer][$feature_counts[$rest_layer]]["Attributes"] = $feature -> attributes;

			// as an array
			foreach($feature -> attributes as $attr_field => $attr_value){				
				$parcel_obj[$parcel_id][$rest_layer][$feature_counts[$rest_layer]]["Attributes"][$attr_field] = $attr_value;
			}
		}
		else{
			
			// as object
			//$parcel_obj[$parcel_id][$rest_layer][$feature_counts[$rest_layer]]["Attributes"] = $feature -> attributes;
			
			// as an array
			foreach($feature -> attributes as $attr_field => $attr_value){				
				$parcel_obj[$parcel_id][$rest_layer][$feature_counts[$rest_layer]]["Attributes"][$attr_field] = $attr_value;
			}
		}
		
		// increment the count of the feature layer for 
		$feature_counts[$rest_layer]++;	
	}
}

	$owner_objectids_ary = array();
	// generate list of objectIds 
	foreach($owner_int_ary as $pid){
		foreach($pid as $id => $objectid){
			$owner_objectids_ary[] = $objectid;
		}
	}
	
	// assemble owner intermediate RELATIONSHIP query srting.. pull together the query, objectIds, and the outfields.. results are returned as JSON
	// realize that this query operates on the intermediate layer, but returns different results because we are doing a RelatedRecords query and providing the object IDs of intermediate records
	// ultimately the system will query owners, but we are not querying the Owner layer directly.
	$rest_query_owners_url = $arcgis_rest_url_base . $rest_layers["Owners"]["layer_id"] . "/queryRelatedRecords?objectIds=". array_comma_list($owner_objectids_ary)
		."&relationshipId=10&definitionExpression=&returnGeometry=true&maxAllowableOffset=&outSR=&outFields=".	$rest_layers["Owners"]["layer_outfields"]	."&f=json";
	
	$rest_response_owners = file_get_contents($rest_query_owners_url);
	$rest_response_owners_json = json_decode($rest_response_owners);
	
	//var_dump($rest_response_owners);
	
	// create the owner information array
	$owner_info = array();
	
	foreach($rest_response_owners_json -> relatedRecordGroups as $relatedRecordGroups){
	
		$owner_objid = $relatedRecordGroups -> objectId;
		
		foreach($relatedRecordGroups -> relatedRecords as $relatedRecord)
		{
			foreach($relatedRecord -> attributes as $attr_field => $attr_value)
			{
				$owner_info[$owner_objid][][$attr_field] = $attr_value;
			}
		}
	}

// now spit out results for each parcel.. when you get to owner layer, loop through related table based on ownerint object id
	// create table heading here.. show that it is a chart of xyz parcels and xyz layers.
	$row=2;
	foreach($parcel_obj as $parcel_id => $parcel_ary)
	{
		foreach($parcel_ary as $layer => $layer_ary)
		{
			if($layer == "Parcel")
			{	
				$col =0;
				foreach($layer_ary["Attributes"] as $layer_field => $layer_value)
				{
					switch($layer_field)
					{	
						case 'MUN_CODE': $val = lookup_mun($layer_value); break;
						default: $val = $layer_value;
					}
					echo $val;
					$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col, $row, $val);
					$col++;
				}
			}
			else
			{
				foreach($layer_ary as $layer_feature)
				{	
					if($layer == "Owner")
					{
						$owner_objectid = $layer_feature["Attributes"]["OBJECTID"];	
						$col=9;
						foreach($owner_info[$owner_objectid] as $owner_record)
						{
							foreach($owner_record as $owner_field => $owner_value)
							{
								if($owner_field=="ZIPCODE")
								{
									$objPHPExcel->getActiveSheet()->getCellByColumnAndRow($col, $row)->setValueExplicit($owner_value, PHPExcel_Cell_DataType::TYPE_STRING);
								}
								else 
									$objPHPExcel->getActiveSheet()->setCellValueByColumnAndRow($col, $row, $owner_value);
								$col++;
							}
						}
					}
				}
			}
		}
		$row++;
	}
	$styleArray = array
	(
    	'borders' => array('allborders' => array('style' => PHPExcel_Style_Border::BORDER_THIN)));
		$objPHPExcel->getActiveSheet()->getStyle
		(
			'A1:' . 
			$objPHPExcel->getActiveSheet()->getHighestColumn() . 
			$objPHPExcel->getActiveSheet()->getHighestRow()
		)->applyFromArray($styleArray);
	
	$styleArray = array('borders' => array('outline' => array('style' => PHPExcel_Style_Border::BORDER_MEDIUM)));
	$objPHPExcel->getActiveSheet()->getStyle
	(
		'A1:' . 
		$objPHPExcel->getActiveSheet()->getHighestColumn() . 
		$objPHPExcel->getActiveSheet()->getHighestRow()
	)->applyFromArray($styleArray);
	
	if($excel == true){
			$filename = "MERI_ParcelExport_" . date('Ymd') . ".xlsx"; 
			ob_clean();
			header("Content-Disposition: attachment; filename=\"$filename\"");
			header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			header('Content-Transfer-Encoding: binary');
			header('Cache-Control: max-age=0');
	        $objWriter = PHPExcel_IOFactory::createWriter($objPHPExcel, 'Excel2007');
			$objWriter->setPreCalculateFormulas(false);
			$objWriter->save('php://output');
		}

?>