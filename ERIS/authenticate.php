<?php 
//
// Authentication function
//
// Checks userName and password, updates db if pass, builds cookie for long-term auth
//
function authenticate($user, $pass){
	//vars	
	$user = strtolower($user);
	$pass = strtolower($pass);
	
	// Make a MySQL Connection
	mysql_connect("10.1.0.237", "webmaps", "my59Ld8", "mapping_accounts") or die();
	mysql_select_db("mapping_accounts") or die();

	//query & results
	$sql = sprintf("SELECT * FROM `ERIS_Auth` WHERE `userName` = '%s' AND `password` = '%s' LIMIT 1;",mysql_real_escape_string($user), mysql_real_escape_string($pass));
	$result = mysql_query($sql)	or die();  
	$num_rows = mysql_num_rows($result);
	
	//if record exists
	if($num_rows == 1){
		//update record in DB with new date stamp
		$row = mysql_fetch_array($result);
			$dateStamp = date('m-d-Y');
			$authCount = $row['authCount'] + 1;
			$userID = $row['UID'];
			$cookieKey = RandomId('8').'-'.RandomId('4').'-'.RandomId('8');
		$sql = sprintf("UPDATE `mapping_accounts`.`ERIS_Auth` SET `sessionDate` = '%s',`authCount` = '%s', `cookieValue` = '%s' WHERE `ERIS_Auth`.`UID` = '%s';", 
			mysql_real_escape_string($dateStamp), mysql_real_escape_string($authCount),  mysql_real_escape_string($cookieKey),  mysql_real_escape_string($userID));		
		mysql_query($sql)	or die();
		//build the authentication cookie
		setcookie("NJMC_MERI_ERIS", $cookieKey, (date('U') + 31556926), '/',"localhost"); //31 556 926 = 1 year
		setcookie('ERIS_ACCOUNT', encryptCookie($user), (date('U') + 31556926), '/', "localhost");
		return true;
	}
}
function encryptCookie($value){
   if(!$value){return false;}
   $key = 'The Line Secret Key';
   $text = $value;
   $iv_size = mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_ECB);
   $iv = mcrypt_create_iv($iv_size, MCRYPT_RAND);
   $crypttext = mcrypt_encrypt(MCRYPT_RIJNDAEL_256, $key, $text, MCRYPT_MODE_ECB, $iv);
   return trim(base64_encode($crypttext)); //encode for cookie
}
//
// Random ID/Key for cookie
//
function RandomId($length){
	$random_string = ''; 
	for($i=0; $i < $length; $i++){
		$range = rand(1,3);
		if($range == 1){ //numbers
			$random_string .= rand(0,9);
		}
		if($range == 2){ //lowercase
			$random_string .= chr(rand(0,25)+65);
		}
		if($range == 3){ //upercase
			$random_string .= chr(rand(0,25)+97);
		}
		
	}

return $random_string;
} 
/////////////////
// RUN RUN RUN //
/////////////////
//vars
$password = $userName = NULL;
$output = '{"response": false}';
if(isset($_POST['userName'])){
	$userName = $_POST['userName'];
}
if(isset($_POST['password'])){
	$password = $_POST['password'];
}

if($userName && $password){
	if(authenticate($userName, $password)){
		$output = '{"response": true, "username": "'.$userName.'"}';
	};
}
//exit with output
echo $output;
?>
