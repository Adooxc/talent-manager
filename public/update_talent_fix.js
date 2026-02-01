function updateTalent() {
    try {
        const editingIndex = parseInt(localStorage.getItem('editingTalentIndex'));
        if (editingIndex === null || isNaN(editingIndex) || !talents[editingIndex]) {
            alert('Error: Talent not found');
            return;
        }

        const talent = talents[editingIndex];
        const talentId = talent.id || editingIndex;
        
        // Get all form values
        const nameValue = document.getElementById('edit-talent-name').value.trim();
        if (!nameValue) {
            alert('Please enter talent name');
            return;
        }
        
        const categoryValue = document.getElementById('edit-talent-category').value.trim();
        if (!categoryValue) {
            alert('Please select a category');
            return;
        }
        
        const priceValue = document.getElementById('edit-talent-price').value.trim();
        if (!priceValue) {
            alert('Please enter price');
            return;
        }

        // Update talent object
        talent.name = nameValue;
        talent.category = categoryValue;
        talent.price = parseFloat(priceValue);
        talent.gender = document.getElementById('edit-talent-gender').value || '';
        talent.birthdate = document.getElementById('edit-talent-birthdate').value || '';
        talent.phone = document.getElementById('edit-talent-phone').value || '';
        talent.instagram = document.getElementById('edit-talent-instagram').value || '';
        talent.tiktok = document.getElementById('edit-talent-tiktok').value || '';
        talent.height = parseFloat(document.getElementById('edit-talent-height').value) || 0;
        talent.weight = parseFloat(document.getElementById('edit-talent-weight').value) || 0;
        talent.chest = parseFloat(document.getElementById('edit-talent-chest').value) || 0;
        talent.waist = parseFloat(document.getElementById('edit-talent-waist').value) || 0;
        talent.hips = parseFloat(document.getElementById('edit-talent-hips').value) || 0;
        talent.shoe = parseFloat(document.getElementById('edit-talent-shoe').value) || 0;
        talent.hair = document.getElementById('edit-talent-hair').value || '';
        talent.eyes = document.getElementById('edit-talent-eyes').value || '';
        talent.skills = document.getElementById('edit-talent-skills').value || '';

        // Save media items
        if (editMediaItems.length > 0) {
            talentMediaItems[talentId] = [...editMediaItems];
        } else {
            delete talentMediaItems[talentId];
        }

        // Save to localStorage
        localStorage.setItem('talents', JSON.stringify(talents));
        localStorage.setItem('talentMediaItems', JSON.stringify(talentMediaItems));
        localStorage.removeItem('editingTalentIndex');
        
        // Reset state
        editMediaItems = [];
        editPrimaryMediaIndex = 0;
        
        // Navigate back
        showTab('talents-tab');
        renderTalents();
    } catch (error) {
        console.error('Error updating talent:', error);
        alert('Error updating talent: ' + error.message);
    }
}
