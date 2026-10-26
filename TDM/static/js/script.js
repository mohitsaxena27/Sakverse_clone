$(document).ready(function() {
    // Load data on page load
//    loadData();
 var columnNames = [];
$("#openrepopopup").click(function(){
                $("#repomodel").show();
            });

            // Close the popup
            $("#closePopup").click(function(){
                $("#repomodel").hide();
            });

$("#uploadtabledata").click(function(){
                 var table_id = $('#table_id_dtaupload').val();
//                 var file=$('#table_id_dtaupload').files[0];
                 const fileInput = $('#dataFile')[0]; // Get the DOM element
                    const file = fileInput.files[0];
                 if (!file) {
        alert('Please select a file to upload');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_id', table_id);
    try {
        // Make the POST request to your API
        const response = fetch('/upload_excel', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const result = response.json();
            console.log('File uploaded successfully:', result);
        } else {
            console.error('File upload failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error during the file upload:', error);
    }
            });

            // Close the popup
            $("#closePopup").click(function(){
                $("#repomodel").hide();
            });
$("#opentablepopup").click(function(){
                $("#tablemodel").show();
                var dropdown = $('#repolist');
                dropdown.empty(); // Clear any existing options
                fetch('/api/repositories')
                    .then(response => response.json())
                    .then(data => {
                            data.repositories.forEach(repo => {
                                    index= repo.repo_id;
                                    value=repo.repo_name;
                                  dropdown.append('<option value="'+index+'">'+value+'</option>');
                                 });
                         });
                         });
                          // Handle adding column names after form is loaded
        $('#add-column-btn').click(function() {
            var columnName = $('#column-input').val();
            if (columnName) {
                columnNames.push(columnName);
                $('#column-input').val('');  // Clear input after adding

                // Update the column list UI
                var columnList = $('#column-list');
                columnList.empty();  // Clear existing list
                $.each(columnNames, function(index, value) {
                    columnList.append('<li>' + value + '</li>');
                });

                // Update the hidden input with the column names
                $('#column-names-input').val(columnNames.join(','));
            } else {
                alert('Please enter a column name.');
            }
        });
  $("#closetablePopup").click(function(){
                $("#tablemodel").hide();
            });

            // Submit the form and call the API createtable
            $("#createrepo").click(function(){
                var textValue = $("#textField").val();

                $.ajax({
                    url: "/repository",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ "name": textValue }),
                    success: function(response) {
                        // Show the success message
                        $("#successMessage h3").text(response.message);
                        $("#successMessage").show();
                        $("#repomodel").hide();// Close the popup
                        window.location.reload();
                    },
                    error: function() {
                        alert('Error occurred while submitting.');
                    }
                });
            });

             $("#createtable").click(function(){
                var droplist = $("#repolist");
                var table_name=$("#table_name").val();
                var repoid = droplist.val();
                var listofcolumns=$('#column-names-input').val();

                $.ajax({
                    url: "/createtable",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ "repo_id": repoid ,"table_name":table_name,"columns":listofcolumns}),
                    success: function(response) {
                        // Show the success message
                        $("#successMessage h3").text(response.message);
                        $("#successMessage").show();
                        $("#repomodel").hide();// Close the popup
                        window.location.reload();
                    },
                    error: function() {
                        alert('Error occurred while submitting.');
                    }
                });
            });
    // Handle form submission
    $('#data-form').on('submit', function(e) {
        e.preventDefault();
        const table = $('#table').val();
        const data = $('#data').val();
        $.post('/api/data', { table: table, data: data })
            .done(function() {
                loadData();
                $('#data-form')[0].reset();
            })
            .fail(function() {
                alert('Error submitting data');
            });
    });

    // Refresh button functionality
    $('#refresh-button').on('click', function() {
        loadData();
    });

    // Export button functionality (dummy example)
    $('#export-button').on('click', function() {
        alert('Export functionality is not implemented yet!');
    });
});

    document.addEventListener('DOMContentLoaded', function() {
    fetchRepositories();
}
);

//function toggle(){
//const repoToggles = document.querySelectorAll('.repo-toggle');
//
//// Add a click event listener to each toggle
//repoToggles.forEach(toggle => {
//    toggle.addEventListener('click', function () {
//        const childList = this.nextElementSibling; // Get the child <ul> (sibling of the clicked <span>)
//
//        // Toggle the display of the child list
//        if (childList.style.display === 'block') {
//            childList.style.display = 'none'; // Hide if currently displayed
//        } else {
//            childList.style.display = 'block'; // Show if currently hidden
//        }
//    });
//});



// Function to load data from the server
function loadData() {
    $.get('/api/data', function(data) {
        $('#data-list').empty();
        data.forEach(item => {
            $('#data-list').append(`<tr><td>${item.table}</td><td>${item.data}</td></tr>`);
        });
    });
}


function fetchRepositories() {
    fetch('/api/repositories')
        .then(response => response.json())
        .then(data => {
            const repoList = document.getElementById('repo-list');
            data.repositories.forEach(repo => {
                // Create a list item for the repository
                const li = document.createElement('li');
                const span=document.createElement('span');
                span.className = 'repo-toggle';
                span.innerHTML = `<i class="fa-solid fa-folder"></i><a href="#" onclick="loadtables(${repo.repo_id})"> ${repo.repo_name} </a>`;
                li.appendChild(span);
                // Create a sublist for tables

                repoList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching repositories:', error));
}



function loadtables(id) {

    fetch(`/api/tables/${id}`)
        .then(response => response.json())
        .then(data => {
            const repoList = document.getElementById('tables');
            repoList.innerHTML="";
             document.getElementById('grid-container').innerHTML="";
            data.tables.forEach(table => {
                // Create a list item for the repository

                const span=document.createElement('span');
                span.className = 'repo-toggle';
                span.innerHTML = `<i class="fa-solid fa-table"></i><br><a href="#" onclick="data(${table.table_id})">${table.table_name}</a>`;
                repoList.appendChild(span);
                // Create a sublist for tables


            });
        })
        .catch(error => console.error('Error fetching repositories:', error));
}

function data(id) {

   fetch(`/datagrid/${id}`)
            // Fetch the HTML from the /grid endpoint
           .then(response => response.text())  // Fetch the HTML from the /grid endpoint
            .then(html => {
                // Insert the fetched grid into the grid-container div
                document.getElementById('grid-container').innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching the grid:', error);
            });

}


function dataform(id) {

   fetch(`/dataenterygrid/${id}`)
            // Fetch the HTML from the /grid endpoint
           .then(response => response.text())  // Fetch the HTML from the /grid endpoint
            .then(html => {
                // Insert the fetched grid into the grid-container div
                document.getElementById('grid-container').innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching the grid:', error);
            });

}


function uploadform(id) {

   fetch(`/dataenterygrid/${id}`)
            // Fetch the HTML from the /grid endpoint
           .then(response => response.text())  // Fetch the HTML from the /grid endpoint
            .then(html => {
                // Insert the fetched grid into the grid-container div
                document.getElementById('grid-container').innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching the grid:', error);
            });

}

function uploaddata(id) {
var itemId = id;

        document.getElementById('table_id_dtaupload').value = itemId;
}

function downloaddata(id) {
    var tableId = id;  // Assuming table_id is passed from Flask to the template
    var downloadUrl = '/download/' + tableId;

    fetch(downloadUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();  // Convert the response to a Blob
        })
        .then(blob => {
            // Create a new Blob object to trigger the download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'data_grid.xlsx';  // Set the desired file name
            document.body.appendChild(a);
            a.click();  // Trigger the download
            window.URL.revokeObjectURL(url);  // Clean up after the download
        })
        .catch(error => {
            console.error('There was an error during the fetch operation:', error);
        });
}
function submitData(id) {
    // Get the table body
    const tbody = document.getElementById('dataform');

    // Create an object to hold the data
    const payload = {
        table_id: id,
        data: {}
    };

    // Get all rows in the tbody
    const rows = tbody.getElementsByTagName('tr');

    // Iterate through each row
    for (let row of rows) {
        // Get all input fields in the current row
        const inputs = row.getElementsByTagName('input');

        // Iterate through each input field
        for (let input of inputs) {
            // Add the value to the payload object using the input's name as the key
            // Use a unique key for each entry (e.g., c1_1, c1_2) if there are multiple records
            payload.data[input.name] = input.value; // Change this line if you need to handle multiple entries
        }
    }

    // Log the payload to the console (or use it as needed)
    console.log(JSON.stringify(payload));
    $.ajax({
                    url: "/data",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(payload),
                    success: function(response) {
                        // Show the success message
                        $("#successMessage h3").text(response.message);
                        $("#successMessage").show();
                        $("#repomodel").hide();// Close the popup
                        window.location.reload();
                    },
                    error: function() {
                        alert('Error occurred while submitting.');
                    }
                });



}





