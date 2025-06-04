// Main JavaScript file for Real Estate CMS

document.addEventListener('DOMContentLoaded', function() {
  // Image preview for file inputs
  const imageInput = document.getElementById('images');
  const previewContainer = document.getElementById('imagePreview');

  if (imageInput && previewContainer) {
    imageInput.addEventListener('change', function() {
      previewContainer.innerHTML = '';

      if (this.files) {
        Array.from(this.files).forEach(file => {
          if (!file.type.match('image.*')) {
            return;
          }

          const reader = new FileReader();

          reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'col-md-3 mb-3';
            preview.innerHTML = `
              <img src="${e.target.result}" class="img-thumbnail" style="height: 150px; object-fit: cover;">
            `;
            previewContainer.appendChild(preview);
          };

          reader.readAsDataURL(file);
        });
      }
    });
  }

  // Confirm delete
  const deleteButtons = document.querySelectorAll('.delete-btn');

  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Are you sure you want to delete this item?')) {
        e.preventDefault();
      }
    });
  });

  // Fix for modal flickering
  const contactAgentModal = document.getElementById('contactAgentModal');
  if (contactAgentModal) {
    // Initialize the Bootstrap modal properly
    const modal = new bootstrap.Modal(contactAgentModal, {
      backdrop: true,
      keyboard: true,
      focus: true
    });

    // Prevent default behavior of the contact agent button
    const contactAgentBtn = document.querySelector('[data-bs-target="#contactAgentModal"]');
    if (contactAgentBtn) {
      contactAgentBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.show();
      });
    }

    // Add event listener for when modal is hidden
    contactAgentModal.addEventListener('hidden.bs.modal', function() {
      // Any cleanup code if needed
    });
  }
});
