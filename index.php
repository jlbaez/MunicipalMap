<?php
session_start();
require_once 'php/Mobile_Detect.php';
$detect = new Mobile_Detect;
$_SESSION['isMobile'] = false;
if($detect->isMobile()) {
	$_SESSION['isMobile'] = true;
}
$_SESSION['ios'] = false;
if( $detect->isiOS() ){
	$_SESSION['ios'] = true;
}
require_once('../ERIS/validate.php');
$_SESSION['isERIS'] = false;
if(validateERIS()){
	$_SESSION['isERIS'] = true;
}
require_once('versions/Municipal_v31.php');
?>
