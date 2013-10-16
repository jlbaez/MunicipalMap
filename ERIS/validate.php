<?php 
function validateERIS(){
	if(isset($_COOKIE['NJMC_MERI_ERIS'])){
		// Make a MySQL Connection
		mysql_connect("10.1.0.237", "webmaps", "my59Ld8", "mapping_accounts") or die();
		mysql_select_db("mapping_accounts") or die();
		
		$ERIS_Key = $_COOKIE['NJMC_MERI_ERIS'];
		$sql = sprintf("SELECT * FROM `ERIS_Auth` WHERE `cookieValue` = '%s' LIMIT 1;",mysql_real_escape_string($ERIS_Key));
		
		$result = mysql_query($sql)	or die();  
		$num_rows = mysql_num_rows($result);
		
		//if record exists
		if($num_rows == 1){
			return true;	
		}
	}	
}

?>