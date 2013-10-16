<?php
error_reporting(0);
if($_POST["function"] == "getPhoto")
{
	echo getPhoto();
}
else if($_POST["function"] == "logIn")
{
	echo logIn();
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
			return "http://webmaps.njmeadowlands.gov/municipal/MunicipalPhotos/Photos/no_property_photo360.jpg";
		}
	}
	else
	{
		return "http://webmaps.njmeadowlands.gov/municipal/MunicipalPhotos/Photos/no_property_photo360.jpg";	
	}
}
function logIn()
{
	$username = $_POST["username"];
	$password = $_POST["password"];
	return $username." ".$password;
}
?>


