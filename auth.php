<?php
require('vendor/autoload.php');

$app_id = "359042";
$app_key = "44f522b8df5a8a3ccf74";
$app_secret = "d8d561e9aafb45f2ff14";
$app_cluster = "us2";

$pusher = new Pusher($app_key, $app_secret, $app_id, array('cluster' => $app_cluster) );
header('content-type: application/json; charset=utf-8');
header("access-control-allow-origin: *");
$user_id = uniqid();
$presence_data = array('name' => $_GET['name']);
echo $pusher->presence_auth($_POST['channel_name'], $_POST['socket_id'], $user_id, $presence_data);
?>
