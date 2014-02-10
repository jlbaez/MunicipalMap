<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<title>NJMC Parcel Map - Dynamic Map Service</title>
		<link rel="stylesheet" type="text/css" href="../css/parcel_info.css" />
		<script src="http://js.arcgis.com/3.6compact/"></script>
<script>
			var PID = <?php echo $_GET['PID']; ?>;
		</script>
		<script src="../js/parcel_info.js"></script>
	</head>
	<body>
		<div class="header">Property Factsheet:<div id="property"></div></div>
		<div class="content" id="content">
			<div class="left">
				<ul id="uParcel">
					<li class="dataGroupHeader">Parcel</li>			
				</ul>
				<ul id="uOwner">
					<li class="dataGroupHeader">Owner</li>			
				</ul>
				<ul id="uLand">
					<li class="dataGroupHeader">Land Use</li>			
				</ul>
				<ul id="uZoning">
					<li class="dataGroupHeader">Zoning</li>			
				</ul>
				<ul id="uBuilding">
					<li class="dataGroupHeader">Building</li>			
				</ul>
				<ul id="uInfo">
					<li class="dataGroupHeader">Related Info</li>			
				</ul>
			</div>
			<div class="right"> 
				<div id="map" class="map"></div>
				<div id="photo" class="photo"></div>
			</div>  
		</div>
		<footer class="footer">
			<div class="toggle">
				<a href="#" onclick="return false;" id="toggle_large"><img src="../css/img/print_layout_bttn.png" alt="Error"/>Change Print Layout</a> | 
				<a href="#" onclick="return false;" id="toggle_aerial"><img src="../css/img/print_layout_bttn.png" alt="Error"/>Toggle to aerial map</a>
			</div>			
		</footer>
	</body>
</html>
