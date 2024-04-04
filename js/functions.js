var contentMaster = document.createElement('div');
contentMaster.id = "content-master";
var recordList = [];
var locationList = [];
var playedGamesList = [];
var ratingList = [];
var filter = "std";
var keyword = "";
var editMode = false;
var hideCanceled = true;

function checkSession() {
    $.ajax({
        type: 'POST',
        url: 'php/check_session.php', 
        success: function(response) {
            if (response !== 'valid') {
                window.location.href = 'index.php'; 
            }
        }
    });
}

function redirectToLogin() {
    window.location.href = 'index.php';
}


function start() {
    checkSession();
    checkLocalStorage();
    addButton.disabled = false;
    playedGamesList = JSON.parse(localStorage.getItem('playedGamesList')) || [];
    getLocations();
    getRecords();
    fillRatingList();
    findPlayedGames();
}

function logoutButton() {
    $.ajax({
        type: 'POST',
        url: 'php/logout.php',
        success: function(response) {
            window.location.href = 'index.php';
        }
    });
}

function getRecords() {
    fetch('php/sql_connect.php?method=get_records')
      .then(response => response.json())
      .then(data => { 
          for (let i = 0; i < data.length; i++) {
              recordList.push(data[i]);
          }
          buildGrid();
      })
      .catch(error => {
          console.error('Error:', error);
      });
}

function getLocations() {
    fetch('php/sql_connect.php?method=get_locations')
    .then(response => response.json())
    .then(data => { 
        for (let i = 0; i < data.length; i++) {
            locationList.push(data[i]);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


function buildGrid() {
    checkSession();
    switch(filter) {
        case 'std':
            contentMaster.innerHTML = '';
            for (let record of recordList) {
                // Filtering
                if(record["status"] === "CANCELED" && hideCanceled) continue;
                if(record["status"] === "ENDLESS" && hideCanceled) continue;
                if(record["status"] === "PLAYING" && hideCanceled) continue;
                contentMaster.appendChild(createPanelBody(record, true));
            }
            document.body.appendChild(contentMaster);    
            break;
        case 'filterByInput':
            contentMaster.innerHTML = '';
            const keywords = keyword.split("+");
            for (let record of recordList) {
                if (record["sum_total"] === 0) {
                    continue;
                }
                for (let kw of keywords) {
                    if (kw.length > 2) {
                        if (kw.startsWith(">")) {
                            const value = parseFloat(kw.substring(1));
                            if (!isNaN(value) && value >= 0 && value <= 100 && record["sum_total"] > value) {
                                contentMaster.appendChild(createPanelBody(record, false));
                                break;
                            }
                        } else if (kw.startsWith("<")) {
                            const value = parseFloat(kw.substring(1));
                            if (!isNaN(value) && value >= 0 && value <= 100 && record["sum_total"] < value) {
                                contentMaster.appendChild(createPanelBody(record, false));
                                break; 
                            }
                        } else if (record["name"].toString().toUpperCase().includes(kw.toUpperCase())) {
                            contentMaster.appendChild(createPanelBody(record));
                            break; 
                        }
                    }
                }
            }
            document.body.appendChild(contentMaster);    
            break;
        default:
            break;
    }
}


function resetEntry() {
    cleanForm();
}


function loopRecords() {
    for (let record of recordList) {
        contentMaster.appendChild(createPanelBody(record));
    }
    document.body.appendChild(contentMaster);    
}

function addButtonClick(record) {
    checkSession();
    cleanForm();
    setRecordStatus();
    document.getElementById("saveButton").innerHTML = "";
    let modal = document.getElementById("dialogModal");
    let modalContent = document.getElementById("modal-content");
    let editModeInfo = document.getElementById("edit-mode");
    let span = document.getElementsByClassName("close")[0];
    let selectElement = document.getElementById("location");

    selectElement.innerHTML = '';
    locationList.forEach(function (location) {
    let option = document.createElement("option");
    option.text = location.name;
    selectElement.appendChild(option);
    });
    if(editMode == false) {
        editModeInfo.style.display = "none";
        modal.style.display = "inline-block";
        modalContent.style.border = "1px solid #fff";
        document.getElementById('start_date').value = getCurrentDate();
        document.getElementById("location").focus();
        document.getElementById("deleteButton").style.visibility = "hidden";
    }
    else {
        document.getElementById('img-cover-text').innerText = '';
        modal.style.display = "inline-block";
        modalContent.style.border = "1px solid #fff";
        updateForm(record);

    }
    span.onclick = function() {
        modal.style.display = "none";
        editMode = false;
    }
}


function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;
    return `${year}-${month}-${day}`;
}

function getCurrentDateLong() {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();
    let hours = today.getHours();
    let minutes = today.getMinutes();
    let seconds = today.getSeconds();

    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function logoutButtonClick() {
        notify("Logout is forbidden.", "error");
    }


function notify(msg, type) {
    $.notify(msg,  type, 
        { position:"right bottom" }
      );
}

function showLoader(op) {
    const loaderWrapper = document.getElementById("loader-wrapper");

    if (op) {
        // Show the loader
        loaderWrapper.style.display = "flex";
    } else {
        // Hide the loader
        loaderWrapper.style.display = "none";
    }
}

function filterBySearch() {
    let input = document.getElementById("searchbar").value.length
    if(input > 1) {
        filter = "filterByInput";
        keyword = document.getElementById("searchbar").value;
        buildGrid();
    }
    else {
        filter = "std";
        keyword = "";
        buildGrid();
    }
}

function switchHideCanceled() {
    if(hideCanceled) { hideCanceled = false; document.getElementById("hide-canceled-button").style.backgroundImage = 'url(\'img/buttons/unfiltered.png\')'; }
    else { hideCanceled = true; document.getElementById("hide-canceled-button").style.backgroundImage = 'url(\'img/buttons/filtered.png\')'; }
    buildGrid();
}

function findPlayedGames() {
    if(playedGamesList.length > 0) {
        addSuggestionsToList();
        return;
    }
    // disabled while developing 
    addButton.disabled = true;
    notify("Fechting data from Steam... this may take a while.", "warn");
    var method = "findOwnedGames";
    $.ajax({
        url: 'php/steam_api.php',
        type: 'GET',
        data: { method: method },
        dataType: 'text', // Change dataType to 'text'
        success: function (response) {
            var data = JSON.parse(response);
            console.log(data);
            for (let i = 0; i < data.length; i++) {
                playedGamesList.push(data[i]);
            }
            addSuggestionsToList();
            const addButton = document.getElementById("addButton");
            addButton.disabled = false;
            localStorage.setItem('playedGamesList', JSON.stringify(playedGamesList));
            setLastUpdate();
            notify("Data fetched from Steam.", "success");

        },
        error: function (request, error) {
            alert("Error Request: " + error + " - - Request: " + JSON.stringify(request));
            addButton.disabled = false;
        }
    });
}

function addSuggestionsToList() {
    removeDuplicates();
    var datalist = document.getElementById("games-list");
    datalist.innerHTML = '';
    playedGamesList.forEach(function (game) {
        var option = document.createElement("option");
        option.value = game.split('=')[0];
        datalist.appendChild(option);
    });
}

function removeDuplicates() {
    var uniqueGamesSet = new Set(playedGamesList);
    playedGamesList = Array.from(uniqueGamesSet);
}

function fillRatingList() {
    ratingList.push("gameplay");
    ratingList.push("presentation");
    ratingList.push("narrative");
    ratingList.push("quality");
    ratingList.push("sound");
    ratingList.push("content");
    ratingList.push("pacing");
    ratingList.push("balance");
    ratingList.push("ui_ux");
    ratingList.push("impression");
}

function setLastUpdate() {
    const currentDate = getCurrentDateLong();
    localStorage.setItem('lastUpdate', JSON.stringify(currentDate));
}

function checkLocalStorage() {
    checkSession();
    const storedDateStr = localStorage.getItem('lastUpdate');
    const updateMsg = localStorage.getItem('updateMsg');
    if (updateMsg != null) {
        var updatedMsg = updateMsg.replace(/"/g, '');
        notify(updatedMsg, "success"); 
    }
    localStorage.removeItem('updateMsg');
    if (storedDateStr) {
        const storedDate = new Date(JSON.parse(storedDateStr));
        const timeDifference = new Date() - storedDate;
        if (timeDifference > 3600000) {
            cleanLocalStorage();
        }
    }
    if(storedDateStr === null || storedDateStr == '') cleanLocalStorage();
}

function cleanLocalStorage() {
    localStorage.removeItem('lastUpdate');
    localStorage.removeItem('playedGamesList');
    notify("Local data is outdated and has been deleted.")
}

function calcDaysBetweenDates(startDate, endDate) {
    // Parse the date strings to create Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    // Set the time to midnight for both dates
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(0, 0, 0, 0);
    // Calculate the time difference in milliseconds
    const timeDifference = endDateObj - startDateObj;
    // Calculate the number of days, including the start and end days
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24)) + 1;
    return days;
}

function countPlaythroughs(name) {
        const filteredRecords = recordList.filter(record => record["name"] === name);
        return filteredRecords.length;
}

function askForDelete() {
    Swal.fire({
        title: 'Do you really want to delete this record?',
        icon: null,
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, go back!',
        customClass: {
            popup: 'swal-popup-class',
            title: 'swal-title-class',
            content: 'swal-content-class',
            confirmButton: 'swal-confirm-button-class',
            cancelButton: 'swal-cancel-button-class',
        }
    }).then((result) => {
        if (result.isConfirmed) {
            deleteRecord();
        } else {
            // User clicked "No, go back" or closed the dialog
            // Handle any additional logic here if needed
        }
    });
}

function deleteRecord() {
    let recordId = document.getElementById("record-id").value;
    try {
        sqlDeleteRequest(recordId)
        .then(() => {
            let modal = document.getElementById("dialogModal");
            modal.style.display = "none";
            filter = "std";
            let updateMsg = document.getElementById("title").value + ' has been deleted.';
            editMode = false;
            localStorage.setItem('playedGamesList', JSON.stringify(playedGamesList));
            localStorage.setItem('updateMsg', JSON.stringify(updateMsg));
            // Reload the page only after updating playedGamesList
            window.location.href = window.location.href;
        })
        .catch(error => {
            console.error("Error:", error);
            notify("Something went terribly wrong: " + error.message, "warn");
        }); 
    } catch (error) {
        console.error("Error in try block:", error);
        notify("Something went terribly wrong...", "warn");
    }
}

function sqlDeleteRequest(recordId) {
    return new Promise((resolve, reject) => {
        let jsonData = JSON.stringify({ record_id: recordId });
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "php/sql_delete.php", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let response = JSON.parse(xhr.responseText);
                    resolve(response.title);
                } else {
                    reject(new Error("Failed to make the request. Status: " + xhr.status));
                }
            }
        };
        // Send the JSON data to the server
        xhr.send(jsonData);
    });
}

function countEntriesByYear(targetYear) {
    if (typeof targetYear !== 'number') {
        console.error('Invalid input for targetYear. Please provide a valid number.');
        return 0;
    }
    const filteredEntries = recordList.filter(entry => {
        if (entry && entry["date_end"] && entry["status"] != "CANCELED" && entry["status"] != "ENDLESS") {
            const year = new Date(entry["date_end"]).getFullYear();
            return year === targetYear;
        }
        return false;
    });
    return filteredEntries.length;
}
function countPlaythroughsByName(name, targetDate) {
    const filteredList = recordList.filter(record => record.name === name);
    const sortedList = [...filteredList].sort((a, b) => new Date(a.date_end) - new Date(b.date_end));
    const index = sortedList.findIndex(record => record.date_end === targetDate);
    return index + 1;
}