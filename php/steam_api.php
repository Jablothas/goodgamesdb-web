<?php
$method = "";
$game = "";
$appid = "";
$remoteAllSteamGames = "http://api.steampowered.com/ISteamApps/GetAppList/v0002/?key=STEAMKEY&format=json";
$remoteOwnSteamGames = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/" .
"?key=AA558CA932F40022BC9A5B758FF37C26&steamid=76561198064631353&format=json";
$localAllSteamGames = "../games.json";
$localOwnSteamGames = "../profile.json";

if (isset($_GET['method'])) {
    $method = $_GET['method'];
}
if (isset($_GET['game'])) {
    $game = $_GET['game'];
}
if (isset($_GET['appid'])) {
    $appid = $_GET['appid'];
}

if (file_exists($localAllSteamGames)) unlink($localAllSteamGames);
if (file_exists($localOwnSteamGames)) unlink($localOwnSteamGames);

if (!file_exists($localAllSteamGames)) file_put_contents($localAllSteamGames, file_get_contents($remoteAllSteamGames));
if (!file_exists($localOwnSteamGames)) file_put_contents($localOwnSteamGames, file_get_contents($remoteOwnSteamGames));

if($method == "findOwnedGames") {
    findOwnedGames($localOwnSteamGames, $localAllSteamGames);
}

function findOwnedGames($localOwnSteamGames, $localAllSteamGames) {
    $result = [];
    $steam = file_get_contents($localAllSteamGames);
    $own = file_get_contents($localOwnSteamGames);
    $data = json_decode($steam, true);
    $applist = $data["applist"];
    $apps = $applist["apps"];

    $data = json_decode($own, true);
    $response = $data["response"];
    $games = $response["games"];
    foreach ($games as $game) {
        foreach ($apps as $app) {
            if ($app["appid"] == $game["appid"]) {
                $result[] = $app["name"] . "=" . $app["appid"];
            }
        }
    }
    header('Content-Type: application/json');
    echo trim(json_encode($result));
    exit;
}

if($method == "findPlaytime") {
    getPlaytime($appid, $localOwnSteamGames);
}

function getPlaytime($appid, $localOwnSteamGames) {
    $own = file_get_contents($localOwnSteamGames);
    $playtime = 0;
    $data = json_decode($own, true);
    $response = $data["response"];
    $games = $response["games"];
    $i = 0;
    foreach($games as $game) {
        if ($game["appid"] == $appid) {
            $playtime = intval($game['playtime_forever']);
        }
        $i += 1;
    }
    echo intval($playtime / 60);
}

function logfile($message) {
    $logFile = '../php_log.txt';
    $logEntry = date('[Y-m-d H:i:s]') . ' ' . $message . PHP_EOL;
    $file = fopen($logFile, 'a');
    fwrite($file, $logEntry);
    // Close the file
    fclose($file);
}
?>