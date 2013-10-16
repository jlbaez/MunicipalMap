<?php 
	//check for valid ERIS SESSION	
	require_once('validate.php');
	if(validateERIS()){
		echo "YES";
		}
?>