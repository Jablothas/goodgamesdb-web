<?php

if (isset($_GET['method'])) {
    $method = $_GET['method'];

    // Call the appropriate method
    if ($method === 'get_records') {
        get_records();
    } elseif ($method === 'other_function') {
        other_function();
    } else {
        // Handle unknown method or provide an error response
        http_response_code(400);
        echo json_encode(array('error' => 'Unknown method'));
    }
} else {
    // Handle the case where the "method" parameter is not set
    http_response_code(400);
    echo json_encode(array('error' => 'Method parameter is missing'));
}

function get_records() {
    $db = new SQLite3('../data.db');
    $results = $db->query("
    SELECT 
        record_id, 
        records.name, 
        location, 
        date_start, 
        date_end,
        playtime_start,
        playtime_end,
        steam_appid,
        score,
        cover_img_path,
        dlc,
        note,
        records.status,
        replay,
        score_id,
        gameplay,
        presentation,
        narrative,
        quality,
        pacing,
        balance,
        ui_ux,
        impression,
        sum_target,
        sum_total
    FROM records
    INNER JOIN score
    ON records.score = score_id
    INNER JOIN dlc
    ON records.dlc = dlc_id
    ORDER BY date_end DESC
    ");

    $data = array(); // Initialize an array to store the result

    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        $data[] = $row; // Append each row to the result array
    }

    echo json_encode($data); // Encode the result array as JSON
}


?>
