<?php
session_start();
require_once 'php/Mobile_Detect.php';
$detect = new Mobile_Detect;
$_SESSION['isMobile'] = false;
if($detect->isMobile()) {
	$_SESSION['isMobile'] = true;
}
$Load = 'municipal_2013_v31';
if(isset($_GET['version'])){
	$ver = $_GET['version'];
	$versions['new'] = 'municipal_2013_v31';
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
$_SESSION['isERIS'] = false;
if(validateERIS()){
	$_SESSION['isERIS'] = true;
}
require_once('versions/'.$Load.'.php');
?>
