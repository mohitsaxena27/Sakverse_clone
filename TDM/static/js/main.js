// static/js/main.js

// Handle form submissions (for data entry)
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("dataEntryForm");

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = {};

            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Submit form data via fetch API
            fetch("/data-entry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                alert("Data submitted successfully!");
            })
            .catch((error) => {
                alert("Error submitting data.");
                console.error("Error:", error);
            });
        });
    }
});
