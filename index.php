<?php 
$Load = 'municipal_2013_v3';
//Loading older versions
if(isset($_GET['version'])){
	$ver = $_GET['version'];	
	//possible versions of the map
	$versions['new'] = 'municipal_2013_v3';
	//checks	
	$latestRelease = 0;
	foreach($versions as $release => $filePath){
		if($ver == 'current'){
			if($release > $latestRelease){
				$latestRelease = $release;
				$Load = $filePath;
			}			
		}
		if($ver == $release){
				$Load = $filePath;
		}	
	}
}
//ERIS check
require_once('ERIS/validate.php');
if(validateERIS()){
	$AUTH = true;
	$Load = 'ERIS_v3';
	
	//ERIS BETA
	/*if(isset($ver)){
		if($ver == '2.6E'){
			$Load = 'ERIS_2013_v2';
		}
	}*/
}

//Current working/published version of the MAP
//

require_once('versions/'.$Load.'.html');
?>