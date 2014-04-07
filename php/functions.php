<?php
error_reporting(0);
if($_POST["function"] == "getPhoto")
{
	echo getPhoto();
}
else if($_POST["function"] == "capthca")
{
  echo capthca();
}
else if($_POST["function"] == "checkURL")
{
	echo checkURL();
}
function getPhoto()
{
	if(isset($_POST['PID']))
	{
		$path = 'http://apps.njmeadowlands.gov/images/property/PID/'.$_POST['PID'].'.jpg';
		if (getimagesize($path) !== false) 
		{
			return "http://apps.njmeadowlands.gov/images/property/PID/".$_POST['PID'].".jpg";	
		}
		else
		{
			return "http://apps.njmeadowlands.gov/images/no_photo.jpg";	
		}
	}
	else
	{
		return "http://apps.njmeadowlands.gov/images/no_photo.jpg";	
	}
}
function capthca()
{
  require_once('recaptchalib.php');
  $privatekey = "6LeJT-MSAAAAAK9TGPLP9N70HoKJaL9z-AIB_64y";
  $resp = recaptcha_check_answer ($privatekey, $_SERVER["REMOTE_ADDR"], $_POST["recaptcha_challenge_field"], $_POST["recaptcha_response_field"]);
  if (!$resp->is_valid) {
    // What happens when the CAPTCHA was entered incorrectly
    die ("The reCAPTCHA wasn't entered correctly. Go back and try it again." . "(reCAPTCHA said: " . $resp->error . ")");
  } else {
    $mysqli = new mysqli("10.1.0.237", "webmaps", "my59Ld8", "mapping_accounts") or die();
    $email = $mysqli->real_escape_string($_POST["email"]);
    if ($stmt = $mysqli->prepare("SELECT password FROM `ERIS_Auth` WHERE `email` =?"))
    {
      $stmt->bind_param("s", $email);
      $stmt->execute();
      $stmt->bind_result($password);
      $stmt->fetch();      
      $stmt->close();
    }
    if($password == null)
    {
      return 2;
    }
    else
    {
      $subject = "Municipal Map ERIS password Retrivial";
      $message = "You have requested that your password be email to you.";
      $message .= "\nYour password is: ".$password;
      $message .= "\nYou can now login into ERIS.";
      $headers = "From: noreply@njmeadowlands.gov";
      if(@mail($_POST["email"],$subject,$message,$headers))
      {
        return 1;
      }else {
        return 3;
      }
      return 1;
    }
  }
}
function checkURL()
{
	if (!$fp = curl_init($_POST["url"]))
		return false;
	else
		return true;	
}
?>


