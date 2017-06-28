<?php
require('vendor/autoload.php');

$app_id = "359042";
$app_key = "44f522b8df5a8a3ccf74";
$app_secret = "d8d561e9aafb45f2ff14";
$app_cluster = "us2";

//global $user;
//if ($user->uid) {
    $pusher = new Pusher($app_key, $app_secret, $app_id, array('cluster' => $app_cluster) );
    header('content-type: application/json; charset=utf-8');
    header("access-control-allow-origin: *");
    echo $pusher->socket_auth($_POST['channel_name'], $_POST['socket_id']);
//}
//else {
    //header('', true, 403);
    //echo "Forbidden";
//}
?>
