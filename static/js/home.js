// creates table with updated information
function makeTable(items) {
  const table = document.querySelector('#todotable tbody');
  table.innerHTML = ''; // Clear the table content

  items.forEach(item => {
    const row = document.createElement('tr');
    const deadline = new Date(item.deadline).toISOString().split('T')[0]; // format date 
    const isChecked = item.status === 1 ? 'checked' : '';

    row.innerHTML = `
      <td style="text-align: center; vertical-align: middle;">
        <label>
          <input type="checkbox" ${isChecked} data-id="${item.id}" class="status-checkbox">
        </label>
      </td>   
      <td style="text-align: center; vertical-align: middle;">${item.todo_item}</td>
      <td style="text-align: center; vertical-align: middle;">${deadline}</td>
      <td style="text-align: center; vertical-align: middle;">
        <button id="edit-${item.id}" class="editButton">Edit</button>
      </td>
      <td style="text-align: center; vertical-align: middle;">
        <button id="delete-${item.id}" class="deleteButton">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });


}

fetch('/ToDoList')
  .then(response => response.json())
  .then(items => {
    makeTable(items);
    console.log('Fetched items:', items);
    document.querySelector('#todotable').addEventListener('change', (e) => {
      if (e.target.classList.contains('status-checkbox')) {
        const taskId = e.target.dataset.id;
        const newStatus = e.target.checked ? 1 : 0; // Determine new status (1 = done, 0 = not done)

        console.log(`Updating task ${taskId} with status ${newStatus}`);

        // Send the PUT request to update the status
        fetch(`/updateStatus/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
          .then((response) => {
            if (response.ok) {
              console.log(`Task ${taskId} updated to status ${newStatus}`);
            }
            else {
              console.error(`Failed to update task ${taskId}`);
              e.target.checked = !e.target.checked; // Revert checkbox if update fails
            }
          })
          .catch((err) => {
            console.error(`Error updating task ${taskId}: ${err}`);
            e.target.checked = !e.target.checked; // Revert checkbox if there's an error
          });
      }
    });

  })
  .catch(error => console.error('Request Failed', error));

// sort by deadline 
function sortDeadline() {
  fetch('/sort-deadline') // Fetch sorted tasks
    .then(response => response.json())
    .then(items => {
      makeTable(items); // create sorted table 
    })
    .catch(error => console.error('Error fetching sorted tasks:', error));
}

// dropdown visibility
function dropdown() {
  document.getElementById('drop').classList.toggle('show');
}

// Close dropdown
window.onclick = function (event) {
  if (!event.target.matches('.dropbtn')) {
    const dropdowns = document.getElementsByClassName('dropdown-content');
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('show');
    }
  }
};

function fetchTasks(url) {
  fetch(url)
    .then(response => response.json())
    .then(items => {
      makeTable(items);
    })
    .catch(error => console.error('Error fetching tasks:', error));
}

document.querySelector('#todotable').addEventListener('click', (e) => {
  if (e.target.tagName == 'BUTTON' && e.target.innerHTML == "Delete") {  // get button tag
    const itemId = e.target.id.split('-')[1];

    fetch(`/delete/${itemId}`, { method: 'DELETE', }) // call delete route
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete item');;
        console.log("Item deleted");

        e.target.closest('tr').remove();
      })
      .catch(error => console.error("Error deleting item:", error));
  }
  else if (e.target.tagName == 'BUTTON' && e.target.innerHTML == "Edit") {  // get button tag
    const itemId = e.target.id.split('-')[1];
    console.log(`Editing item with ID: ${itemId}`);

    window.location.href = `/edit-task/${itemId}`;
  }
});
