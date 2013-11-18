<?php 
$Load = 'municipal_2013_v3';
if(isset($_GET['version'])){
	$ver = $_GET['version'];
	$versions['new'] = 'municipal_2013_v3';
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
require_once('ERIS/validate.php');
if(validateERIS()){
	$AUTH = true;
	$Load = 'ERIS_v3';
}
require_once('versions/'.$Load.'.html');
?>