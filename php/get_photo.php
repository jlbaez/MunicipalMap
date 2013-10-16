<?php
error_reporting(0);
if(isset($_GET['id']))
{
	$path = 'http://apps.njmeadowlands.gov/images/property/PID/'.$_GET['id'].'.jpg';
	if (getimagesize($path) !== false) 
	{
		echo "http://apps.njmeadowlands.gov/images/property/PID/".$_GET['id'].".jpg";	
	}
	else
	{
		echo "http://webmaps.njmeadowlands.gov/municipal/MunicipalPhotos/Photos/no_property_photo360.jpg";
	}
}
else
{
	echo "http://webmaps.njmeadowlands.gov/municipal/MunicipalPhotos/Photos/no_property_photo360.jpg";	
}
?>