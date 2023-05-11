document.addEventListener('DOMContentLoaded', function() {
    // Add another allergy
    var addAllergyBtn = document.getElementById('add-allergy');
    addAllergyBtn.addEventListener('click', function() {
      var allergiesContainer = document.getElementById('allergies-container');
      var newAllergyDiv = document.createElement('div');
      newAllergyDiv.classList.add('form-group', 'mb-2');
      var newAllergyInput = document.createElement('input');
      newAllergyInput.type = 'text';
      newAllergyInput.classList.add('form-control');
      newAllergyInput.name = 'allergy[]';
      newAllergyInput.placeholder = 'Enter another allergy';
      newAllergyDiv.appendChild(newAllergyInput);
      allergiesContainer.appendChild(newAllergyDiv);
    });
    
    // Add selected allergy or dietary restriction to display list
    var selectDiet = document.querySelector('select[name="diet"]');
    selectDiet.addEventListener('change', function() {
      var selected = selectDiet.value;
      if (selected !== '') {
        var selectedAllergiesDietary = document.getElementById('selected-allergies-dietary');
        var newListItem = document.createElement('li');
        newListItem.classList.add('list-group-item', 'mb-2');
        newListItem.textContent = selected;
        var deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'float-right', 'delete-item');
        deleteBtn.textContent = 'Delete';
        newListItem.appendChild(deleteBtn);
        selectedAllergiesDietary.appendChild(newListItem);
      }
    });
    
    // Delete item from display list
    document.addEventListener('click', function(event) {
      if (event.target && event.target.classList.contains('delete-item')) {
        event.target.parentElement.remove();
      }
    });
  });